package domain

import (
	"testing"
	"time"
)

func TestLockoutPolicyLocksAfterThreshold(t *testing.T) {
	policy := NewLockoutPolicy(5, 15*time.Minute, 15*time.Minute)
	now := time.Date(2026, 11, 3, 8, 0, 0, 0, time.UTC)

	var state *LockoutState
	for attempt := 1; attempt <= 4; attempt++ {
		next := policy.OnFailure(state, now)
		if next.Failures != attempt {
			t.Fatalf("attempt %d failures = %d", attempt, next.Failures)
		}
		if policy.IsLocked(&next, now) {
			t.Fatalf("attempt %d should not lock yet", attempt)
		}
		state = &next
	}

	locked := policy.OnFailure(state, now)
	if locked.Failures != 5 {
		t.Fatalf("failures = %d, want 5", locked.Failures)
	}
	if !policy.IsLocked(&locked, now) {
		t.Fatal("expected locked after 5 failures")
	}
	if locked.LockedUntil == nil || !locked.LockedUntil.Equal(now.Add(15*time.Minute)) {
		t.Fatalf("lockedUntil = %v", locked.LockedUntil)
	}
	if policy.IsLocked(&locked, now.Add(15*time.Minute)) {
		t.Fatal("lock must expire at lockedUntil")
	}
}

func TestLockoutPolicyRestartsAfterWindow(t *testing.T) {
	policy := NewLockoutPolicy(5, 15*time.Minute, 15*time.Minute)
	start := time.Date(2026, 11, 3, 8, 0, 0, 0, time.UTC)
	state := policy.OnFailure(nil, start)
	state = policy.OnFailure(&state, start.Add(time.Minute))
	if state.Failures != 2 {
		t.Fatalf("failures = %d, want 2", state.Failures)
	}

	afterWindow := start.Add(16 * time.Minute)
	restarted := policy.OnFailure(&state, afterWindow)
	if restarted.Failures != 1 {
		t.Fatalf("failures after window = %d, want 1", restarted.Failures)
	}
	if !restarted.WindowStart.Equal(afterWindow) {
		t.Fatalf("windowStart = %v, want %v", restarted.WindowStart, afterWindow)
	}
	if restarted.LockedUntil != nil {
		t.Fatal("new window must clear lock")
	}
}

func TestLockoutPolicySingleAttempt(t *testing.T) {
	policy := NewLockoutPolicy(1, 15*time.Minute, 15*time.Minute)
	now := time.Now()
	state := policy.OnFailure(nil, now)
	if !policy.IsLocked(&state, now) {
		t.Fatal("maxAttempts=1 must lock immediately")
	}
}

func TestIPLockoutUsesItsOwnThreshold(t *testing.T) {
	ipPolicy := NewLockoutPolicy(20, 15*time.Minute, 15*time.Minute)
	userPolicy := NewLockoutPolicy(5, 15*time.Minute, 15*time.Minute)
	now := time.Now()

	ipState := ipPolicy.OnFailure(nil, now)
	userState := userPolicy.OnFailure(nil, now)
	for i := 0; i < 4; i++ {
		ipState = ipPolicy.OnFailure(&ipState, now)
		userState = userPolicy.OnFailure(&userState, now)
	}
	if userPolicy.IsLocked(&userState, now) != true {
		t.Fatal("user key must lock at 5")
	}
	if ipPolicy.IsLocked(&ipState, now) {
		t.Fatal("ip key must not lock before 20")
	}
}
