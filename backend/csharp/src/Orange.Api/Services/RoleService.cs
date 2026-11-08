using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Api.Services;

public sealed class RoleService
{
    private static readonly HashSet<string> SortFields = new(StringComparer.Ordinal)
    {
        "id", "name", "status", "createTime", "updateTime"
    };

    private readonly OrangeDbContext _db;
    private readonly GrantGuard _grantGuard;
    private readonly SqlDialect _dialect;

    public RoleService(OrangeDbContext db, GrantGuard grantGuard, SqlDialect dialect)
    {
        _db = db;
        _grantGuard = grantGuard;
        _dialect = dialect;
    }

    public async Task<PageData<RoleBean>> QueryAsync(QueryRoleRequest request, CancellationToken cancellationToken)
    {
        var (page, size, skip) = Pagination.Resolve(request.Page, request.Size);
        var query = _db.Roles.AsNoTracking();
        if (!string.IsNullOrEmpty(request.Id))
        {
            var pattern = QueryUtils.LikePrefix(request.Id);
            query = query.Where(SearchPredicate.Like<Role>(role => role.Id, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Name))
        {
            var pattern = QueryUtils.LikePrefix(request.Name);
            query = query.Where(role => role.Name != null)
                .Where(SearchPredicate.Like<Role>(role => role.Name, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Status) && request.Status != EffectivePermissions.StatusAll)
        {
            query = query.Where(role => role.Status == request.Status);
        }

        var (sortBy, ascending) = ResolveSort(request.Sort, request.OrderField, request.Direction, request.OrderValue);
        var total = await query.LongCountAsync(cancellationToken);
        var roles = await ApplyOrder(query, sortBy, ascending)
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        return PageData<RoleBean>.Of(total, roles.Select(ToBean).ToList(), page, size);
    }

    public async Task<RoleBean> GetAsync(string id, CancellationToken cancellationToken)
    {
        var role = await _db.Roles.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("角色不存在");
        var permissions = await _db.RolePermissions.AsNoTracking()
            .Where(link => link.RoleId == id)
            .OrderBy(link => link.PermissionId)
            .Select(link => link.PermissionId)
            .ToListAsync(cancellationToken);
        return new RoleBean
        {
            Id = role.Id,
            Name = role.Name,
            Status = role.Status,
            Permissions = permissions,
            CreateTime = role.CreateTime,
            UpdateTime = role.UpdateTime
        };
    }

    public async Task<string> AddAsync(AddRoleRequest request, CancellationToken cancellationToken)
    {
        var id = QueryUtils.TrimToNull(request.Id);
        if (id is null)
        {
            id = Guid.NewGuid().ToString();
        }
        else if (await _db.Roles.AnyAsync(role => role.Id == id, cancellationToken))
        {
            throw new BusinessException("角色ID已存在");
        }

        _grantGuard.AssertCanAssignPermissions(request.Permissions);
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var role = new Role
        {
            Id = id,
            Name = request.Name,
            Status = EffectivePermissions.StatusEnabled
        };
        _db.Roles.Add(role);
        await _db.SaveChangesAsync(cancellationToken);
        await ReplacePermissionsAsync(id, request.Permissions, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return role.Id;
    }

    public async Task EditAsync(string id, EditRoleRequest request, CancellationToken cancellationToken)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("角色不存在");
        if (role.Id == "super" && !_grantGuard.IsSuperAdmin())
        {
            throw new BusinessException("只有超级管理员可以修改 super 角色", ErrorCodes.Forbidden);
        }
        if (request.Name is not null)
        {
            role.Name = request.Name;
        }
        if (request.Status is not null)
        {
            role.Status = request.Status;
        }
        if (request.Permissions is not null)
        {
            _grantGuard.AssertCanAssignPermissions(request.Permissions);
            await ReplacePermissionsAsync(id, request.Permissions, cancellationToken);
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken)
    {
        var requested = ids.Distinct(StringComparer.Ordinal).ToList();
        var roles = await _db.Roles.Where(role => requested.Contains(role.Id)).ToListAsync(cancellationToken);
        if (roles.Count == 0)
        {
            throw new BusinessException("角色不存在");
        }
        if (roles.Any(role => role.Id == "super") && !_grantGuard.IsSuperAdmin())
        {
            throw new BusinessException("只有超级管理员可以删除 super 角色", ErrorCodes.Forbidden);
        }

        foreach (var role in roles)
        {
            var referenced = await _db.UserRoles.AsNoTracking()
                .AnyAsync(link => link.RoleId == role.Id, cancellationToken);
            if (referenced)
            {
                throw new BusinessException("角色" + role.Id + "已被用户引用，不能删除");
            }
        }

        foreach (var role in roles)
        {
            // sys_role_permission has ON DELETE CASCADE; deleting the role removes its grants.
            // Deleting the link rows explicitly and the role in one batch can trip Npgsql's
            // affected-row check after the cascade has already removed them.
            _db.Roles.Remove(role);
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task ReplacePermissionsAsync(
        string roleId,
        IReadOnlyCollection<string>? permissionIds,
        CancellationToken cancellationToken)
    {
        var existing = await _db.RolePermissions
            .Where(link => link.RoleId == roleId)
            .ToListAsync(cancellationToken);
        var wantedIds = permissionIds?.Distinct(StringComparer.Ordinal).ToList() ?? new List<string>();
        var wanted = wantedIds.Count == 0
            ? new List<string>()
            : await _db.Permissions.AsNoTracking()
                .Where(permission => wantedIds.Contains(permission.Id))
                .Select(permission => permission.Id)
                .ToListAsync(cancellationToken);
        var toRemove = existing.Where(link => !wanted.Contains(link.PermissionId)).ToList();
        _db.RolePermissions.RemoveRange(toRemove);
        var existingIds = existing.Select(link => link.PermissionId).ToHashSet(StringComparer.Ordinal);
        foreach (var permissionId in wanted.Where(id => !existingIds.Contains(id)))
        {
            _db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
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

    private static IQueryable<Role> ApplyOrder(IQueryable<Role> query, string sortBy, bool ascending)
        => (sortBy, ascending) switch
        {
            ("id", true) => query.OrderBy(role => role.Id),
            ("id", false) => query.OrderByDescending(role => role.Id),
            ("name", true) => query.OrderBy(role => role.Name),
            ("name", false) => query.OrderByDescending(role => role.Name),
            ("status", true) => query.OrderBy(role => role.Status),
            ("status", false) => query.OrderByDescending(role => role.Status),
            ("updateTime", true) => query.OrderBy(role => role.UpdateTime),
            ("updateTime", false) => query.OrderByDescending(role => role.UpdateTime),
            ("createTime", true) => query.OrderBy(role => role.CreateTime),
            _ => query.OrderByDescending(role => role.CreateTime)
        };

    private static RoleBean ToBean(Role role) => new()
    {
        Id = role.Id,
        Name = role.Name,
        Status = role.Status,
        CreateTime = role.CreateTime,
        UpdateTime = role.UpdateTime
    };
}
