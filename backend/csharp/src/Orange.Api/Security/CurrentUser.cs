using Microsoft.EntityFrameworkCore;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Security;

public sealed record LoadedUser(
    User User,
    IReadOnlyList<Role> Roles,
    IReadOnlyList<Permission> DirectPermissions,
    EffectivePermissions Effective);

/// <summary>Loads a user together with role and direct grants, then derives authorities.</summary>
public sealed class UserLoader
{
    private readonly OrangeDbContext _db;

    public UserLoader(OrangeDbContext db)
    {
        _db = db;
    }

    public Task<LoadedUser?> LoadByUsernameAsync(string username, CancellationToken cancellationToken)
        => LoadAsync(user => user.Username == username, cancellationToken);

    public Task<LoadedUser?> LoadByIdAsync(string id, CancellationToken cancellationToken)
        => LoadAsync(user => user.Id == id, cancellationToken);

    private async Task<LoadedUser?> LoadAsync(
        System.Linq.Expressions.Expression<Func<User, bool>> predicate,
        CancellationToken cancellationToken)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(predicate, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var roles = await (
                from link in _db.UserRoles.AsNoTracking()
                join role in _db.Roles.AsNoTracking() on link.RoleId equals role.Id
                where link.UserId == user.Id
                select role)
            .OrderBy(role => role.Id)
            .ToListAsync(cancellationToken);

        var roleIds = roles.Select(role => role.Id).ToList();
        var grants = roleIds.Count == 0
            ? new List<RoleGrant>()
            : await (
                    from link in _db.RolePermissions.AsNoTracking()
                    join permission in _db.Permissions.AsNoTracking() on link.PermissionId equals permission.Id
                    where roleIds.Contains(link.RoleId)
                    select new RoleGrant(link.RoleId, permission))
                .ToListAsync(cancellationToken);

        foreach (var role in roles)
        {
            role.Permissions = grants
                .Where(grant => grant.RoleId == role.Id)
                .Select(grant => grant.Permission)
                .OrderBy(permission => permission.Id, StringComparer.Ordinal)
                .ToList();
        }

        var direct = await (
                from link in _db.UserPermissions.AsNoTracking()
                join permission in _db.Permissions.AsNoTracking() on link.PermissionId equals permission.Id
                where link.UserId == user.Id
                select permission)
            .OrderBy(permission => permission.Id)
            .ToListAsync(cancellationToken);

        return new LoadedUser(user, roles, direct, EffectivePermissions.Of(roles, direct));
    }

    private sealed record RoleGrant(string RoleId, Permission Permission);
}

public sealed record CurrentUser(
    string UserId,
    string Username,
    int TokenVersion,
    bool MustChangePassword,
    IReadOnlySet<string> Authorities,
    JwtClaims Claims)
{
    public bool IsSuperAdmin => Authorities.Contains("ROLE_super");
}

public sealed class CurrentUserAccessor
{
    public const string ItemKey = "orange.currentUser";
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserAccessor(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public CurrentUser? Current
        => _accessor.HttpContext?.Items.TryGetValue(ItemKey, out var value) == true
            ? value as CurrentUser
            : null;

    public CurrentUser Require()
        => Current ?? throw new UnauthorizedException(ErrorCodes.UnauthorizedMessage);
}
