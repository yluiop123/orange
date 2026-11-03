using Orange.Api.Configuration;

namespace Orange.Api.Data;

/// <summary>
/// The few places where the four engines genuinely differ. Everything else goes
/// through EF Core's LINQ translation.
/// </summary>
public sealed class SqlDialect
{
    public SqlDialect(DatabaseDriver driver)
    {
        Driver = driver;
    }

    public DatabaseDriver Driver { get; }

    public bool IsPostgres => Driver == DatabaseDriver.Postgres;

    public bool IsMySql => Driver is DatabaseDriver.MySql or DatabaseDriver.MariaDb;

    public bool IsSqlite => Driver == DatabaseDriver.Sqlite;

    /// <summary>
    /// PostgreSQL keeps <see cref="DateTimeOffset"/> parameters and timestamptz
    /// columns. The other engines store UTC wall-clock values without an offset,
    /// so parameters are unwrapped to <see cref="DateTime"/> (UTC ticks).
    /// </summary>
    public DateTime ToDbTimestamp(DateTimeOffset value)
        => DateTime.SpecifyKind(value.UtcDateTime, DateTimeKind.Unspecified);

    public DateTime? ToDbTimestamp(DateTimeOffset? value)
        => value is null ? null : ToDbTimestamp(value.Value);
}
