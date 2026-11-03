namespace Orange.Api.Domain;

/// <summary>The persisted counter state, without any database dependency.</summary>
public sealed record LoginAttemptState(
    string Key,
    int Failures,
    DateTimeOffset WindowStart,
    DateTimeOffset? LockedUntil,
    DateTimeOffset UpdateTime);

/// <summary>
/// Pure login-lockout transitions. Thresholds are per user and per IP; both share the
/// same window and lock duration. Persistence lives in LoginAttemptService.
/// </summary>
public static class LoginAttemptTracker
{
    public const string IpPrefix = "ip:";
    public const string UserPrefix = "user:";

    public static string IpKey(string? ip) => IpPrefix + (ip ?? "").Trim();

    public static string UserKey(string? username) => UserPrefix + (username ?? "").Trim().ToLowerInvariant();

    public static bool IsBlocked(LoginAttemptState? state, DateTimeOffset now)
        => state?.LockedUntil is { } lockedUntil && lockedUntil > now;

    public static LoginAttemptState OnFailure(
        LoginAttemptState? current,
        DateTimeOffset now,
        int maxAttempts,
        int lockMinutes)
    {
        var lockFor = TimeSpan.FromMinutes(lockMinutes);
        if (current is null)
        {
            return new LoginAttemptState(
                Key: "",
                Failures: 1,
                WindowStart: now,
                LockedUntil: maxAttempts <= 1 ? now + lockFor : null,
                UpdateTime: now);
        }

        var resetsWindow = current.WindowStart == default
            || current.WindowStart + lockFor < now;
        var failures = resetsWindow ? 1 : current.Failures + 1;
        var windowStart = resetsWindow ? now : current.WindowStart;
        DateTimeOffset? lockedUntil = resetsWindow ? null : current.LockedUntil;
        if (failures >= maxAttempts)
        {
            lockedUntil = now + lockFor;
        }
        return current with
        {
            Failures = failures,
            WindowStart = windowStart,
            LockedUntil = lockedUntil,
            UpdateTime = now
        };
    }
}
