using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Services;

public sealed class PermissionService
{
    private static readonly HashSet<string> Types = new(StringComparer.Ordinal) { "menu", "action", "directory" };
    private readonly OrangeDbContext _db;

    public PermissionService(OrangeDbContext db)
    {
        _db = db;
    }

    public async Task<List<PermissionBean>> QueryAsync(
        QueryPermissionRequest request,
        CancellationToken cancellationToken)
    {
        var query = _db.Permissions.AsNoTracking();
        if (!string.IsNullOrEmpty(request.Id))
        {
            var pattern = QueryUtils.LikePrefix(request.Id);
            query = query.Where(item => EF.Functions.ILike(item.Id, pattern, "\\"));
        }
        if (!string.IsNullOrEmpty(request.Name))
        {
            var pattern = QueryUtils.LikePrefix(request.Name);
            query = query.Where(item => item.Name != null && EF.Functions.ILike(item.Name, pattern, "\\"));
        }
        if (!string.IsNullOrEmpty(request.Path))
        {
            var pattern = QueryUtils.LikePrefix(request.Path);
            query = query.Where(item => EF.Functions.ILike(item.Path, pattern, "\\"));
        }
        if (!string.IsNullOrEmpty(request.Status) && request.Status != EffectivePermissions.StatusAll)
        {
            query = query.Where(item => item.Status == request.Status);
        }
        var typeFilter = !string.IsNullOrEmpty(request.Type) && request.Type != EffectivePermissions.StatusAll;
        if (typeFilter)
        {
            query = query.Where(item => item.Type == request.Type);
        }

        var matched = await query.OrderBy(item => item.Id).ToListAsync(cancellationToken);
        var textFilter = !string.IsNullOrWhiteSpace(request.Id)
            || !string.IsNullOrWhiteSpace(request.Name)
            || !string.IsNullOrWhiteSpace(request.Path)
            || typeFilter;
        if (!textFilter)
        {
            return matched.Select(ToBean).ToList();
        }

        var all = await _db.Permissions.AsNoTracking().OrderBy(item => item.Id).ToListAsync(cancellationToken);
        var index = TreeIndex<Permission>.Of(all, item => item.Id, item => item.ParentId);
        var ids = index.WithAncestorIds(matched);
        return all.Where(item => ids.Contains(item.Id)).OrderBy(item => item.Id).Select(ToBean).ToList();
    }

    public async Task<PermissionBean> GetAsync(string id, CancellationToken cancellationToken)
    {
        var permission = await _db.Permissions.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("权限不存在");
        return ToBean(permission);
    }

    public async Task<PermissionBean> AddChildAsync(
        AddChildPermissionRequest request,
        CancellationToken cancellationToken)
    {
        var parentId = QueryUtils.TrimToNull(request.ParentId);
        var path = RequirePath(request.Path);
        var action = QueryUtils.TrimToNull(request.Action);
        CodePolicy.Permission.Validate(request.Id, parentId);
        if (await _db.Permissions.AnyAsync(item => item.Id == request.Id, cancellationToken))
        {
            throw new BusinessException("权限编码已存在");
        }

        if (parentId is not null)
        {
            var parent = await _db.Permissions.AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == parentId, cancellationToken)
                ?? throw new BusinessException("父权限不存在");
            if (parent.Type == "action")
            {
                throw new BusinessException("动作权限不能添加子节点");
            }
        }

