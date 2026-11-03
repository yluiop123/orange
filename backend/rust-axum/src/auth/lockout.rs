//! Login lockout arithmetic, pure and unit-tested.
//!
//! Persistence lives in `sys_login_attempt`; the rules are:
//! - `N` failures inside a 15-minute window lock the key for 15 minutes;
//! - the window restarts after it expires;
//! - a successful login only clears the account key, never the IP key.

use chrono::{DateTime, Duration, Utc};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AttemptState {
    pub failures: i32,
    pub window_start: Option<DateTime<Utc>>,
    pub locked_until: Option<DateTime<Utc>>,
}

impl AttemptState {
    pub fn new(
        failures: i32,
        window_start: DateTime<Utc>,
        locked_until: Option<DateTime<Utc>>,
    ) -> Self {
        Self {
            failures,
            window_start: Some(window_start),
            locked_until,
        }
    }
}

pub fn is_blocked(state: &AttemptState, now: DateTime<Utc>) -> bool {
    state.locked_until.map(|until| until > now).unwrap_or(false)
}

/// Computes the next persisted state after one failed attempt.
pub fn record_failure(
    state: &AttemptState,
    now: DateTime<Utc>,
    max_attempts: i32,
    lock_minutes: i64,
) -> AttemptState {
    let lock = Duration::minutes(lock_minutes);
    let window_active = state
        .window_start
        .map(|start| start + lock >= now)
        .unwrap_or(false);

    let failures = if window_active {
        state.failures.saturating_add(1)
    } else {
        1
    };
    let window_start = if window_active {
        state.window_start.unwrap_or(now)
    } else {
        now
    };
    let locked_until = if failures >= max_attempts.max(1) {
        Some(now + lock)
    } else {
        None
    };

    AttemptState {
        failures,
        window_start: Some(window_start),
        locked_until,
    }
}

/// A success removes the account key. The IP key is intentionally untouched so
/// a valid login cannot reset an attacker's per-IP budget.
pub fn record_success(_state: &AttemptState) -> AttemptState {
    AttemptState::default()
}

pub fn user_key(username: &str) -> String {
    format!("user:{}", username.trim().to_lowercase())
}

pub fn ip_key(ip: &str) -> String {
    format!("ip:{}", ip.trim())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn now() -> DateTime<Utc> {
        Utc::now()
    }

    #[test]
    fn first_failure_counts_once_and_does_not_lock() {
        let next = record_failure(&AttemptState::default(), now(), 5, 15);
        assert_eq!(next.failures, 1);
        assert!(next.locked_until.is_none());
        assert!(!is_blocked(&next, now()));
    }

    #[test]
    fn fifth_failure_locks_for_the_configured_window() {
        let start = now();
        let mut state = AttemptState::default();
        for _ in 0..5 {
            state = record_failure(&state, start, 5, 15);
        }
        assert_eq!(state.failures, 5);
        assert!(is_blocked(&state, start));
        let locked_until = state.locked_until.expect("locked");
        assert!(locked_until >= start + Duration::minutes(15));
        assert!(!is_blocked(&state, locked_until + Duration::seconds(1)));
    }

    #[test]
    fn window_expiry_restarts_the_count() {
        let start = now();
        let state = AttemptState::new(4, start, None);
        let later = start + Duration::minutes(16);
        let next = record_failure(&state, later, 5, 15);
        assert_eq!(next.failures, 1);
        assert_eq!(next.window_start, Some(later));
        assert!(next.locked_until.is_none());
    }

    #[test]
    fn failures_inside_the_window_accumulate() {
        let start = now();
        let state = AttemptState::new(3, start, None);
        let next = record_failure(&state, start + Duration::minutes(10), 5, 15);
        assert_eq!(next.failures, 4);
        assert!(next.locked_until.is_none());
        let last = record_failure(&next, start + Duration::minutes(11), 5, 15);
        assert_eq!(last.failures, 5);
        assert!(is_blocked(&last, start + Duration::minutes(11)));
    }

    #[test]
    fn max_attempts_of_one_locks_immediately() {
        let moment = now();
        let next = record_failure(&AttemptState::default(), moment, 1, 15);
        assert_eq!(next.failures, 1);
        assert!(is_blocked(&next, moment));
    }

    #[test]
    fn success_clears_the_state() {
        let cleared = record_success(&AttemptState::new(4, now(), None));
        assert_eq!(cleared, AttemptState::default());
    }

    #[test]
    fn keys_are_normalised() {
        assert_eq!(user_key("  Super "), "user:super");
        assert_eq!(ip_key(" 10.0.0.1 "), "ip:10.0.0.1");
    }
}
