using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Services;

public sealed class PermissionService
{
    private static readonly HashSet<string> Types = new(StringComparer.Ordinal) { "menu", "action", "directory" };
    private readonly OrangeDbContext _db;
    private readonly SqlDialect _dialect;

    public PermissionService(OrangeDbContext db, SqlDialect dialect)
    {
        _db = db;
        _dialect = dialect;
    }

    public async Task<List<PermissionBean>> QueryAsync(
        QueryPermissionRequest request,
        CancellationToken cancellationToken)
    {
        var query = _db.Permissions.AsNoTracking();
        if (!string.IsNullOrEmpty(request.Id))
        {
            var pattern = QueryUtils.LikePrefix(request.Id);
            query = query.Where(SearchPredicate.Like<Permission>(item => item.Id, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Name))
        {
            var pattern = QueryUtils.LikePrefix(request.Name);
            query = query.Where(item => item.Name != null)
                .Where(SearchPredicate.Like<Permission>(item => item.Name, pattern, _dialect));
        }
        if (!string.IsNullOrEmpty(request.Path))
        {
            var pattern = QueryUtils.LikePrefix(request.Path);
            query = query.Where(SearchPredicate.Like<Permission>(item => item.Path, pattern, _dialect));
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
        List<Permission> result;
        if (!textFilter)
        {
            result = matched;
        }
        else
        {
            var all = await _db.Permissions.AsNoTracking().OrderBy(item => item.Id).ToListAsync(cancellationToken);
            var index = TreeIndex<Permission>.Of(all, item => item.Id, item => item.ParentId);
            var ids = index.WithAncestorIds(matched);
            result = all.Where(item => ids.Contains(item.Id)).OrderBy(item => item.Id).ToList();
        }

        var translations = await PermissionTranslationLoader.LoadAsync(
            _db, result.Select(item => item.Id), cancellationToken);
        return result
            .Select(item => ToBean(item, translations.GetValueOrDefault(item.Id)))
            .ToList();
    }

    public async Task<PermissionBean> GetAsync(string id, CancellationToken cancellationToken)
    {
        var permission = await _db.Permissions.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("权限不存在");
        var translations = await PermissionTranslationLoader.LoadAsync(
            _db, new[] { permission.Id }, cancellationToken);
        return ToBean(permission, translations.GetValueOrDefault(permission.Id));
    }

    public async Task<PermissionBean> AddChildAsync(
        AddChildPermissionRequest request,
        CancellationToken cancellationToken)
    {
        var parentId = QueryUtils.TrimToNull(request.ParentId);
        var path = RequirePath(request.Path);
        var action = QueryUtils.TrimToNull(request.Action);
        var translations = PermissionI18nPolicy.Normalize(request.Translations);
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
        foreach (var (locale, name) in translations)
        {
            _db.PermissionI18n.Add(new PermissionI18n
            {
                PermissionId = permission.Id,
                Locale = locale,
                Name = name
            });
        }
        await _db.SaveChangesAsync(cancellationToken);
        return ToBean(permission, translations);
    }

    public async Task EditAsync(string id, EditPermissionRequest request, CancellationToken cancellationToken)
    {
        var permission = await _db.Permissions.FirstOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new BusinessException("权限不存在");
        // null keeps the current rows; a provided map replaces all of them.
        var translations = request.Translations is null
            ? null
            : PermissionI18nPolicy.Normalize(request.Translations);

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

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        if (translations is not null)
        {
            var existing = await _db.PermissionI18n
                .Where(row => row.PermissionId == id)
                .ToListAsync(cancellationToken);
            _db.PermissionI18n.RemoveRange(existing);
            foreach (var (locale, name) in translations)
            {
                _db.PermissionI18n.Add(new PermissionI18n
                {
                    PermissionId = id,
                    Locale = locale,
                    Name = name
                });
            }
        }
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
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

        // Remove translations explicitly: some engines/connections do not
        // enforce the ON DELETE CASCADE declared by the schema.
        var translations = await _db.PermissionI18n
            .Where(row => subtree.Contains(row.PermissionId))
            .ToListAsync(cancellationToken);
        var translationsByPermission = translations.ToLookup(row => row.PermissionId, StringComparer.Ordinal);

        foreach (var permission in index.DeleteOrder(subtree))
        {
            _db.PermissionI18n.RemoveRange(translationsByPermission[permission.Id]);
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

    public static PermissionBean ToBean(
        Permission permission,
        IReadOnlyDictionary<string, string>? translations = null) => new()
    {
        Id = permission.Id,
        Name = permission.Name,
        Path = permission.Path,
        Action = permission.Action,
        Type = permission.Type,
        Status = permission.Status,
        ParentId = permission.ParentId,
        CreateTime = permission.CreateTime,
        UpdateTime = permission.UpdateTime,
        Translations = translations is null
            ? new Dictionary<string, string>()
            : new Dictionary<string, string>(translations, StringComparer.Ordinal)
    };
}
