using System.Collections.Specialized;
using System.Text;

namespace Orange.Api.Configuration;

/// <summary>
/// All runtime configuration comes from environment variables, grouped in one place.
/// Defaults match the project-wide PostgreSQL / port conventions.
/// </summary>
public sealed class AppOptions
{
    /// <summary>Engine selected by <c>DB_DRIVER</c> or inferred from <c>DATABASE_URL</c>.</summary>
    public DatabaseDriver Driver { get; init; } = DatabaseDriver.Postgres;

    /// <summary>Provider-specific connection string. See <see cref="DatabaseConnection.Resolve"/>.</summary>
    public required string ConnectionString { get; init; }

    /// <summary>Human-readable description of where the connection came from, for the startup log.</summary>
    public string DatabaseSource { get; init; } = "DB_*";

    public required string JwtSecret { get; init; }
    /// <summary>RSA private key (inline PEM or a file path); null selects HS256.</summary>
    public string? JwtPrivateKey { get; init; }
    /// <summary>RSA public key (inline PEM or a file path).</summary>
    public string? JwtPublicKey { get; init; }
    public required string JwtIssuer { get; init; }
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

    private const string DevJwtSecret = "orange-dev-secret-change-me-in-production";

    public static AppOptions FromEnvironment()
    {
        var database = DatabaseConnection.Resolve();
        var jwtPrivateKey = KeyMaterial("JWT_PRIVATE_KEY", "JWT_PRIVATE_KEY_PATH");
        var jwtPublicKey = KeyMaterial("JWT_PUBLIC_KEY", "JWT_PUBLIC_KEY_PATH");
        if ((jwtPrivateKey is null) != (jwtPublicKey is null))
        {
            throw new InvalidOperationException(
                "JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together");
        }
        var options = new AppOptions
        {
            Driver = database.Driver,
            ConnectionString = database.ConnectionString,
            DatabaseSource = database.Source,
            JwtSecret = Env("JWT_SECRET", DevJwtSecret),
            JwtPrivateKey = jwtPrivateKey,
            JwtPublicKey = jwtPublicKey,
            JwtIssuer = Env("JWT_ISSUER", "orange"),
            CorsOrigins = Env("CORS_ORIGINS", Env("CORS_ALLOWED_ORIGINS", "http://localhost:5173"))
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            Port = EnvInt("APP_PORT", EnvInt("PORT", 8082)),
            AccessTokenSeconds = EnvInt(
                "JWT_ACCESS_EXPIRE",
                EnvInt("ACCESS_TOKEN_EXPIRE_SECONDS", EnvInt("ACCESS_TOKEN_SECONDS", 900))),
            RefreshTokenSeconds = EnvInt("JWT_REFRESH_EXPIRE", 604800),
            LoginMaxAttempts = EnvInt("LOGIN_MAX_ATTEMPTS", 5),
            LoginIpMaxAttempts = EnvInt("LOGIN_IP_MAX_ATTEMPTS", 20),
            LoginLockMinutes = EnvInt("LOGIN_LOCK_MINUTES", 15),
            CookieSecure = EnvBool("COOKIE_SECURE", false),
            CookieSameSite = Env("COOKIE_SAME_SITE", "Lax"),
            CookieDomain = Env("COOKIE_DOMAIN", ""),
            OperationLogRetentionDays = EnvInt("LOG_RETENTION_DAYS", EnvInt("OPERATION_LOG_RETENTION_DAYS", 90))
        };

        if (IsProduction() && options.JwtPrivateKey is null && options.JwtSecret == DevJwtSecret)
        {
            throw new InvalidOperationException(
                "Set JWT_PRIVATE_KEY/JWT_PUBLIC_KEY (recommended) or a non-default JWT_SECRET in production");
        }
        return options;
    }

