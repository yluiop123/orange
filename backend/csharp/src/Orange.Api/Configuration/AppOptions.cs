namespace Orange.Api.Configuration;

/// <summary>
/// All runtime configuration comes from environment variables, grouped in one place.
/// Defaults match the project-wide PostgreSQL / port conventions.
/// </summary>
public sealed class AppOptions
{
    public required string DatabaseHost { get; init; }
    public required int DatabasePort { get; init; }
    public required string DatabaseName { get; init; }
    public required string DatabaseUser { get; init; }
    public required string DatabasePassword { get; init; }
    public required string JwtSecret { get; init; }
    public required string[] CorsOrigins { get; init; }
    public required int Port { get; init; }
    public int AccessTokenSeconds { get; init; } = 900;
    public int RefreshTokenSeconds { get; init; } = 604800;
    public int LoginMaxAttempts { get; init; } = 5;
    public int LoginIpMaxAttempts { get; init; } = 20;
    public int LoginLockMinutes { get; init; } = 15;
    public bool CookieSecure { get; init; }
    public string CookieSameSite { get; init; } = "Lax";
    public string CookieDomain { get; init; } = "";
    public int OperationLogRetentionDays { get; init; } = 90;

    public string ConnectionString =>
        $"Host={DatabaseHost};Port={DatabasePort};Database={DatabaseName};Username={DatabaseUser};Password={DatabasePassword};" +
        "Pooling=true;Maximum Pool Size=20;Timeout=30";

    public static AppOptions FromEnvironment()
    {
        return new AppOptions
        {
            DatabaseHost = Env("DB_HOST", "localhost"),
            DatabasePort = EnvInt("DB_PORT", 5432),
            DatabaseName = Env("DB_NAME", "orange"),
            DatabaseUser = Env("DB_USER", "postgres"),
            DatabasePassword = Env("DB_PASSWORD", "postgres"),
            // Development-only default. Production must set JWT_SECRET.
            JwtSecret = Env("JWT_SECRET", "orange-development-secret-change-me-0123456789abcdef"),
            CorsOrigins = Env("CORS_ORIGINS", Env("CORS_ALLOWED_ORIGINS", "http://localhost:5173"))
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            Port = EnvInt("APP_PORT", EnvInt("PORT", 8082)),
            AccessTokenSeconds = EnvInt("JWT_ACCESS_EXPIRE", EnvInt("ACCESS_TOKEN_SECONDS", 900)),
            RefreshTokenSeconds = EnvInt("JWT_REFRESH_EXPIRE", 604800),
            LoginMaxAttempts = EnvInt("LOGIN_MAX_ATTEMPTS", 5),
            LoginIpMaxAttempts = EnvInt("LOGIN_IP_MAX_ATTEMPTS", 20),
            LoginLockMinutes = EnvInt("LOGIN_LOCK_MINUTES", 15),
            CookieSecure = EnvBool("COOKIE_SECURE", false),
            CookieSameSite = Env("COOKIE_SAME_SITE", "Lax"),
            CookieDomain = Env("COOKIE_DOMAIN", ""),
            OperationLogRetentionDays = EnvInt("LOG_RETENTION_DAYS", EnvInt("OPERATION_LOG_RETENTION_DAYS", 90))
        };
    }

    private static string Env(string key, string fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static int EnvInt(string key, int fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    private static bool EnvBool(string key, bool fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
