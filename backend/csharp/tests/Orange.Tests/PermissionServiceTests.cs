using Microsoft.EntityFrameworkCore;
using Orange.Api.Configuration;
using Orange.Api.Contracts;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Services;

namespace Orange.Tests;

public class PermissionServiceTests
{
    private static PermissionService Service(SqliteTestDatabase database)
        => new(database.Db, new SqlDialect(DatabaseDriver.Sqlite));

    private static AddChildPermissionRequest CreateRequest(
        string id,
        string name,
        string path,
        string type = "menu",
        string? parentId = null,
        Dictionary<string, string>? translations = null)
        => new()
        {
            Id = id,
            Name = name,
            Path = path,
            Type = type,
            ParentId = parentId,
            Translations = translations
        };

    [Fact]
    public async Task CreateInsertsTranslationsAndGetReturnsThem()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        var bean = await service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string>
                {
                    ["zh"] = "仪表盘",
                    ["en-US"] = "US Dashboard"
                }),
            CancellationToken.None);

        Assert.Equal("US Dashboard", bean.Translations["en-US"]);
        Assert.Equal("仪表盘", bean.Translations["zh"]);

        var fetched = await service.GetAsync("0001", CancellationToken.None);
        Assert.Equal("仪表盘", fetched.Name);
        Assert.Equal(2, fetched.Translations.Count);
        Assert.Equal("US Dashboard", fetched.Translations["en-US"]);

        var rows = await database.Db.PermissionI18n.AsNoTracking().ToListAsync();
        Assert.Equal(2, rows.Count);
        Assert.All(rows, row => Assert.Equal("0001", row.PermissionId));
    }

    [Fact]
    public async Task PermissionWithoutTranslationsReturnsAnEmptyMap()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        var bean = await service.AddChildAsync(
            CreateRequest("0001", "仪表盘", "/dashboard"),
            CancellationToken.None);

        Assert.Empty(bean.Translations);
        var fetched = await service.GetAsync("0001", CancellationToken.None);
        Assert.Empty(fetched.Translations);
    }

    [Fact]
    public async Task ListIncludesTranslationsForEveryNode()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        await service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string> { ["en"] = "Dashboard" }),
            CancellationToken.None);
        await service.AddChildAsync(
            CreateRequest(
                "000100",
                "报表",
                "/dashboard/reports",
                parentId: "0001",
                translations: new Dictionary<string, string> { ["en"] = "Reports" }),
            CancellationToken.None);

        var all = await service.QueryAsync(new QueryPermissionRequest(), CancellationToken.None);

        Assert.Equal(2, all.Count);
        Assert.Equal("Dashboard", all.Single(item => item.Id == "0001").Translations["en"]);
        Assert.Equal("Reports", all.Single(item => item.Id == "000100").Translations["en"]);
    }

    [Fact]
    public async Task EditOmittedKeepsTranslationsAndProvidedReplacesAllRows()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        await service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string>
                {
                    ["zh"] = "仪表盘",
                    ["en"] = "Dashboard"
                }),
            CancellationToken.None);

        await service.EditAsync(
            "0001",
            new EditPermissionRequest { Name = "新仪表盘" },
            CancellationToken.None);

        var kept = await service.GetAsync("0001", CancellationToken.None);
        Assert.Equal("新仪表盘", kept.Name);
        Assert.Equal(2, kept.Translations.Count);
        Assert.Equal("Dashboard", kept.Translations["en"]);

        await service.EditAsync(
            "0001",
            new EditPermissionRequest
            {
                Translations = new Dictionary<string, string> { ["fr"] = "Tableau" }
            },
            CancellationToken.None);

        var replaced = await service.GetAsync("0001", CancellationToken.None);
        Assert.Single(replaced.Translations);
        Assert.Equal("Tableau", replaced.Translations["fr"]);

        await service.EditAsync(
            "0001",
            new EditPermissionRequest { Translations = new Dictionary<string, string>() },
            CancellationToken.None);

        var cleared = await service.GetAsync("0001", CancellationToken.None);
        Assert.Empty(cleared.Translations);
        Assert.Empty(await database.Db.PermissionI18n.AsNoTracking().ToListAsync());
    }

    [Fact]
    public async Task DeleteRemovesSubtreePermissionsAndTranslations()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        await service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string> { ["en"] = "Dashboard" }),
            CancellationToken.None);
        await service.AddChildAsync(
            CreateRequest(
                "000100",
                "报表",
                "/dashboard/reports",
                parentId: "0001",
                translations: new Dictionary<string, string> { ["en"] = "Reports" }),
            CancellationToken.None);

        await service.DeleteAsync(new[] { "0001" }, CancellationToken.None);

        Assert.Empty(await database.Db.Permissions.AsNoTracking().ToListAsync());
        Assert.Empty(await database.Db.PermissionI18n.AsNoTracking().ToListAsync());
    }

    [Fact]
    public async Task InvalidTranslationsRejectCreateWithoutWritingAnything()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        await Assert.ThrowsAsync<BusinessException>(() => service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string> { ["EN"] = "Dashboard" }),
            CancellationToken.None));
        await Assert.ThrowsAsync<BusinessException>(() => service.AddChildAsync(
            CreateRequest(
                "0002",
                "用户",
                "/system/user",
                translations: new Dictionary<string, string> { ["en"] = "   " }),
            CancellationToken.None));

        Assert.Empty(await database.Db.Permissions.AsNoTracking().ToListAsync());
        Assert.Empty(await database.Db.PermissionI18n.AsNoTracking().ToListAsync());
    }

    [Fact]
    public async Task InvalidTranslationsRejectEditWithoutChangingCurrentRows()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var service = Service(database);

        await service.AddChildAsync(
            CreateRequest(
                "0001",
                "仪表盘",
                "/dashboard",
                translations: new Dictionary<string, string> { ["en"] = "Dashboard" }),
            CancellationToken.None);

        var tooLong = new string('a', PermissionI18nPolicy.NameMaxLength + 1);
        await Assert.ThrowsAsync<BusinessException>(() => service.EditAsync(
            "0001",
            new EditPermissionRequest
            {
                Name = "不应保存",
                Translations = new Dictionary<string, string> { ["en"] = tooLong }
            },
            CancellationToken.None));

        var unchanged = await service.GetAsync("0001", CancellationToken.None);
        Assert.Equal("仪表盘", unchanged.Name);
        Assert.Single(unchanged.Translations);
        Assert.Equal("Dashboard", unchanged.Translations["en"]);
    }
}
