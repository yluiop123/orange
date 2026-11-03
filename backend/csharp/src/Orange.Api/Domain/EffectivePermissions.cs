namespace Orange.Api.Domain;

/// <summary>
/// A user's effective permissions: the union of enabled roles plus direct grants,
/// minus disabled permissions. Authorities and /auth/user-info both derive from here.
/// </summary>
public sealed class EffectivePermissions
{
    public const string StatusEnabled = "1";
    public const string StatusDisabled = "0";
    public const string StatusAll = "all";

    private EffectivePermissions(
        IReadOnlyList<Role> roles,
        IReadOnlyList<RolePermissionGrant> rolePermissions,
        IReadOnlyList<Permission> directPermissions,
        IReadOnlyList<Permission> permissions,
        IReadOnlySet<string> authorities)
    {
        Roles = roles;
        RolePermissions = rolePermissions;
        DirectPermissions = directPermissions;
        Permissions = permissions;
        Authorities = authorities;
    }

    public IReadOnlyList<Role> Roles { get; }
    public IReadOnlyList<RolePermissionGrant> RolePermissions { get; }
    public IReadOnlyList<Permission> DirectPermissions { get; }
    public IReadOnlyList<Permission> Permissions { get; }
    public IReadOnlySet<string> Authorities { get; }

    public sealed record RolePermissionGrant(string RoleId, Permission Permission);

    public static EffectivePermissions Of(
        IEnumerable<Role> allRoles,
        IEnumerable<Permission> directPermissions)
    {
        var activeRoles = allRoles
            .Where(role => role.Status != StatusDisabled)
            .OrderBy(role => role.Id, StringComparer.Ordinal)
            .ToList();

        var rolePermissions = new List<RolePermissionGrant>();
        foreach (var role in activeRoles)
        {
            foreach (var permission in role.Permissions
                         .Where(permission => permission.Status != StatusDisabled)
                         .OrderBy(permission => permission.Id, StringComparer.Ordinal))
            {
                rolePermissions.Add(new RolePermissionGrant(role.Id, permission));
            }
        }

        var direct = directPermissions
            .Where(permission => permission.Status != StatusDisabled)
            .OrderBy(permission => permission.Id, StringComparer.Ordinal)
            .ToList();

        var permissions = new List<Permission>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var permission in rolePermissions.Select(item => item.Permission).Concat(direct))
        {
            if (seen.Add(permission.Id))
            {
                permissions.Add(permission);
            }
        }

        var authorities = new HashSet<string>(StringComparer.Ordinal);
        foreach (var permission in permissions)
        {
            authorities.Add(permission.Id);
            authorities.Add(AuthorityOf(permission));
        }

        return new EffectivePermissions(activeRoles, rolePermissions, direct, permissions, authorities);
    }

    public static string AuthorityOf(Permission permission)
    {
        var authority = permission.Type + "#" + permission.Path;
        if (!string.IsNullOrWhiteSpace(permission.Action))
        {
            authority += ":" + permission.Action;
        }
        return authority;
    }
}
