using Orange.Api.Configuration;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Tests;

public class LoginLockoutTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 3, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void TrackerCountsFailuresAndLocksAtThreshold()
    {
        var state = LoginAttemptTracker.OnFailure(null, Now, 5, 15);
        Assert.Equal(1, state.Failures);
        Assert.Null(state.LockedUntil);
        Assert.False(LoginAttemptTracker.IsBlocked(state, Now));

        for (var i = 2; i <= 4; i++)
        {
            state = LoginAttemptTracker.OnFailure(state, Now, 5, 15);
            Assert.Equal(i, state.Failures);
            Assert.Null(state.LockedUntil);
        }

        state = LoginAttemptTracker.OnFailure(state, Now, 5, 15);
        Assert.Equal(5, state.Failures);
        Assert.Equal(Now.AddMinutes(15), state.LockedUntil);
        Assert.True(LoginAttemptTracker.IsBlocked(state, Now));
    }

    [Fact]
    public void TrackerResetsTheWindowAfterItExpires()
    {
        var old = new LoginAttemptState("user:alice", 4, Now.AddMinutes(-30), null, Now.AddMinutes(-30));
        var state = LoginAttemptTracker.OnFailure(old, Now, 5, 15);

        Assert.Equal(1, state.Failures);
        Assert.Equal(Now, state.WindowStart);
        Assert.Null(state.LockedUntil);
    }

    [Fact]
    public void LockExpiresAfterTheLockWindow()
    {
        var locked = new LoginAttemptState(
            "user:alice", 5, Now, Now.AddMinutes(15), Now);
        Assert.True(LoginAttemptTracker.IsBlocked(locked, Now));
        Assert.True(LoginAttemptTracker.IsBlocked(locked, Now.AddMinutes(14)));
        Assert.False(LoginAttemptTracker.IsBlocked(locked, Now.AddMinutes(15)));
    }

    [Fact]
    public void KeysAreTrimmedAndUsernamesAreCaseInsensitive()
    {
        Assert.Equal("ip:1.2.3.4", LoginAttemptTracker.IpKey(" 1.2.3.4 "));
        Assert.Equal("user:alice", LoginAttemptTracker.UserKey(" Alice "));
        Assert.Equal("user:", LoginAttemptTracker.UserKey(null));
    }

    [Fact]
    public async Task ServiceLocksUserAfterFiveFailuresAndIpAtTwenty()
    {
        var store = new InMemoryAttemptStore();
        var service = BuildService(store);

        for (var i = 0; i < 4; i++)
        {
            await service.OnFailureAsync("1.2.3.4", "alice");
            Assert.False(await service.IsBlockedAsync("1.2.3.4", "alice"));
        }

        await service.OnFailureAsync("1.2.3.4", "alice");
        Assert.True(await service.IsBlockedAsync("1.2.3.4", "alice"));
        Assert.True(await service.IsBlockedAsync("9.9.9.9", "alice"));

        // A different account on the same IP is not blocked yet (4 IP failures only).
        Assert.False(await service.IsBlockedAsync("1.2.3.4", "bob"));

        for (var i = 0; i < 20; i++)
        {
            await service.OnFailureAsync("5.6.7.8", "carol");
        }
        Assert.True(await service.IsBlockedAsync("5.6.7.8", "nobody"));
        Assert.False(await service.IsBlockedAsync("1.2.3.4", "bob"));
    }

    [Fact]
    public async Task SuccessfulLoginClearsOnlyTheUserCounter()
    {
        var store = new InMemoryAttemptStore();
        var service = BuildService(store);
        await service.OnFailureAsync("1.2.3.4", "alice");

        await service.OnSuccessAsync("1.2.3.4", "alice");

        Assert.Null(await store.FindAsync(LoginAttemptTracker.UserKey("alice")));
        Assert.NotNull(await store.FindAsync(LoginAttemptTracker.IpKey("1.2.3.4")));
    }

    private static LoginAttemptService BuildService(ILoginAttemptStore store)
        => new(store, new AppOptions
        {
            DatabaseHost = "localhost",
            DatabasePort = 5432,
            DatabaseName = "orange",
            DatabaseUser = "postgres",
            DatabasePassword = "postgres",
            JwtSecret = "test-secret-0123456789",
            CorsOrigins = new[] { "http://localhost:5173" },
            Port = 8082,
            LoginMaxAttempts = 5,
            LoginIpMaxAttempts = 20,
            LoginLockMinutes = 15
        });

    private sealed class InMemoryAttemptStore : ILoginAttemptStore
    {
        private readonly Dictionary<string, LoginAttemptState> _states = new(StringComparer.Ordinal);

        public Task<LoginAttemptState?> FindAsync(string key, CancellationToken cancellationToken = default)
            => Task.FromResult(_states.GetValueOrDefault(key));

        public Task SaveAsync(LoginAttemptState state, CancellationToken cancellationToken = default)
        {
            _states[state.Key] = state;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        {
            _states.Remove(key);
            return Task.CompletedTask;
        }
    }
}
