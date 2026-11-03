//! Token revocation and login-attempt persistence.

use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::auth::lockout::{self, AttemptState};
use crate::domain::entities::LoginAttemptRow;

pub async fn is_revoked(pool: &PgPool, jti: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_revoked_token WHERE jti = $1")
        .bind(jti)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}

/// Inserts a revocation marker. Returns `false` when the jti was already
/// revoked, which is how refresh-token replay is detected.
pub async fn revoke(
    pool: &PgPool,
    jti: &str,
    token_type: &str,
    expires_at: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    sqlx::query("DELETE FROM sys_revoked_token WHERE expires_at < now()")
        .execute(pool)
        .await?;

    let result = sqlx::query(
        r#"INSERT INTO sys_revoked_token (jti, token_type, expires_at, create_time)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (jti) DO NOTHING"#,
    )
    .bind(jti)
    .bind(token_type)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn record_failure(
    pool: &PgPool,
    key: &str,
    max_attempts: i32,
    lock_minutes: i64,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    let mut tx = pool.begin().await?;

    let existing = sqlx::query_as::<_, LoginAttemptRow>(
        r#"SELECT attempt_key, failures, window_start, locked_until
           FROM sys_login_attempt WHERE attempt_key = $1 FOR UPDATE"#,
    )
    .bind(key)
    .fetch_optional(&mut *tx)
    .await?;

    let state = match existing {
        Some(row) => AttemptState::new(row.failures, row.window_start, row.locked_until),
        None => AttemptState::default(),
    };
    let next = lockout::record_failure(&state, now, max_attempts, lock_minutes);

    sqlx::query(
        r#"INSERT INTO sys_login_attempt (attempt_key, failures, window_start, locked_until, update_time)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (attempt_key) DO UPDATE SET
               failures = EXCLUDED.failures,
               window_start = EXCLUDED.window_start,
               locked_until = EXCLUDED.locked_until,
               update_time = EXCLUDED.update_time"#,
    )
    .bind(key)
    .bind(next.failures)
    .bind(next.window_start.clone())
    .bind(next.locked_until.clone())
    .bind(now)
    .execute(&mut *tx)
    .await?;

    tx.commit().await
}

pub async fn is_blocked(pool: &PgPool, keys: &[String]) -> Result<bool, sqlx::Error> {
    let now = Utc::now();
    for key in keys {
        let locked_until: Option<Option<DateTime<Utc>>> = sqlx::query_scalar(
            "SELECT locked_until FROM sys_login_attempt WHERE attempt_key = $1",
        )
        .bind(key)
        .fetch_optional(pool)
        .await?;
        if let Some(Some(until)) = locked_until {
            if until > now {
                return Ok(true);
            }
        }
    }
    Ok(false)
}

pub async fn clear_attempt(pool: &PgPool, key: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sys_login_attempt WHERE attempt_key = $1")
        .bind(key)
        .execute(pool)
        .await?;
    Ok(())
}
