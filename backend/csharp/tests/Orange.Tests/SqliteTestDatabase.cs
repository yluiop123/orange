using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Orange.Api.Data;

namespace Orange.Tests;

/// <summary>
/// A disposable SQLite in-memory database with the real EF Core model, so
/// service tests exercise the actual mappings and queries.
/// </summary>
internal sealed class SqliteTestDatabase : IAsyncDisposable
{
    private readonly SqliteConnection _connection;

    private SqliteTestDatabase(SqliteConnection connection, OrangeDbContext db)
    {
        _connection = connection;
        Db = db;
    }

    public OrangeDbContext Db { get; }

    public static async Task<SqliteTestDatabase> CreateAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeDbContext>()
            .UseSqlite(connection)
            .Options;
        var db = new OrangeDbContext(options);
        await db.Database.EnsureCreatedAsync();
        return new SqliteTestDatabase(connection, db);
    }

    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
