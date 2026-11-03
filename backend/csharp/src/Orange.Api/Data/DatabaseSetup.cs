using Microsoft.EntityFrameworkCore;
using Orange.Api.Configuration;

namespace Orange.Api.Data;

/// <summary>
/// One place that maps <see cref="DatabaseDriver"/> to an EF Core provider.
/// PostgreSQL stays the default; the other engines share the same schema,
/// response envelope and business rules.
/// </summary>
public static class DatabaseSetup
{
    // Pomelo needs a server version to gate SQL translation. The features used
    // here (LIKE, ON DUPLICATE KEY, transactions) exist in every supported
    // release, so a conservative baseline is enough.
    private static readonly MySqlServerVersion MySqlVersion = new(new Version(8, 0, 36));
    private static readonly MariaDbServerVersion MariaDbVersion = new(new Version(10, 11, 0));

    public static void Configure(DbContextOptionsBuilder builder, AppOptions options)
    {
        switch (options.Driver)
        {
            case DatabaseDriver.MySql:
                builder.UseMySql(options.ConnectionString, MySqlVersion);
                break;
            case DatabaseDriver.MariaDb:
                builder.UseMySql(options.ConnectionString, MariaDbVersion);
                break;
            case DatabaseDriver.Sqlite:
                builder.UseSqlite(options.ConnectionString);
                break;
            default:
                builder.UseNpgsql(options.ConnectionString);
                break;
        }
    }

    public static DbContextOptions<OrangeDbContext> BuildOptions(AppOptions options)
    {
        var builder = new DbContextOptionsBuilder<OrangeDbContext>();
        Configure(builder, options);
        return builder.Options;
    }
}
