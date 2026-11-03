using Orange.Api.Domain;

namespace Orange.Tests;

public class PermissionShapePolicyTests
{
    [Theory]
    [InlineData("action", "add")]
    [InlineData("action", "delete")]
    [InlineData("menu", null)]
    [InlineData("menu", "")]
    [InlineData("menu", "   ")]
    [InlineData("directory", null)]
    public void ValidShapesPass(string type, string? action)
        => PermissionShapePolicy.Validate(type, action);

    [Theory]
    [InlineData("action", null)]
    [InlineData("action", "")]
    [InlineData("action", "  ")]
    [InlineData("menu", "add")]
    [InlineData("directory", "delete")]
    [InlineData("other", null)]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void InvalidShapesAreRejected(string? type, string? action)
        => Assert.Throws<BusinessException>(() => PermissionShapePolicy.Validate(type, action));

    [Fact]
    public void AuthorityUsesTypeHashPathAndOptionalAction()
    {
        var menu = new Permission { Id = "000500", Type = "menu", Path = "/system/user" };
        var action = new Permission
        {
            Id = "00050000", Type = "action", Path = "/system/user", Action = "add"
        };

        Assert.Equal("menu#/system/user", EffectivePermissions.AuthorityOf(menu));
        Assert.Equal("action#/system/user:add", EffectivePermissions.AuthorityOf(action));
    }
}
