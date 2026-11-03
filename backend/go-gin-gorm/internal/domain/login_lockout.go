package domain

import "time"

// LockoutState mirrors one sys_login_attempt row.
type LockoutState struct {
	Failures    int
	WindowStart time.Time
	LockedUntil *time.Time
}

// LockoutPolicy is the pure login rate-limit rule set: N failures inside a
// rolling window lock the key for LockFor. Persistence is the store's job, so
// this logic is easy to unit test.
type LockoutPolicy struct {
	MaxAttempts int
	Window      time.Duration
	LockFor     time.Duration
}

func NewLockoutPolicy(maxAttempts int, window, lockFor time.Duration) LockoutPolicy {
	return LockoutPolicy{MaxAttempts: maxAttempts, Window: window, LockFor: lockFor}
}

func (p LockoutPolicy) IsLocked(state *LockoutState, now time.Time) bool {
	if state == nil || state.LockedUntil == nil {
		return false
	}
	return state.LockedUntil.After(now)
}

// OnFailure returns the state after one failed login attempt. A window that
// has elapsed restarts at one failure; reaching the threshold locks the key.
func (p LockoutPolicy) OnFailure(state *LockoutState, now time.Time) LockoutState {
	result := LockoutState{}
	if state != nil {
		result = *state
	}
	if state == nil || state.WindowStart.IsZero() || state.WindowStart.Add(p.Window).Before(now) {
		result.Failures = 1
		result.WindowStart = now
		result.LockedUntil = nil
	} else {
		result.Failures++
	}
	if result.Failures >= p.MaxAttempts {
		until := now.Add(p.LockFor)
		result.LockedUntil = &until
	}
	return result
}
