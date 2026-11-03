import { ipKey, isLocked, nextAttemptState, userKey } from './login-attempt.policy';

const NOW = new Date('2026-11-03T10:00:00.000Z');
const LOCK_MINUTES = 15;

describe('login lockout', () => {
  it('normalizes keys the same way as the reference', () => {
    expect(ipKey(' 203.0.113.5 ')).toBe('ip:203.0.113.5');
    expect(ipKey(null)).toBe('ip:');
    expect(userKey(' Alice ')).toBe('user:alice');
    expect(userKey(null)).toBe('user:');
  });

  it('counts the first failure and opens a window without locking', () => {
    const state = nextAttemptState(null, NOW, 5, LOCK_MINUTES);

    expect(state.failures).toBe(1);
    expect(state.windowStart).toEqual(NOW);
    expect(state.lockedUntil).toBeNull();
    expect(state.updateTime).toEqual(NOW);
  });

  it('accumulates failures inside the window', () => {
    const state = nextAttemptState(
      { failures: 3, windowStart: new Date(NOW.getTime() - 60_000), lockedUntil: null },
      NOW,
      5,
      LOCK_MINUTES,
    );

    expect(state.failures).toBe(4);
    expect(state.lockedUntil).toBeNull();
  });

  it('locks the user on the fifth failure for fifteen minutes', () => {
    const state = nextAttemptState(
      { failures: 4, windowStart: new Date(NOW.getTime() - 60_000), lockedUntil: null },
      NOW,
      5,
      LOCK_MINUTES,
    );

    expect(state.failures).toBe(5);
    expect(state.lockedUntil).toEqual(new Date(NOW.getTime() + 15 * 60_000));
  });

  it('locks the IP only at the higher IP threshold', () => {
    const belowIpThreshold = nextAttemptState(
      { failures: 5, windowStart: new Date(NOW.getTime() - 60_000), lockedUntil: null },
      NOW,
      20,
      LOCK_MINUTES,
    );
    expect(belowIpThreshold.failures).toBe(6);
    expect(belowIpThreshold.lockedUntil).toBeNull();

    const atIpThreshold = nextAttemptState(
      { failures: 19, windowStart: new Date(NOW.getTime() - 60_000), lockedUntil: null },
      NOW,
      20,
      LOCK_MINUTES,
    );
    expect(atIpThreshold.failures).toBe(20);
    expect(atIpThreshold.lockedUntil).toEqual(new Date(NOW.getTime() + 15 * 60_000));
  });

  it('resets the counter and lock after the window expires', () => {
    const state = nextAttemptState(
      {
        failures: 5,
        windowStart: new Date(NOW.getTime() - 16 * 60_000),
        lockedUntil: new Date(NOW.getTime() - 60_000),
      },
      NOW,
      5,
      LOCK_MINUTES,
    );

    expect(state.failures).toBe(1);
    expect(state.windowStart).toEqual(NOW);
    expect(state.lockedUntil).toBeNull();
  });

  it('locks immediately when the threshold is one', () => {
    const state = nextAttemptState(null, NOW, 1, LOCK_MINUTES);
    expect(state.failures).toBe(1);
    expect(state.lockedUntil).toEqual(new Date(NOW.getTime() + 15 * 60_000));
  });

  it('reports a lock only until its expiry', () => {
    expect(isLocked(new Date(NOW.getTime() + 1_000), NOW)).toBe(true);
    expect(isLocked(new Date(NOW.getTime() - 1_000), NOW)).toBe(false);
    expect(isLocked(null, NOW)).toBe(false);
  });
});
