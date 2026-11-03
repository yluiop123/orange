using Orange.Api.Domain;

namespace Orange.Api.Security;

/// <summary>
/// Declares the authority required by an endpoint. The authentication middleware
/// checks it after authentication and the forced-password-change gate.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RequireAuthorityAttribute : Attribute
{
    public RequireAuthorityAttribute(string authority)
    {
        Authority = authority;
    }

    public string Authority { get; }
}

/// <summary>
/// Prevents a lower-privileged account from granting more than it holds.
/// super may only be granted by a super; direct permissions must be a subset of the caller's.
/// </summary>
public sealed class GrantGuard
{
    private readonly CurrentUserAccessor _currentUser;

    public GrantGuard(CurrentUserAccessor currentUser)
    {
        _currentUser = currentUser;
    }

    public void AssertCanAssignRoles(IEnumerable<string>? roleIds)
    {
        if (roleIds is null)
        {
            return;
        }
        var roles = roleIds.ToList();
        if (roles.Contains("super") && !IsSuperAdmin())
        {
            throw new BusinessException("只有超级管理员可以授予 super 角色");
        }
    }

    public void AssertCanAssignPermissions(IEnumerable<string>? permissionIds)
    {
        if (permissionIds is null)
        {
            return;
        }
        var authorities = _currentUser.Current?.Authorities ?? new HashSet<string>();
        foreach (var permissionId in permissionIds)
        {
            if (!authorities.Contains(permissionId))
            {
                throw new BusinessException("不能授予当前账号没有的权限");
            }
        }
    }

    public bool IsSuperAdmin() => _currentUser.Current?.IsSuperAdmin == true;
}
