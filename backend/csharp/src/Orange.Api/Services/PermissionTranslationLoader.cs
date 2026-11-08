using Microsoft.EntityFrameworkCore;
using Orange.Api.Data;

namespace Orange.Api.Services;

/// <summary>
/// Loads <c>sys_permission_i18n</c> rows as permission id -> locale -> name.
/// Shared by the permission and menu services so both see the same shape.
/// </summary>
public static class PermissionTranslationLoader
{
    public static async Task<Dictionary<string, Dictionary<string, string>>> LoadAsync(
        OrangeDbContext db,
        IEnumerable<string> permissionIds,
        CancellationToken cancellationToken)
    {
        var ids = permissionIds.Distinct(StringComparer.Ordinal).ToList();
        var grouped = new Dictionary<string, Dictionary<string, string>>(StringComparer.Ordinal);
        if (ids.Count == 0)
        {
            return grouped;
        }

        var rows = await db.PermissionI18n.AsNoTracking()
            .Where(row => ids.Contains(row.PermissionId))
            .OrderBy(row => row.PermissionId)
            .ThenBy(row => row.Locale)
            .ToListAsync(cancellationToken);
        foreach (var row in rows)
        {
            if (!grouped.TryGetValue(row.PermissionId, out var translations))
            {
                translations = new Dictionary<string, string>(StringComparer.Ordinal);
                grouped[row.PermissionId] = translations;
            }
            translations[row.Locale] = row.Name;
        }
        return grouped;
    }
}
