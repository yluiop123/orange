using Orange.Api.Configuration;

namespace Orange.Api.Security;

/// <summary>HttpOnly refresh cookie, path-scoped to the auth endpoints.</summary>
public sealed class RefreshCookieService
{
    public const string Name = "refresh_token";
    private const string CookiePath = "/api/v1/auth";
    private readonly AppOptions _options;

    public RefreshCookieService(AppOptions options)
    {
        _options = options;
    }

    public void Set(HttpResponse response, string token)
    {
        response.Cookies.Append(Name, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = _options.CookieSecure,
            SameSite = ParseSameSite(_options.CookieSameSite),
            Path = CookiePath,
            Domain = string.IsNullOrWhiteSpace(_options.CookieDomain) ? null : _options.CookieDomain,
            MaxAge = TimeSpan.FromSeconds(_options.RefreshTokenSeconds)
        });
    }

    public void Clear(HttpResponse response)
    {
        response.Cookies.Append(Name, "", new CookieOptions
        {
            HttpOnly = true,
            Secure = _options.CookieSecure,
            SameSite = ParseSameSite(_options.CookieSameSite),
            Path = CookiePath,
            Domain = string.IsNullOrWhiteSpace(_options.CookieDomain) ? null : _options.CookieDomain,
            MaxAge = TimeSpan.Zero
        });
    }

    private static SameSiteMode ParseSameSite(string value) => value.ToLowerInvariant() switch
    {
        "none" => SameSiteMode.None,
        "strict" => SameSiteMode.Strict,
        _ => SameSiteMode.Lax
    };
}
