using System.Security.Cryptography;
using System.Text.Json;
using Orange.Api.Configuration;
using Orange.Api.Security;

namespace Orange.Tests;

public class JwtServiceTests
{
    private static AppOptions Options(string? privateKey, string? publicKey)
        => new()
        {
            ConnectionString = "Data Source=:memory:",
            JwtSecret = "orange-dev-secret-change-me-in-production",
            JwtPrivateKey = privateKey,
            JwtPublicKey = publicKey,
            JwtIssuer = "orange",
            CorsOrigins = Array.Empty<string>(),
            Port = 0,
            AccessTokenSeconds = 300,
            RefreshTokenSeconds = 600
        };

    [Fact]
    public void Hs256IsUsedWithoutRsaKeys()
    {
        var service = new JwtService(Options(null, null));

        var token = service.GenerateAccessToken("user-id", "alice", 3);

        Assert.Equal("HS256", AlgorithmOf(token));
        var claims = service.ParseAccessToken(token);
        Assert.Equal("user-id", claims.Subject);
        Assert.Equal("alice", claims.Username);
        Assert.Equal(3, claims.Version);
    }

    [Fact]
    public void Rs256IsUsedWhenBothKeysAreConfigured()
    {
        using var rsa = RSA.Create(2048);
        var service = new JwtService(
            Options(rsa.ExportPkcs8PrivateKeyPem(), rsa.ExportSubjectPublicKeyInfoPem()));

        var token = service.GenerateAccessToken("user-id", "alice", 3);

        Assert.Equal("RS256", AlgorithmOf(token));
        var claims = service.ParseAccessToken(token);
        Assert.Equal("user-id", claims.Subject);
        Assert.Equal("alice", claims.Username);
        Assert.Equal(3, claims.Version);
    }

    [Fact]
    public void AnotherRsaKeyCannotVerifyTheToken()
    {
        using var rsa = RSA.Create(2048);
        using var other = RSA.Create(2048);
        var service = new JwtService(
            Options(rsa.ExportPkcs8PrivateKeyPem(), rsa.ExportSubjectPublicKeyInfoPem()));
        var otherService = new JwtService(
            Options(other.ExportPkcs8PrivateKeyPem(), other.ExportSubjectPublicKeyInfoPem()));

        var token = service.GenerateAccessToken("user-id", "alice", 3);

        Assert.Throws<ArgumentException>(() => otherService.ParseAccessToken(token));
    }

    private static string? AlgorithmOf(string token)
    {
        var segment = token.Split('.')[0].Replace('-', '+').Replace('_', '/');
        segment += new string('=', (4 - segment.Length % 4) % 4);
        using var header = JsonDocument.Parse(Convert.FromBase64String(segment));
        return header.RootElement.GetProperty("alg").GetString();
    }
}
