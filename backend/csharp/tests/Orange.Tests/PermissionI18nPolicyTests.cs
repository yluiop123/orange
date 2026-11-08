using Orange.Api.Domain;

namespace Orange.Tests;

public class PermissionI18nPolicyTests
{
    [Theory]
    [InlineData("zh")]
    [InlineData("en")]
    [InlineData("en-US")]
    [InlineData("pt-BR")]
    [InlineData("en-us")]
    public void ValidLocalesAreAccepted(string locale)
    {
        var normalized = PermissionI18nPolicy.Normalize(
            new Dictionary<string, string> { [locale] = "Name" });

        Assert.Equal("Name", normalized[locale]);
    }

    [Theory]
    [InlineData("EN")]
    [InlineData("e")]
    [InlineData("eng")]
    [InlineData("en_US")]
    [InlineData("en-us-extra")]
    [InlineData("")]
    public void InvalidLocalesAreRejected(string locale)
        => Assert.Throws<BusinessException>(() =>
            PermissionI18nPolicy.Normalize(new Dictionary<string, string> { [locale] = "Name" }));

    [Fact]
    public void NamesAreTrimmedAndBlankNamesRejected()
    {
        var normalized = PermissionI18nPolicy.Normalize(
            new Dictionary<string, string> { [" en "] = "  Dashboard  " });

        Assert.Equal("Dashboard", normalized["en"]);
        Assert.Throws<BusinessException>(() =>
            PermissionI18nPolicy.Normalize(new Dictionary<string, string> { ["en"] = "   " }));
    }

    [Fact]
    public void NamesLongerThan255AreRejected()
    {
        var tooLong = new string('a', PermissionI18nPolicy.NameMaxLength + 1);
        Assert.Throws<BusinessException>(() =>
            PermissionI18nPolicy.Normalize(new Dictionary<string, string> { ["en"] = tooLong }));

        var atLimit = new string('a', PermissionI18nPolicy.NameMaxLength);
        Assert.Equal(atLimit, PermissionI18nPolicy.Normalize(
            new Dictionary<string, string> { ["en"] = atLimit })["en"]);
    }

    [Fact]
    public void ExactLocaleWinsCaseInsensitively()
    {
        var translations = new Dictionary<string, string>
        {
            ["en-US"] = "US Dashboard",
            ["en"] = "Dashboard"
        };

        Assert.Equal("US Dashboard", PermissionI18nPolicy.Resolve("en-US", translations, "仪表盘"));
        Assert.Equal("US Dashboard", PermissionI18nPolicy.Resolve("EN-us", translations, "仪表盘"));
    }

    [Fact]
    public void LanguagePartIsTheSecondChoice()
    {
        var translations = new Dictionary<string, string>
        {
            ["en-US"] = "US Dashboard",
            ["en"] = "Dashboard"
        };

        Assert.Equal("Dashboard", PermissionI18nPolicy.Resolve("en-GB", translations, "仪表盘"));
    }

    [Fact]
    public void DefaultNameIsTheFinalFallback()
    {
        var translations = new Dictionary<string, string> { ["en"] = "Dashboard" };

        Assert.Equal("仪表盘", PermissionI18nPolicy.Resolve("fr", translations, "仪表盘"));
        Assert.Equal("仪表盘", PermissionI18nPolicy.Resolve(null, translations, "仪表盘"));
        Assert.Equal("仪表盘", PermissionI18nPolicy.Resolve("en", null, "仪表盘"));
    }

    [Fact]
    public void BlankTranslationFallsThroughToTheLanguageThenDefault()
    {
        var translations = new Dictionary<string, string>
        {
            ["en-US"] = "   ",
            ["en"] = "Dashboard"
        };

        Assert.Equal("Dashboard", PermissionI18nPolicy.Resolve("en-US", translations, "仪表盘"));
    }

    [Theory]
    [InlineData("en-US,en;q=0.9", "en-US")]
    [InlineData(" en-GB ", "en-GB")]
    [InlineData("*", null)]
    [InlineData("", null)]
    public void PrimaryLocaleDropsWeightsAndLaterCandidates(string header, string? expected)
        => Assert.Equal(expected, PermissionI18nPolicy.PrimaryLocale(header));
}
