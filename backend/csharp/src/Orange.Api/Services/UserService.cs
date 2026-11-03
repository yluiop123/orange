using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Api.Services;

public sealed class UserService
{
    private static readonly HashSet<string> SortFields = new(StringComparer.Ordinal)
    {
        "id", "name", "username", "email", "status", "createTime", "updateTime"
    };

    private static readonly HashSet<string> FilterFields = new(StringComparer.Ordinal)
    {
        "name", "username", "email", "phone", "status"
    };

    private readonly OrangeDbContext _db;
    private readonly PasswordHasher _passwordHasher;
    private readonly GrantGuard _grantGuard;
    private readonly LoginAttemptService _loginAttempts;
    private readonly CurrentUserAccessor _currentUser;
    private readonly UserLoader _userLoader;

    public UserService(
        OrangeDbContext db,
        PasswordHasher passwordHasher,
        GrantGuard grantGuard,
        LoginAttemptService loginAttempts,
        CurrentUserAccessor currentUser,
        UserLoader userLoader)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _grantGuard = grantGuard;
        _loginAttempts = loginAttempts;
        _currentUser = currentUser;
        _userLoader = userLoader;
    }

    public async Task<PageData<UserBean>> QueryAsync(QueryUserRequest request, CancellationToken cancellationToken)
    {
        var (page, size, skip) = Pagination.Resolve(request.Page, request.Size);
        var query = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var pattern = QueryUtils.LikePrefix(request.Keyword);
            query = query.Where(user =>
                (user.Name != null && EF.Functions.ILike(user.Name, pattern, "\\"))
                || EF.Functions.ILike(user.Username, pattern, "\\")
                || (user.Email != null && EF.Functions.ILike(user.Email, pattern, "\\"))
                || (user.Phone != null && EF.Functions.ILike(user.Phone, pattern, "\\")));
        }

        if (!string.IsNullOrWhiteSpace(request.FilterField))
        {
            if (!FilterFields.Contains(request.FilterField))
            {
                throw new BusinessException("不支持的过滤字段");
            }
            var pattern = QueryUtils.LikePrefix(request.FilterValue);
            query = request.FilterField switch
            {
                "name" => query.Where(user => user.Name != null && EF.Functions.ILike(user.Name, pattern, "\\")),
                "username" => query.Where(user => EF.Functions.ILike(user.Username, pattern, "\\")),
                "email" => query.Where(user => user.Email != null && EF.Functions.ILike(user.Email, pattern, "\\")),
                "phone" => query.Where(user => user.Phone != null && EF.Functions.ILike(user.Phone, pattern, "\\")),
                _ => query.Where(user => EF.Functions.ILike(user.Status, pattern, "\\"))
            };
        }

        if (!string.IsNullOrEmpty(request.Status) && request.Status != EffectivePermissions.StatusAll)
        {
            query = query.Where(user => user.Status == request.Status);
        }
        if (!string.IsNullOrEmpty(request.GroupId))
        {
            var pattern = QueryUtils.LikePrefix(request.GroupId);
            query = query.Where(user => user.GroupId != null && EF.Functions.ILike(user.GroupId, pattern, "\\"));
        }

        var (sortBy, ascending) = ResolveSort(request.Sort, request.OrderField, request.Direction, request.OrderValue);
        var total = await query.LongCountAsync(cancellationToken);
        var users = await ApplyOrder(query, sortBy, ascending)
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        var groupNames = await _db.Groups.AsNoTracking()
            .ToDictionaryAsync(group => group.Id, group => group.Name ?? "", cancellationToken);

        var beans = users.Select(user => new UserBean
        {
            Id = user.Id,
            Name = user.Name,
            Username = user.Username,
            Email = user.Email,
            GroupId = user.GroupId,
            GroupName = user.GroupId is not null ? groupNames.GetValueOrDefault(user.GroupId, "") : "",
            Phone = user.Phone,
            Status = user.Status,
            CreateTime = user.CreateTime,
            UpdateTime = user.UpdateTime
        }).ToList();

        return PageData<UserBean>.Of(total, beans, page, size);
    }

    public async Task<UserBean> GetAsync(string id, CancellationToken cancellationToken)
    {
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("用户不存在");

        var bean = new UserBean
        {
            Id = user.Id,
            Name = user.Name,
            Username = user.Username,
            Email = user.Email,
            GroupId = user.GroupId,
            GroupName = await ResolveGroupNameAsync(user.GroupId, cancellationToken),
            Phone = user.Phone,
            Status = user.Status,
            CreateTime = user.CreateTime,
            UpdateTime = user.UpdateTime
        };

        bean.Roles = await (
                from link in _db.UserRoles.AsNoTracking()
                join role in _db.Roles.AsNoTracking() on link.RoleId equals role.Id
                where link.UserId == id
                orderby role.Id
                select new UserRoleBean { Id = role.Id, Name = role.Name })
            .ToListAsync(cancellationToken);
        bean.Permissions = await _db.UserPermissions.AsNoTracking()
            .Where(link => link.UserId == id)
            .OrderBy(link => link.PermissionId)
            .Select(link => link.PermissionId)
            .ToListAsync(cancellationToken);
        return bean;
    }

    public async Task<string> AddAsync(AddUserRequest request, CancellationToken cancellationToken)
    {
        if (await _db.Users.AnyAsync(user => user.Username == request.Username, cancellationToken))
        {
            throw new BusinessException("用户名已存在");
        }
        _grantGuard.AssertCanAssignRoles(request.Roles);
        _grantGuard.AssertCanAssignPermissions(request.Permissions);
        if (!await _db.Groups.AnyAsync(group => group.Id == request.GroupId, cancellationToken))
        {
            throw new BusinessException("组织不存在");
        }

        var temporaryPassword = PasswordHasher.GenerateTemporaryPassword();
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.Name,
            Username = request.Username,
            Email = request.Email,
            GroupId = request.GroupId,
            Phone = request.Phone,
            Status = request.Status ?? EffectivePermissions.StatusEnabled,
            Password = _passwordHasher.Hash(temporaryPassword),
            MustChangePassword = true,
            TokenVersion = 0
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        await ReplaceRolesAsync(user.Id, request.Roles, cancellationToken);
        await ReplacePermissionsAsync(user.Id, request.Permissions, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return temporaryPassword;
    }

    public async Task EditAsync(string id, EditUserRequest request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("用户不存在");

        if (request.Name is not null)
        {
            user.Name = request.Name;
        }
        if (request.Username is not null && request.Username != user.Username)
        {
            throw new BusinessException("用户名创建后不可修改");
        }
        if (request.Email is not null)
        {
            user.Email = request.Email;
        }
        if (request.GroupId is not null)
        {
            if (string.IsNullOrWhiteSpace(request.GroupId)
                || !await _db.Groups.AnyAsync(group => group.Id == request.GroupId, cancellationToken))
            {
                throw new BusinessException("组织不存在");
            }
            user.GroupId = request.GroupId;
        }
        if (request.Phone is not null)
        {
            user.Phone = request.Phone;
        }
        if (request.Status is not null)
        {
            var disabling = user.Status != EffectivePermissions.StatusDisabled
                && request.Status == EffectivePermissions.StatusDisabled;
            if (disabling)
            {
                AssertNotSelf(user.Id, "禁用");
                await AssertNotLastSuperAsync(user, "禁用", cancellationToken);
                user.TokenVersion += 1;
            }
            user.Status = request.Status;
        }
        if (request.Roles is not null)
        {
            _grantGuard.AssertCanAssignRoles(request.Roles);
            await ReplaceRolesAsync(user.Id, request.Roles, cancellationToken);
        }
        if (request.Permissions is not null)
        {
            _grantGuard.AssertCanAssignPermissions(request.Permissions);
            await ReplacePermissionsAsync(user.Id, request.Permissions, cancellationToken);
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateStatusAsync(string id, string status, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("用户不存在");
        var disabling = user.Status != EffectivePermissions.StatusDisabled
            && status == EffectivePermissions.StatusDisabled;
        if (disabling)
        {
            AssertNotSelf(user.Id, "禁用");
            await AssertNotLastSuperAsync(user, "禁用", cancellationToken);
            user.TokenVersion += 1;
        }
        user.Status = status;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<string> ResetPasswordAsync(string id, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("用户不存在");
        if (await HasRoleAsync(user.Id, "super", cancellationToken) && !_grantGuard.IsSuperAdmin())
        {
            throw new BusinessException("无权重置超级管理员密码");
        }
        var temporaryPassword = PasswordHasher.GenerateTemporaryPassword();
        user.Password = _passwordHasher.Hash(temporaryPassword);
        user.MustChangePassword = true;
        user.TokenVersion += 1;
        await _db.SaveChangesAsync(cancellationToken);
        await _loginAttempts.ClearUserAttemptsAsync(user.Username, cancellationToken);
        return temporaryPassword;
    }

    public async Task DeleteAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken)
    {
        var requested = ids.Distinct(StringComparer.Ordinal).ToList();
        var users = await _db.Users.Where(user => requested.Contains(user.Id)).ToListAsync(cancellationToken);
        if (users.Count == 0)
        {
            throw new BusinessException("用户不存在");
        }

        var enabledSupers = await _db.Users.AsNoTracking()
            .Where(user => user.Status == EffectivePermissions.StatusEnabled)
            .Where(user => _db.UserRoles.Any(link => link.UserId == user.Id && link.RoleId == "super"))
            .LongCountAsync(cancellationToken);

        var userIds = users.Select(user => user.Id).ToList();
        var superUserIds = await _db.UserRoles.AsNoTracking()
            .Where(link => link.RoleId == "super" && userIds.Contains(link.UserId))
            .Select(link => link.UserId)
            .ToListAsync(cancellationToken);
        var deletingSupers = users.Count(user =>
            user.Status == EffectivePermissions.StatusEnabled && superUserIds.Contains(user.Id));
        if (deletingSupers > 0 && enabledSupers - deletingSupers < 1)
        {
            throw new BusinessException("系统至少需要保留一个启用的超级管理员");
        }

        foreach (var user in users)
        {
            AssertNotSelf(user.Id, "删除");
        }

        _db.Users.RemoveRange(users);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(
        string username,
        string oldPassword,
        string newPassword,
        CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Username == username, cancellationToken)
            ?? throw new BusinessException("用户不存在");
        if (!_passwordHasher.Verify(oldPassword, user.Password))
        {
            throw new BusinessException("原密码错误");
        }
        if (_passwordHasher.Verify(newPassword, user.Password))
        {
            throw new BusinessException("新密码不能与原密码相同");
        }
        user.Password = _passwordHasher.Hash(newPassword);
        user.MustChangePassword = false;
        user.TokenVersion += 1;
        await _db.SaveChangesAsync(cancellationToken);
        await _loginAttempts.ClearUserAttemptsAsync(user.Username, cancellationToken);
    }

    public async Task<UserInfoResponse> GetUserInfoAsync(string userId, CancellationToken cancellationToken)
    {
        var loaded = await _userLoader.LoadByIdAsync(userId, cancellationToken)
            ?? throw new BusinessException("用户不存在");
        var user = loaded.User;
        var effective = loaded.Effective;

        return new UserInfoResponse
        {
            Id = user.Id,
            Name = user.Name,
            Username = user.Username,
            Email = user.Email,
            GroupId = user.GroupId,
            GroupName = await ResolveGroupNameAsync(user.GroupId, cancellationToken),
            Phone = user.Phone,
            Status = user.Status,
            MustChangePassword = user.MustChangePassword,
            CreateTime = user.CreateTime,
            UpdateTime = user.UpdateTime,
            Roles = effective.Roles
                .Select(role => new RoleInfo { Id = role.Id, Name = role.Name })
                .DistinctBy(role => role.Id)
                .ToList(),
            RolePermissions = effective.RolePermissions
                .Select(grant => new PermissionInfo
                {
                    Role = grant.RoleId,
                    Type = grant.Permission.Type,
                    Path = grant.Permission.Path,
                    Action = grant.Permission.Action
                })
                .DistinctBy(item => (item.Role, item.Type, item.Path, item.Action))
                .ToList(),
            UserPermissions = effective.DirectPermissions
                .Select(permission => new PermissionInfo
                {
                    Type = permission.Type,
                    Path = permission.Path,
                    Action = permission.Action
                })
                .DistinctBy(item => (item.Type, item.Path, item.Action))
                .ToList()
        };
    }

    public async Task RevokeTokensAsync(string username, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(item => item.Username == username, cancellationToken);
        if (user is null)
        {
            return;
        }
        user.TokenVersion += 1;
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string?> ResolveGroupNameAsync(string? groupId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(groupId))
        {
            return null;
        }
        var group = await _db.Groups.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == groupId, cancellationToken)
            ?? throw new BusinessException("组织不存在");
        return group.Name;
    }

    private async Task ReplaceRolesAsync(
        string userId,
        IReadOnlyCollection<string>? roleIds,
        CancellationToken cancellationToken)
    {
        var existing = await _db.UserRoles.Where(link => link.UserId == userId).ToListAsync(cancellationToken);
        var wantedIds = roleIds?.Distinct(StringComparer.Ordinal).ToList() ?? new List<string>();
        var wanted = wantedIds.Count == 0
            ? new List<string>()
            : await _db.Roles.AsNoTracking()
                .Where(role => wantedIds.Contains(role.Id))
                .Select(role => role.Id)
                .ToListAsync(cancellationToken);
        var toRemove = existing.Where(link => !wanted.Contains(link.RoleId)).ToList();
        _db.UserRoles.RemoveRange(toRemove);
        var existingIds = existing.Select(link => link.RoleId).ToHashSet(StringComparer.Ordinal);
        foreach (var roleId in wanted.Where(id => !existingIds.Contains(id)))
        {
            _db.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId });
        }
    }

    private async Task ReplacePermissionsAsync(
        string userId,
        IReadOnlyCollection<string>? permissionIds,
        CancellationToken cancellationToken)
    {
        var existing = await _db.UserPermissions.Where(link => link.UserId == userId).ToListAsync(cancellationToken);
        var wantedIds = permissionIds?.Distinct(StringComparer.Ordinal).ToList() ?? new List<string>();
        var wanted = wantedIds.Count == 0
            ? new List<string>()
            : await _db.Permissions.AsNoTracking()
                .Where(permission => wantedIds.Contains(permission.Id))
                .Select(permission => permission.Id)
                .ToListAsync(cancellationToken);
        var toRemove = existing.Where(link => !wanted.Contains(link.PermissionId)).ToList();
        _db.UserPermissions.RemoveRange(toRemove);
        var existingIds = existing.Select(link => link.PermissionId).ToHashSet(StringComparer.Ordinal);
        foreach (var permissionId in wanted.Where(id => !existingIds.Contains(id)))
        {
            _db.UserPermissions.Add(new UserPermission { UserId = userId, PermissionId = permissionId });
        }
    }

    private Task<bool> HasRoleAsync(string userId, string roleId, CancellationToken cancellationToken)
        => _db.UserRoles.AsNoTracking().AnyAsync(link => link.UserId == userId && link.RoleId == roleId, cancellationToken);

    private async Task AssertNotLastSuperAsync(User user, string action, CancellationToken cancellationToken)
    {
        if (!await HasRoleAsync(user.Id, "super", cancellationToken)
            || user.Status == EffectivePermissions.StatusDisabled)
        {
            return;
        }
        var enabledSupers = await _db.Users.AsNoTracking()
            .Where(item => item.Status == EffectivePermissions.StatusEnabled)
            .Where(item => _db.UserRoles.Any(link => link.UserId == item.Id && link.RoleId == "super"))
            .LongCountAsync(cancellationToken);
        if (enabledSupers <= 1)
        {
            throw new BusinessException("系统至少需要保留一个启用的超级管理员，不能" + action);
        }
    }

    private void AssertNotSelf(string targetId, string action)
    {
        var current = _currentUser.Current;
        if (current is not null && current.UserId == targetId)
        {
            throw new BusinessException("不能" + action + "当前登录用户");
        }
    }

    private static (string SortBy, bool Ascending) ResolveSort(
        string? sort,
        string? orderField,
        string? direction,
        string? orderValue)
    {
        var requestedSort = sort ?? orderField;
        var explicitSort = !string.IsNullOrEmpty(requestedSort) && SortFields.Contains(requestedSort);
        var sortBy = explicitSort ? requestedSort! : "createTime";
        var requestedDirection = direction ?? orderValue;
        var ascending = explicitSort;
        if (!string.IsNullOrWhiteSpace(requestedDirection))
        {
            if (!requestedDirection.Equals("asc", StringComparison.OrdinalIgnoreCase)
                && !requestedDirection.Equals("desc", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessException("排序方向只能是 asc 或 desc");
            }
            ascending = requestedDirection.Equals("asc", StringComparison.OrdinalIgnoreCase);
        }
        return (sortBy, ascending);
    }

    private static IQueryable<User> ApplyOrder(IQueryable<User> query, string sortBy, bool ascending)
        => (sortBy, ascending) switch
        {
            ("id", true) => query.OrderBy(user => user.Id),
            ("id", false) => query.OrderByDescending(user => user.Id),
            ("name", true) => query.OrderBy(user => user.Name),
            ("name", false) => query.OrderByDescending(user => user.Name),
            ("username", true) => query.OrderBy(user => user.Username),
            ("username", false) => query.OrderByDescending(user => user.Username),
            ("email", true) => query.OrderBy(user => user.Email),
            ("email", false) => query.OrderByDescending(user => user.Email),
            ("status", true) => query.OrderBy(user => user.Status),
            ("status", false) => query.OrderByDescending(user => user.Status),
            ("updateTime", true) => query.OrderBy(user => user.UpdateTime),
            ("updateTime", false) => query.OrderByDescending(user => user.UpdateTime),
            ("createTime", true) => query.OrderBy(user => user.CreateTime),
            _ => query.OrderByDescending(user => user.CreateTime)
        };
}
