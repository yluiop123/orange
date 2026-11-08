using Orange.Api.Domain;
using Orange.Api.Services;

namespace Orange.Tests;

public class MenuServiceTests
{
    private static async Task<SqliteTestDatabase> SeededAsync()
    {
        var database = await SqliteTestDatabase.CreateAsync();
        var db = database.Db;
        db.Permissions.AddRange(
            new Permission
            {
                Id = "0001",
                Name = "仪表盘",
                Path = "/dashboard",
                Type = "menu",
                Status = "1"
            },
            new Permission
            {
                Id = "000100",
                Name = "报表",
                Path = "/dashboard/reports",
                Type = "menu",
                Status = "1",
                ParentId = "0001"
            },
            new Permission
            {
                Id = "0002",
                Name = "禁用菜单",
                Path = "/disabled",
                Type = "menu",
                Status = "0"
            });
        db.PermissionI18n.AddRange(
            new PermissionI18n { PermissionId = "0001", Locale = "en-US", Name = "US Dashboard" },
            new PermissionI18n { PermissionId = "0001", Locale = "en", Name = "Dashboard" },
            new PermissionI18n { PermissionId = "000100", Locale = "en", Name = "Reports" });
        await db.SaveChangesAsync();
        return database;
    }

    [Fact]
    public async Task ExactLocaleWinsAndHeadersWithWeightsAreAccepted()
    {
        await using var database = await SeededAsync();
        var service = new MenuService(database.Db);

        var roots = await service.QueryTreeAsync("en-US,en;q=0.9", CancellationToken.None);

        var root = Assert.Single(roots);
        Assert.Equal("US Dashboard", root.Name);
        Assert.Equal("Reports", Assert.Single(root.Children).Name);
    }

    [Fact]
    public async Task ExactLocaleIsCaseInsensitive()
    {
        await using var database = await SeededAsync();
        var service = new MenuService(database.Db);

        var roots = await service.QueryTreeAsync("EN-us", CancellationToken.None);

        Assert.Equal("US Dashboard", Assert.Single(roots).Name);
    }

    [Fact]
    public async Task LanguagePartIsUsedWhenTheExactLocaleIsMissing()
    {
        await using var database = await SeededAsync();
        var service = new MenuService(database.Db);

        var roots = await service.QueryTreeAsync("en-GB", CancellationToken.None);

        var root = Assert.Single(roots);
        Assert.Equal("Dashboard", root.Name);
        Assert.Equal("Reports", Assert.Single(root.Children).Name);
    }

    [Theory]
    [InlineData("fr")]
    [InlineData(null)]
    [InlineData("")]
    public async Task MissingTranslationsFallBackToPermissionName(string? locale)
    {
        await using var database = await SeededAsync();
        var service = new MenuService(database.Db);

        var roots = await service.QueryTreeAsync(locale, CancellationToken.None);

        var root = Assert.Single(roots);
        Assert.Equal("仪表盘", root.Name);
        Assert.Equal("报表", Assert.Single(root.Children).Name);
    }

    [Fact]
    public async Task DisabledBranchesStayHidden()
    {
        await using var database = await SeededAsync();
        var service = new MenuService(database.Db);

        var roots = await service.QueryTreeAsync("en", CancellationToken.None);

        Assert.Equal(new[] { "0001" }, roots.Select(item => item.Id));
    }
}
