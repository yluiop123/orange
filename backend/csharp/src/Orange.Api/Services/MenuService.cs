using Microsoft.EntityFrameworkCore;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Services;

public sealed class MenuService
{
    private static readonly string[] MenuTypes = { "menu", "directory" };
    private readonly OrangeDbContext _db;

    public MenuService(OrangeDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Enabled menu and directory nodes ordered by code. Action nodes are excluded.
    /// A node whose parent is disabled or missing is dropped with its whole branch.
    /// Names come from <c>sys_permission_i18n</c>: exact locale, then its language
    /// part, then the default <c>sys_permission.name</c>.
    /// </summary>
    public async Task<List<MenuInfo>> QueryTreeAsync(string? locale, CancellationToken cancellationToken)
    {
        var permissions = await _db.Permissions.AsNoTracking()
            .Where(item => item.Status == EffectivePermissions.StatusEnabled && MenuTypes.Contains(item.Type))
            .OrderBy(item => item.Id)
            .ToListAsync(cancellationToken);
        var translations = await PermissionTranslationLoader.LoadAsync(
            _db, permissions.Select(item => item.Id), cancellationToken);

        var nodes = new Dictionary<string, MenuInfo>(StringComparer.Ordinal);
        foreach (var permission in permissions)
        {
            nodes[permission.Id] = new MenuInfo
            {
                Id = permission.Id,
                Path = permission.Path,
                Type = permission.Type,
                Name = PermissionI18nPolicy.Resolve(
                    locale,
                    translations.GetValueOrDefault(permission.Id),
                    permission.Name)
            };
        }

        var roots = new List<MenuInfo>();
        foreach (var permission in permissions)
        {
            var node = nodes[permission.Id];
            if (string.IsNullOrWhiteSpace(permission.ParentId))
            {
                roots.Add(node);
            }
            else if (nodes.TryGetValue(permission.ParentId, out var parent))
            {
                parent.Children.Add(node);
            }
            // Otherwise the parent is disabled or missing: the branch stays invisible.
        }
        return roots;
    }
}
