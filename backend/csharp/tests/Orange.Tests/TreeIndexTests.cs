using Orange.Api.Domain;

namespace Orange.Tests;

public class TreeIndexTests
{
    private sealed record Node(string Id, string? ParentId, bool Enabled);

    private static readonly List<Node> Nodes = new()
    {
        new Node("00", null, true),
        new Node("0001", "00", true),
        new Node("0002", "00", false),
        new Node("000101", "0001", false),
        new Node("000201", "0002", true)
    };

    private static TreeIndex<Node> Index()
        => TreeIndex<Node>.Of(Nodes, node => node.Id, node => node.ParentId);

    [Fact]
    public void SubtreeIncludesRootsAndDescendants()
        => Assert.Equal(
            new[] { "0001", "000101" },
            Index().SubtreeIds(new[] { "0001" }).OrderBy(id => id));

    [Fact]
    public void AncestorsWalkToTheRoot()
        => Assert.Equal(
            new[] { "00", "0001", "000101" },
            Index().WithAncestorIds(new[] { Nodes[3] }).OrderBy(id => id));

    [Fact]
    public void EnabledDescendantIgnoresTheNodeItself()
    {
        var index = Index();
        Assert.True(index.HasEnabledDescendant("00", node => node.Enabled));
        Assert.True(index.HasEnabledDescendant("0002", node => node.Enabled));
        Assert.False(index.HasEnabledDescendant("0001", node => node.Enabled));
    }

    [Fact]
    public void DeleteOrderPutsDeepestFirst()
        => Assert.Equal(
            new[] { "000101", "0001", "00" },
            Index().DeleteOrder(new[] { "00", "0001", "000101" }).Select(node => node.Id));

    [Fact]
    public void MissingParentsAndCyclesDoNotHang()
    {
        var broken = TreeIndex<Node>.Of(
            new[]
            {
                new Node("a", "b", true),
                new Node("b", "a", true)
            },
            node => node.Id,
            node => node.ParentId);

        Assert.True(broken.Depth("a") >= 0);
        Assert.Equal(new[] { "a", "b" }, broken.SubtreeIds(new[] { "a" }).OrderBy(id => id));
    }
}
