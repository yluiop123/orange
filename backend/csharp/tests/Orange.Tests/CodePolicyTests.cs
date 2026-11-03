using Orange.Api.Domain;

namespace Orange.Tests;

public class CodePolicyTests
{
    [Theory]
    [InlineData("00", null)]
    [InlineData("0001", "00")]
    [InlineData("000101", "0001")]
    public void GroupCodesFollowRootAndSegmentRules(string id, string? parentId)
        => CodePolicy.Group.Validate(id, parentId);

    [Theory]
    [InlineData("0000", null)]
    [InlineData("000001", "0000")]
    [InlineData("00050000", "000500")]
    public void PermissionCodesFollowRootAndSegmentRules(string id, string? parentId)
        => CodePolicy.Permission.Validate(id, parentId);

    [Theory]
    [InlineData("", null)]
    [InlineData("  ", null)]
    [InlineData("0a", null)]
    [InlineData("000", null)]
    [InlineData("001", "00")]
    [InlineData("0101", "00")]
    [InlineData("000101", "01")]
    public void InvalidGroupCodesAreRejected(string? id, string? parentId)
        => Assert.Throws<BusinessException>(() => CodePolicy.Group.Validate(id, parentId));

    [Theory]
    [InlineData("000", null)]
    [InlineData("000001", null)]
    [InlineData("00000", "0000")]
    [InlineData("000203", "0001")]
    public void InvalidPermissionCodesAreRejected(string? id, string? parentId)
        => Assert.Throws<BusinessException>(() => CodePolicy.Permission.Validate(id, parentId));

    [Fact]
    public void WhitespaceParentIsTreatedAsRoot()
    {
        CodePolicy.Group.Validate("00", "   ");
        Assert.Throws<BusinessException>(() => CodePolicy.Group.Validate("0001", "   "));
    }
}