    /// <summary>Inline PEM or a file path, matching the rule shared by all backends.</summary>
    private static string? KeyMaterial(string primary, string alias)
    {
        var value = Env(primary, Env(alias, ""));
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }
        return value.Contains("-----BEGIN", StringComparison.Ordinal)
            ? value
            : File.ReadAllText(value);
    }

    private static bool IsProduction()
    {
        var environment = Env("APP_ENV", "local").ToLowerInvariant();
        return environment is "production" or "prod";
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

public sealed record DatabaseConnectionSettings(
    DatabaseDriver Driver,
    string ConnectionString,
    string Source);

/// <summary>
/// Resolves the single connection switch documented in docs/DB-MATRIX.md.
/// Precedence: <c>DATABASE_URL</c> wins over the discrete <c>DB_*</c> variables.
/// <c>DB_DRIVER</c> selects the provider; when it is unset the scheme of
/// <c>DATABASE_URL</c> selects it and PostgreSQL is the default.
/// </summary>
public static class DatabaseConnection
{
    public static DatabaseConnectionSettings Resolve()
    {
        var driverText = Environment.GetEnvironmentVariable("DB_DRIVER");
        var hasDriver = !string.IsNullOrWhiteSpace(driverText);
        var driver = DatabaseDriver.Postgres;
        if (hasDriver && !DatabaseDrivers.TryParse(driverText, out driver))
        {
            throw new InvalidOperationException(
                $"Unsupported DB_DRIVER '{driverText}'. Use postgres, mysql, mariadb or sqlite.");
        }

        var url = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(url))
        {
            var trimmed = url.Trim();
            var schemeDriver = DetectScheme(trimmed, out var hasScheme);
            if (!hasScheme)
            {
                if (hasDriver && driver == DatabaseDriver.Sqlite)
                {
                    return new DatabaseConnectionSettings(
                        DatabaseDriver.Sqlite, SqliteConnectionString(trimmed), "DATABASE_URL");
                }
                throw new InvalidOperationException(
                    "DATABASE_URL must start with postgres://, postgresql://, mysql://, mariadb:// or sqlite: "
                    + "unless DB_DRIVER=sqlite and the value is a file path.");
            }
            if (hasDriver && schemeDriver != driver)
            {
                throw new InvalidOperationException(
                    $"DB_DRIVER={DatabaseDrivers.ToName(driver)} conflicts with DATABASE_URL scheme "
                    + $"'{DatabaseDrivers.ToName(schemeDriver)}'.");
            }
            return new DatabaseConnectionSettings(
                schemeDriver, FromUrl(schemeDriver, trimmed), "DATABASE_URL");
        }

        return new DatabaseConnectionSettings(driver, FromDiscrete(driver), "DB_*");
    }

    private static bool HasScheme(string value, string scheme)
        => value.StartsWith(scheme, StringComparison.OrdinalIgnoreCase);

    private static DatabaseDriver DetectScheme(string value, out bool hasScheme)
    {
        hasScheme = true;
        if (HasScheme(value, "postgres://") || HasScheme(value, "postgresql://"))
        {
            return DatabaseDriver.Postgres;
        }
        if (HasScheme(value, "mysql://"))
        {
            return DatabaseDriver.MySql;
        }
        if (HasScheme(value, "mariadb://"))
        {
            return DatabaseDriver.MariaDb;
        }
        if (HasScheme(value, "sqlite:") || HasScheme(value, "sqlite3:") || HasScheme(value, "file:"))
        {
            return DatabaseDriver.Sqlite;
        }
        hasScheme = false;
        return DatabaseDriver.Postgres;
    }

    private static string FromUrl(DatabaseDriver driver, string url)
    {
        if (driver == DatabaseDriver.Sqlite)
        {
            return SqliteConnectionString(StripSqliteScheme(url));
        }

        var uri = new Uri(url);
        var userInfo = Uri.UnescapeDataString(uri.UserInfo).Split(':', 2);
        var user = userInfo.Length > 0 ? userInfo[0] : "";
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var database = Uri.UnescapeDataString(uri.AbsolutePath.Trim('/'));
        var parameters = ParseQuery(uri.Query);
        var defaultPort = driver == DatabaseDriver.Postgres ? 5432 : 3306;
        var port = uri.Port > 0 ? uri.Port : defaultPort;

        return driver == DatabaseDriver.Postgres
            ? PostgresConnectionString(uri.Host, port, database, user, password, parameters)
            : MySqlConnectionString(uri.Host, port, database, user, password, parameters);
    }

    private static string FromDiscrete(DatabaseDriver driver)
    {
        if (driver == DatabaseDriver.Sqlite)
        {
            var explicitPath = Env("SQLITE_PATH", "");
            if (!string.IsNullOrWhiteSpace(explicitPath))
            {
                return SqliteConnectionString(explicitPath);
            }
            var name = Env("DB_NAME", "orange-csharp.db");
            return SqliteConnectionString(name.EndsWith(".db", StringComparison.OrdinalIgnoreCase)
                ? name
                : "orange-csharp.db");
        }

        var host = Env("DB_HOST", "localhost");
        var defaultPort = driver == DatabaseDriver.Postgres ? 5432 : 3306;
        var port = EnvInt("DB_PORT", defaultPort);
        var database = Env("DB_NAME", "orange");
        var user = Env("DB_USER", driver == DatabaseDriver.Postgres ? "postgres" : "root");
        var password = Env("DB_PASSWORD", driver == DatabaseDriver.Postgres ? "postgres" : "root");

        return driver == DatabaseDriver.Postgres
            ? PostgresConnectionString(host, port, database, user, password, new NameValueCollection())
            : MySqlConnectionString(host, port, database, user, password, new NameValueCollection());
    }

    private static string PostgresConnectionString(
        string host,
        int port,
        string database,
        string user,
        string password,
        NameValueCollection parameters)
    {
        // Identical to the previous hard-coded PostgreSQL string, so existing
        // deployments keep their pooling and timeout behavior.
        var builder = new StringBuilder()
            .Append($"Host={host};Port={port};Database={database};Username={user};Password={password};")
            .Append("Pooling=true;Maximum Pool Size=20;Timeout=30");
        var sslMode = SslMode(parameters, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["disable"] = "Disable",
            ["allow"] = "Allow",
            ["prefer"] = "Prefer",
            ["require"] = "Require",
            ["verify-ca"] = "VerifyCA",
            ["verify-full"] = "VerifyFull"
        });
        if (sslMode is not null)
        {
            builder.Append($";SSL Mode={sslMode}");
        }
        return builder.ToString();
    }

    private static string MySqlConnectionString(
        string host,
        int port,
        string database,
        string user,
        string password,
        NameValueCollection parameters)
    {
        var builder = new StringBuilder()
            .Append($"Server={host};Port={port};Database={database};User ID={user};Password={password};")
            .Append("Pooling=true;MaximumPoolSize=20;ConnectionTimeout=30;AllowPublicKeyRetrieval=true");
        var sslMode = SslMode(parameters, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["disable"] = "None",
            ["none"] = "None",
            ["allow"] = "Preferred",
            ["prefer"] = "Preferred",
            ["preferred"] = "Preferred",
            ["require"] = "Required",
            ["required"] = "Required",
            ["verify-ca"] = "VerifyCA",
            ["verify-full"] = "VerifyFull"
        });
        if (sslMode is not null)
        {
            builder.Append($";SslMode={sslMode}");
        }
        return builder.ToString();
    }

    private static string SqliteConnectionString(string path)
        => $"Data Source={path.Trim()};Foreign Keys=True;Pooling=true";

    private static string StripSqliteScheme(string url)
    {
        var value = url.Trim();
        if (HasScheme(value, "sqlite3:"))
        {
            value = value["sqlite3:".Length..];
        }
        else if (HasScheme(value, "sqlite:"))
        {
            value = value["sqlite:".Length..];
        }
        else if (HasScheme(value, "file:"))
        {
            value = value["file:".Length..];
        }

        if (value.StartsWith("//", StringComparison.Ordinal))
        {
            value = value[2..];
        }
        // sqlite:///C:/path and /D:/path both mean an absolute Windows path.
        if (value.Length >= 3 && value[0] == '/' && char.IsLetter(value[1]) && value[2] == ':')
        {
            value = value[1..];
        }
        return value.Length == 0 ? "orange-csharp.db" : value;
    }

    private static NameValueCollection ParseQuery(string query)
    {
        var result = new NameValueCollection();
        var text = query.TrimStart('?');
        if (text.Length == 0)
        {
            return result;
        }
        foreach (var pair in text.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : "";
            result[key] = value;
        }
        return result;
    }

    private static string? SslMode(NameValueCollection parameters, Dictionary<string, string> allowed)
    {
        var requested = parameters["sslmode"] ?? parameters["ssl-mode"];
        if (string.IsNullOrWhiteSpace(requested))
        {
            return null;
        }
        return allowed.TryGetValue(requested.Trim(), out var mapped) ? mapped : null;
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
}