        await AssertUniqueAsync(request.Type, path, action, null, cancellationToken);
        var permission = new Permission
        {
            Id = request.Id,
            Name = request.Name,
            Path = path,
            Action = action,
            Type = request.Type,
            ParentId = parentId,
            Status = EffectivePermissions.StatusEnabled
        };
        _db.Permissions.Add(permission);
        await _db.SaveChangesAsync(cancellationToken);
        return ToBean(permission);
    }

    public async Task EditAsync(string id, EditPermissionRequest request, CancellationToken cancellationToken)
    {
        var permission = await _db.Permissions.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("权限不存在");

        var effectiveType = request.Type ?? permission.Type;
        var effectivePath = request.Path is not null
            ? RequirePath(request.Path)
            : RequirePath(permission.Path);
        var effectiveAction = request.Action is not null
            ? QueryUtils.TrimToNull(request.Action)
            : QueryUtils.TrimToNull(permission.Action);
        await AssertUniqueAsync(effectiveType, effectivePath, effectiveAction, id, cancellationToken);

        if (request.Name is not null)
        {
            permission.Name = request.Name;
        }
        if (request.Path is not null)
        {
            permission.Path = effectivePath;
        }
        if (request.Action is not null)
        {
            permission.Action = effectiveAction;
        }
        if (request.Type is not null)
        {
            permission.Type = request.Type;
        }
        if (request.Status is not null)
        {
            var disabling = permission.Status != EffectivePermissions.StatusDisabled
                && request.Status == EffectivePermissions.StatusDisabled;
            if (disabling)
            {
                await AssertNoEnabledDescendantsAsync(permission.Id, cancellationToken);
            }
            permission.Status = request.Status;
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(IReadOnlyCollection<string> ids, CancellationToken cancellationToken)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var all = await _db.Permissions.ToListAsync(cancellationToken);
        var index = TreeIndex<Permission>.Of(all, item => item.Id, item => item.ParentId);
        var requested = ids.Distinct(StringComparer.Ordinal).ToList();
        var selected = requested.Where(id => index.Get(id) is not null).ToList();
        if (selected.Count != requested.Count)
        {
            throw new BusinessException("权限不存在");
        }

        var subtree = index.SubtreeIds(requested);
        if (await _db.RolePermissions.AsNoTracking().AnyAsync(link => subtree.Contains(link.PermissionId), cancellationToken))
        {
            throw new BusinessException("权限已被角色引用，不能删除");
        }
        if (await _db.UserPermissions.AsNoTracking().AnyAsync(link => subtree.Contains(link.PermissionId), cancellationToken))
        {
            throw new BusinessException("权限已被用户引用，不能删除");
        }

        foreach (var permission in index.DeleteOrder(subtree))
        {
            _db.Permissions.Remove(permission);
            await _db.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task AssertUniqueAsync(
        string type,
        string path,
        string? action,
        string? excludeId,
        CancellationToken cancellationToken)
    {
        PermissionShapePolicy.Validate(type, action);
        if (!Types.Contains(type))
        {
            throw new BusinessException("权限类型只能是 menu、action 或 directory");
        }
        var query = _db.Permissions.AsNoTracking()
            .Where(item => item.Type == type && item.Path == path);
        query = action is null
            ? query.Where(item => item.Action == null)
            : query.Where(item => item.Action == action);
        if (excludeId is not null)
        {
            query = query.Where(item => item.Id != excludeId);
        }
        if (await query.AnyAsync(cancellationToken))
        {
            throw new BusinessException("权限已存在");
        }
    }

    private async Task AssertNoEnabledDescendantsAsync(string id, CancellationToken cancellationToken)
    {
        var all = await _db.Permissions.AsNoTracking().ToListAsync(cancellationToken);
        var index = TreeIndex<Permission>.Of(all, item => item.Id, item => item.ParentId);
        if (index.HasEnabledDescendant(id, item => item.Status == EffectivePermissions.StatusEnabled))
        {
            throw new BusinessException("请先禁用子权限");
        }
    }

    private static string RequirePath(string? path)
    {
        var normalized = QueryUtils.TrimToNull(path);
        return normalized ?? throw new BusinessException("权限路径不能为空");
    }

    public static PermissionBean ToBean(Permission permission) => new()
    {
        Id = permission.Id,
        Name = permission.Name,
        Path = permission.Path,
        Action = permission.Action,
        Type = permission.Type,
        Status = permission.Status,
        ParentId = permission.ParentId,
        CreateTime = permission.CreateTime,
        UpdateTime = permission.UpdateTime
    };
}
