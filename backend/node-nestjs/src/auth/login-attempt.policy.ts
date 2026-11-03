/**
 * Pure login-lockout state machine. The database row is an implementation
 * detail; this function decides the next counters, window and lock.
 *
 * Rules (same as the Java reference):
 * - a failure opens a window of `lockMinutes`;
 * - failures inside the window accumulate;
 * - reaching `maxAttempts` locks the key until `now + lockMinutes`;
 * - an expired window resets the counter and clears the lock.
 */
export interface AttemptRow {
  failures: number;
  windowStart: Date | null;
  lockedUntil: Date | null;
}

export interface AttemptState {
  failures: number;
  windowStart: Date;
  lockedUntil: Date | null;
  updateTime: Date;
}

export const IP_PREFIX = 'ip:';
export const USER_PREFIX = 'user:';

export function ipKey(ip: string | null | undefined): string {
  return `${IP_PREFIX}${(ip ?? '').trim()}`;
}

export function userKey(username: string | null | undefined): string {
  return `${USER_PREFIX}${(username ?? '').trim().toLowerCase()}`;
}

export function nextAttemptState(
  existing: AttemptRow | null | undefined,
  now: Date,
  maxAttempts: number,
  lockMinutes: number,
): AttemptState {
  const lockMs = lockMinutes * 60_000;

  if (!existing) {
    return {
      failures: 1,
      windowStart: now,
      lockedUntil: maxAttempts <= 1 ? new Date(now.getTime() + lockMs) : null,
      updateTime: now,
    };
  }

  const windowExpired =
    !existing.windowStart || existing.windowStart.getTime() + lockMs < now.getTime();

  let failures: number;
  let windowStart: Date;
  let lockedUntil: Date | null;

  if (windowExpired) {
    failures = 1;
    windowStart = now;
    lockedUntil = null;
  } else {
    failures = (existing.failures ?? 0) + 1;
    windowStart = existing.windowStart as Date;
    lockedUntil = existing.lockedUntil ?? null;
  }

  if (failures >= maxAttempts) {
    lockedUntil = new Date(now.getTime() + lockMs);
  }

  return { failures, windowStart, lockedUntil, updateTime: now };
}

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()): boolean {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime();
}
