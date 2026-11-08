using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Orange.Api.Configuration;

namespace Orange.Api.Security;

public sealed record JwtClaims(
    string Jti,
    string Type,
    string Username,
    string Subject,
    int Version,
    DateTimeOffset IssuedAt,
    DateTimeOffset ExpiresAt);

/// <summary>
/// Minimal JWT implementation with the same contract as the other five stacks:
/// a configured RSA pair signs with RS256, otherwise JWT_SECRET signs with HS256.
/// Tokens carry jti, typ (access/refresh), ver (user token_version), username and
/// sub (user id), matching the Java claims.
/// </summary>
public sealed class JwtService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = null };

    private readonly byte[] _key = Array.Empty<byte>();
    private readonly string? _privateKeyPem;
    private readonly string? _publicKeyPem;
    private readonly string _algorithm;
    private readonly string _issuer;

    public JwtService(AppOptions options)
    {
        if ((options.JwtPrivateKey is null) != (options.JwtPublicKey is null))
        {
            throw new InvalidOperationException(
                "JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together");
        }
        _algorithm = options.JwtPrivateKey is null ? "HS256" : "RS256";
        _privateKeyPem = options.JwtPrivateKey;
        _publicKeyPem = options.JwtPublicKey;
        if (_algorithm == "HS256")
        {
            if (string.IsNullOrWhiteSpace(options.JwtSecret))
            {
                throw new InvalidOperationException("JWT_SECRET must not be empty");
            }
            _key = Encoding.UTF8.GetBytes(options.JwtSecret);
        }
        else
        {
            // Fail at startup, not on the first login, if the PEM is unusable.
            using var privateRsa = RSA.Create();
            privateRsa.ImportFromPem(_privateKeyPem!);
            using var publicRsa = RSA.Create();
            publicRsa.ImportFromPem(_publicKeyPem!);
        }
        _issuer = options.JwtIssuer;
        AccessExpireSeconds = options.AccessTokenSeconds;
        RefreshExpireSeconds = options.RefreshTokenSeconds;
    }

    public long AccessExpireSeconds { get; }
    public long RefreshExpireSeconds { get; }

    public string GenerateAccessToken(string userId, string username, int tokenVersion)
        => Generate(userId, username, tokenVersion, "access", AccessExpireSeconds);

    public string GenerateRefreshToken(string userId, string username, int tokenVersion)
        => Generate(userId, username, tokenVersion, "refresh", RefreshExpireSeconds);

    public JwtClaims ParseAccessToken(string token) => RequireType(Parse(token), "access");

    public JwtClaims ParseRefreshToken(string token) => RequireType(Parse(token), "refresh");

    private string Generate(string userId, string username, int version, string type, long expireSeconds)
    {
        var issuedAt = DateTimeOffset.UtcNow;
        var expiresAt = issuedAt.AddSeconds(expireSeconds);
        var header = new Dictionary<string, object>
        {
            ["alg"] = _algorithm,
            ["typ"] = "JWT"
        };
        var payload = new Dictionary<string, object>
        {
            ["jti"] = Guid.NewGuid().ToString(),
            ["typ"] = type,
            ["ver"] = version,
            ["username"] = username,
            ["sub"] = userId,
            ["iss"] = _issuer,
            ["iat"] = issuedAt.ToUnixTimeSeconds(),
            ["exp"] = expiresAt.ToUnixTimeSeconds()
        };
        var encodedHeader = Base64Url(JsonSerializer.SerializeToUtf8Bytes(header, JsonOptions));
        var encodedPayload = Base64Url(JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions));
        var signingInput = encodedHeader + "." + encodedPayload;
        var signature = _algorithm == "RS256"
            ? SignRsa(signingInput)
            : SignHmac(signingInput);
        return signingInput + "." + Base64Url(signature);
    }

    private JwtClaims Parse(string token)
    {
        var parts = token.Split('.');
        if (parts.Length != 3)
        {
            throw new ArgumentException("malformed token");
        }
        var actual = FromBase64Url(parts[2]);
        var verified = _algorithm == "RS256"
            ? VerifyRsa(parts[0] + "." + parts[1], actual)
            : VerifyHmac(parts[0] + "." + parts[1], actual);
        if (!verified)
        {
            throw new ArgumentException("invalid signature");
        }

        using var header = JsonDocument.Parse(FromBase64Url(parts[0]));
        if (!header.RootElement.TryGetProperty("alg", out var alg)
            || alg.GetString() != _algorithm)
        {
            throw new ArgumentException("unsupported algorithm");
        }

        using var payload = JsonDocument.Parse(FromBase64Url(parts[1]));
        var root = payload.RootElement;
        var jti = root.GetProperty("jti").GetString() ?? throw new ArgumentException("missing jti");
        var type = root.GetProperty("typ").GetString() ?? throw new ArgumentException("missing typ");
        var username = root.GetProperty("username").GetString() ?? throw new ArgumentException("missing username");
        var subject = root.GetProperty("sub").GetString() ?? throw new ArgumentException("missing sub");
        var issuer = root.TryGetProperty("iss", out var iss) ? iss.GetString() : null;
        if (!string.Equals(issuer, _issuer, StringComparison.Ordinal))
        {
            throw new ArgumentException("invalid issuer");
        }
        var version = root.GetProperty("ver").GetInt32();
        var issuedAt = DateTimeOffset.FromUnixTimeSeconds(root.GetProperty("iat").GetInt64());
        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(root.GetProperty("exp").GetInt64());
        if (expiresAt <= DateTimeOffset.UtcNow)
        {
            throw new ArgumentException("token expired");
        }
        return new JwtClaims(jti, type, username, subject, version, issuedAt, expiresAt);
    }

    private byte[] SignHmac(string signingInput)
    {
        using var hmac = new HMACSHA256(_key);
        return hmac.ComputeHash(Encoding.ASCII.GetBytes(signingInput));
    }

    private bool VerifyHmac(string signingInput, byte[] signature)
    {
        using var hmac = new HMACSHA256(_key);
        var expected = hmac.ComputeHash(Encoding.ASCII.GetBytes(signingInput));
        return CryptographicOperations.FixedTimeEquals(expected, signature);
    }

    private byte[] SignRsa(string signingInput)
    {
        using var rsa = RSA.Create();
        rsa.ImportFromPem(_privateKeyPem!);
        return rsa.SignData(
            Encoding.ASCII.GetBytes(signingInput),
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
    }

    private bool VerifyRsa(string signingInput, byte[] signature)
    {
        using var rsa = RSA.Create();
        rsa.ImportFromPem(_publicKeyPem!);
        return rsa.VerifyData(
            Encoding.ASCII.GetBytes(signingInput),
            signature,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
    }

    private static JwtClaims RequireType(JwtClaims claims, string expected)
    {
        if (claims.Type != expected)
        {
            throw new ArgumentException("not a " + expected + " token");
        }
        return claims;
    }

    private static string Base64Url(byte[] bytes)
        => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] FromBase64Url(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded += new string('=', (4 - padded.Length % 4) % 4);
        return Convert.FromBase64String(padded);
    }
}
