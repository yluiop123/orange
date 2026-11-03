using Orange.Api.Domain;

namespace Orange.Tests;

public class EffectivePermissionsTests
{
    [Fact]
    public void MergesEnabledRolesAndDirectGrantsAndSkipsDisabled()
    {
        var menu = Permission("000500", "menu", "/system/user", null, "1");
        var add = Permission("00050000", "action", "/system/user", "add", "1");
        var disabledAction = Permission("00050001", "action", "/system/user", "delete", "0");
        var direct = Permission("000001", "menu", "/profile", null, "1");
        var disabledDirect = Permission("000002", "menu", "/profile/secret", null, "0");

        var admin = new Role { Id = "admin", Name = "Admin", Status = "1" };
        admin.Permissions.AddRange(new[] { menu, add, disabledAction });

        var guest = new Role { Id = "guest", Status = "0" };
        guest.Permissions.Add(Permission("001", "menu", "/guest", null, "1"));

        var effective = EffectivePermissions.Of(new[] { admin, guest }, new[] { direct, disabledDirect });

        Assert.Equal(new[] { "admin" }, effective.Roles.Select(role => role.Id));
        Assert.All(effective.RolePermissions, grant => Assert.Equal("admin", grant.RoleId));
        Assert.Equal(new[] { "000001" }, effective.DirectPermissions.Select(item => item.Id));

        Assert.Contains("000500", effective.Authorities);
        Assert.Contains("menu#/system/user", effective.Authorities);
        Assert.Contains("00050000", effective.Authorities);
        Assert.Contains("action#/system/user:add", effective.Authorities);
        Assert.Contains("000001", effective.Authorities);
        Assert.Contains("menu#/profile", effective.Authorities);

        Assert.DoesNotContain("00050001", effective.Authorities);
        Assert.DoesNotContain("action#/system/user:delete", effective.Authorities);
        Assert.DoesNotContain("001", effective.Authorities);
        Assert.DoesNotContain("menu#/guest", effective.Authorities);
        Assert.DoesNotContain("000002", effective.Authorities);
    }

    [Fact]
    public void DuplicateGrantsCollapseToOnePermission()
    {
        var menu = Permission("000500", "menu", "/system/user", null, "1");
        var admin = new Role { Id = "admin", Status = "1" };
        admin.Permissions.Add(menu);
        var super = new Role { Id = "super", Status = "1" };
        super.Permissions.Add(menu);

        var effective = EffectivePermissions.Of(new[] { admin, super }, Array.Empty<Permission>());

        Assert.Single(effective.Permissions);
        Assert.Equal(2, effective.RolePermissions.Count);
        Assert.Contains("menu#/system/user", effective.Authorities);
    }

    [Fact]
    public void EmptyInputHasNoAuthorities()
    {
        var effective = EffectivePermissions.Of(Array.Empty<Role>(), Array.Empty<Permission>());
        Assert.Empty(effective.Authorities);
        Assert.Empty(effective.Roles);
    }

    private static Permission Permission(string id, string type, string path, string? action, string status)
        => new()
        {
            Id = id,
            Type = type,
            Path = path,
            Action = action,
            Status = status
        };
}
