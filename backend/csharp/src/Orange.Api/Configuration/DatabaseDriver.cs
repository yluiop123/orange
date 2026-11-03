namespace Orange.Api.Configuration;

/// <summary>
/// The relational engine behind the API. Selected with <c>DB_DRIVER</c>
/// (<c>postgres</c> by default) or inferred from a <c>DATABASE_URL</c> scheme.
/// </summary>
public enum DatabaseDriver
{
    Postgres,
    MySql,
    MariaDb,
    Sqlite
}

public static class DatabaseDrivers
{
    public static bool TryParse(string? value, out DatabaseDriver driver)
    {
        switch ((value ?? "").Trim().ToLowerInvariant())
        {
            case "":
            case "postgres":
            case "postgresql":
            case "pgsql":
            case "npgsql":
                driver = DatabaseDriver.Postgres;
                return true;
            case "mysql":
                driver = DatabaseDriver.MySql;
                return true;
            case "mariadb":
            case "maria":
                driver = DatabaseDriver.MariaDb;
                return true;
            case "sqlite":
            case "sqlite3":
                driver = DatabaseDriver.Sqlite;
                return true;
            default:
                driver = DatabaseDriver.Postgres;
                return false;
        }
    }

    public static string ToName(DatabaseDriver driver) => driver switch
    {
        DatabaseDriver.MySql => "mysql",
        DatabaseDriver.MariaDb => "mariadb",
        DatabaseDriver.Sqlite => "sqlite",
        _ => "postgres"
    };
}
