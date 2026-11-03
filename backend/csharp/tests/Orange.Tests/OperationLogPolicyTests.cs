using Orange.Api.Domain;

namespace Orange.Tests;

public class OperationLogPolicyTests
{
    [Theory]
    [InlineData("POST", "/api/v1/system/users", true)]
    [InlineData("PATCH", "/api/v1/system/users/1", true)]
    [InlineData("DELETE", "/api/v1/system/roles", true)]
    [InlineData("POST", "/api/v1/auth/change-password", true)]
    [InlineData("POST", "/api/v1/auth/login", false)]
    [InlineData("POST", "/api/v1/auth/refresh", false)]
    [InlineData("GET", "/api/v1/system/users", false)]
    [InlineData("OPTIONS", "/api/v1/system/users", false)]
    public void RecordsOnlySystemWritesAndPasswordChanges(string method, string path, bool expected)
        => Assert.Equal(expected, OperationLogPolicy.ShouldRecord(method, path));

    [Theory]
    [InlineData("/api/v1/auth/login", true)]
    [InlineData("/api/v1/auth/refresh", true)]
    [InlineData("/api/v1/auth/change-password", true)]
    [InlineData("/api/v1/system/users/1/reset-password", true)]
    [InlineData("/api/v1/system/users", false)]
    public void MarksPasswordAndTokenPathsAsSensitive(string path, bool expected)
        => Assert.Equal(expected, OperationLogPolicy.IsSensitivePath(path));

    [Fact]
    public void RedactsSensitiveJsonFieldsAndTruncates()
    {
        var body = "{\"password\":\"secret\",\"token\":\"abc\",\"clientSecret\":\"xyz\",\"name\":\"ok\"}";

        var sanitized = OperationLogPolicy.SanitizeBody(body)!;

        Assert.DoesNotContain("secret", sanitized);
        Assert.DoesNotContain("abc", sanitized);
        Assert.DoesNotContain("xyz", sanitized);
        Assert.Contains("\"***\"", sanitized);
        Assert.Contains("ok", sanitized);
        Assert.Equal(4000, OperationLogPolicy.SanitizeBody(new string('a', 5000))!.Length);
        Assert.Null(OperationLogPolicy.SanitizeBody(null));
    }

    [Fact]
    public void TruncatesQueryStrings()
    {
        Assert.Equal(500, OperationLogPolicy.TruncateQuery(new string('q', 600))!.Length);
        Assert.Equal("a=1", OperationLogPolicy.TruncateQuery("a=1"));
        Assert.Null(OperationLogPolicy.TruncateQuery(null));
    }

    [Fact]
    public void ResolvesTheFirstForwardedAddress()
    {
        Assert.Equal("203.0.113.1", OperationLogPolicy.ClientIp("203.0.113.1, 10.0.0.1", "127.0.0.1"));
        Assert.Equal("127.0.0.1", OperationLogPolicy.ClientIp(null, "127.0.0.1"));
        Assert.Equal("127.0.0.1", OperationLogPolicy.ClientIp("   ", "127.0.0.1"));
    }
}
