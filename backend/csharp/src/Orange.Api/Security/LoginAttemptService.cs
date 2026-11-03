using Microsoft.EntityFrameworkCore;
using Orange.Api.Configuration;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Security;

public interface ILoginAttemptStore
{
    Task<LoginAttemptState?> FindAsync(string key, CancellationToken cancellationToken = default);
    Task SaveAsync(LoginAttemptState state, CancellationToken cancellationToken = default);
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}

/// <summary>Login attempt counters persisted in <c>sys_login_attempt</c>; one row per "ip:" or "user:" key.</summary>
public sealed class LoginAttemptStore : ILoginAttemptStore
{
    private readonly OrangeDbContext _db;
    private readonly SqlDialect _dialect;

    public LoginAttemptStore(OrangeDbContext db, SqlDialect dialect)
    {
        _db = db;
        _dialect = dialect;
    }

    public async Task<LoginAttemptState?> FindAsync(string key, CancellationToken cancellationToken = default)
    {
        var row = await _db.LoginAttempts.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Key == key, cancellationToken);
        return row is null
            ? null
            : new LoginAttemptState(
                row.Key, row.Failures, row.WindowStart, row.LockedUntil, row.UpdateTime);
    }

    public async Task SaveAsync(LoginAttemptState state, CancellationToken cancellationToken = default)
    {
        if (_dialect.IsPostgres)
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                 insert into sys_login_attempt (attempt_key, failures, window_start, locked_until, update_time)
                 values ({state.Key}, {state.Failures}, {state.WindowStart}, {state.LockedUntil}, {state.UpdateTime})
                 on conflict (attempt_key) do update set
                     failures = excluded.failures,
                     window_start = excluded.window_start,
                     locked_until = excluded.locked_until,
                     update_time = excluded.update_time
                 """, cancellationToken);
            return;
        }

        // MySQL/MariaDB have no ON CONFLICT; SQLite accepts the PostgreSQL form.
        var windowStart = _dialect.ToDbTimestamp(state.WindowStart);
        var lockedUntil = _dialect.ToDbTimestamp(state.LockedUntil);
        var updateTime = _dialect.ToDbTimestamp(state.UpdateTime);

        if (_dialect.IsMySql)
        {
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                 insert into sys_login_attempt (attempt_key, failures, window_start, locked_until, update_time)
                 values ({state.Key}, {state.Failures}, {windowStart}, {lockedUntil}, {updateTime})
                 on duplicate key update
                     failures = values(failures),
                     window_start = values(window_start),
                     locked_until = values(locked_until),
                     update_time = values(update_time)
                 """, cancellationToken);
            return;
        }

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"""
             insert into sys_login_attempt (attempt_key, failures, window_start, locked_until, update_time)
             values ({state.Key}, {state.Failures}, {windowStart}, {lockedUntil}, {updateTime})
             on conflict (attempt_key) do update set
                 failures = excluded.failures,
                 window_start = excluded.window_start,
                 locked_until = excluded.locked_until,
                 update_time = excluded.update_time
             """, cancellationToken);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        => _db.Database.ExecuteSqlInterpolatedAsync(
            $"delete from sys_login_attempt where attempt_key = {key}", cancellationToken);
}

/// <summary>
/// 5 failures per user, 20 per IP, 15-minute window and lock.
/// The transition rules live in LoginAttemptTracker so they are unit-testable.
/// </summary>
public sealed class LoginAttemptService
{
    private readonly ILoginAttemptStore _store;
    private readonly int _userMaxAttempts;
    private readonly int _ipMaxAttempts;
    private readonly int _lockMinutes;

    public LoginAttemptService(ILoginAttemptStore store, AppOptions options)
    {
        _store = store;
        _userMaxAttempts = options.LoginMaxAttempts;
        _ipMaxAttempts = options.LoginIpMaxAttempts;
        _lockMinutes = options.LoginLockMinutes;
    }

    public async Task<bool> IsBlockedAsync(string? ip, string? username, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var ipState = await _store.FindAsync(LoginAttemptTracker.IpKey(ip), cancellationToken);
        if (LoginAttemptTracker.IsBlocked(ipState, now))
        {
            return true;
        }
        var userState = await _store.FindAsync(LoginAttemptTracker.UserKey(username), cancellationToken);
        return LoginAttemptTracker.IsBlocked(userState, now);
    }

    public async Task OnFailureAsync(string? ip, string? username, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        await RecordAsync(LoginAttemptTracker.IpKey(ip), _ipMaxAttempts, now, cancellationToken);
        await RecordAsync(LoginAttemptTracker.UserKey(username), _userMaxAttempts, now, cancellationToken);
    }

    public Task OnSuccessAsync(string? ip, string? username, CancellationToken cancellationToken = default)
        // Only the account counter is cleared, so a successful login cannot reset an IP counter.
        => _store.DeleteAsync(LoginAttemptTracker.UserKey(username), cancellationToken);

    public Task ClearUserAttemptsAsync(string? username, CancellationToken cancellationToken = default)
        => _store.DeleteAsync(LoginAttemptTracker.UserKey(username), cancellationToken);

    private async Task RecordAsync(string key, int maxAttempts, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var current = await _store.FindAsync(key, cancellationToken);
        var next = LoginAttemptTracker.OnFailure(current, now, maxAttempts, _lockMinutes) with { Key = key };
        await _store.SaveAsync(next, cancellationToken);
    }
}
