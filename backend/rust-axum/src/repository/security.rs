//! Token revocation and login-attempt persistence.
//!
//! `FOR UPDATE` exists on PostgreSQL and MySQL but not SQLite; SQLite
//! serialises writers itself, so the clause is omitted there. Upserts use
//! `ON CONFLICT` on PostgreSQL/SQLite and `ON DUPLICATE KEY UPDATE` on
//! MySQL/MariaDB.

use chrono::{DateTime, Utc};

use crate::auth::lockout::{self, AttemptState};
use crate::db::{Db, Dialect};
use crate::dispatch_db;
use crate::domain::entities::LoginAttemptRow;

macro_rules! security_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;

            const D: Dialect = $dialect;

            pub async fn is_revoked(pool: &$pool, jti: &str) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_revoked_token WHERE jti = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(jti).fetch_one(pool).await?;
                Ok(count > 0)
            }

            /// Inserts a revocation marker. Returns `false` when the jti was
            /// already revoked, which is how refresh-token replay is detected.
            pub async fn revoke(
                pool: &$pool,
                jti: &str,
                token_type: &str,
                expires_at: DateTime<Utc>,
            ) -> Result<bool, sqlx::Error> {
                let cleanup = format!(
                    "DELETE FROM sys_revoked_token WHERE expires_at < {}",
                    D.now()
                );
                sqlx::query(&cleanup).execute(pool).await?;

                let sql = format!(
                    "{} sys_revoked_token (jti, token_type, expires_at, create_time) \
                     VALUES ({}, {}, {}, {}){}",
                    D.insert_prefix(),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.now(),
                    D.insert_suffix()
                );
                let result = sqlx::query(&sql)
                    .bind(jti)
                    .bind(token_type)
                    .bind(expires_at)
                    .execute(pool)
                    .await?;
                Ok(result.rows_affected() > 0)
            }

            pub async fn record_failure(
                pool: &$pool,
                key: &str,
                max_attempts: i32,
                lock_minutes: i64,
            ) -> Result<(), sqlx::Error> {
                let now = Utc::now();
                let mut tx = pool.begin().await?;

                let lock_clause = if D == Dialect::Sqlite { "" } else { " FOR UPDATE" };
                let select = format!(
                    "SELECT attempt_key, failures, window_start, locked_until \
                     FROM sys_login_attempt WHERE attempt_key = {}{lock_clause}",
                    D.placeholder(1)
                );
                let existing: Option<LoginAttemptRow> = sqlx::query_as(&select)
                    .bind(key)
                    .fetch_optional(&mut *tx)
                    .await?;

                let state = match existing {
                    Some(row) => {
                        AttemptState::new(row.failures, row.window_start, row.locked_until)
                    }
                    None => AttemptState::default(),
                };
                let next = lockout::record_failure(&state, now, max_attempts, lock_minutes);

                let upsert = if D == Dialect::MySql {
                    format!(
                        "INSERT INTO sys_login_attempt \
                         (attempt_key, failures, window_start, locked_until, update_time) \
                         VALUES ({}, {}, {}, {}, {}) \
                         ON DUPLICATE KEY UPDATE failures = VALUES(failures), \
                         window_start = VALUES(window_start), \
                         locked_until = VALUES(locked_until), \
                         update_time = VALUES(update_time)",
                        D.placeholder(1),
                        D.placeholder(2),
                        D.placeholder(3),
                        D.placeholder(4),
                        D.placeholder(5)
                    )
                } else {
                    format!(
                        "INSERT INTO sys_login_attempt \
                         (attempt_key, failures, window_start, locked_until, update_time) \
                         VALUES ({}, {}, {}, {}, {}) \
                         ON CONFLICT (attempt_key) DO UPDATE SET \
                         failures = excluded.failures, \
                         window_start = excluded.window_start, \
                         locked_until = excluded.locked_until, \
                         update_time = excluded.update_time",
                        D.placeholder(1),
                        D.placeholder(2),
                        D.placeholder(3),
                        D.placeholder(4),
                        D.placeholder(5)
                    )
                };
                sqlx::query(&upsert)
                    .bind(key)
                    .bind(next.failures)
                    .bind(next.window_start.clone())
                    .bind(next.locked_until.clone())
                    .bind(now)
                    .execute(&mut *tx)
                    .await?;

                tx.commit().await
            }

            pub async fn is_blocked(
                pool: &$pool,
                keys: &[String],
            ) -> Result<bool, sqlx::Error> {
                let now = Utc::now();
                let sql = format!(
                    "SELECT locked_until FROM sys_login_attempt WHERE attempt_key = {}",
                    D.placeholder(1)
                );
                for key in keys {
                    let locked_until: Option<Option<DateTime<Utc>>> = sqlx::query_scalar(&sql)
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

            pub async fn clear_attempt(pool: &$pool, key: &str) -> Result<(), sqlx::Error> {
                let sql = format!(
                    "DELETE FROM sys_login_attempt WHERE attempt_key = {}",
                    D.placeholder(1)
                );
                sqlx::query(&sql).bind(key).execute(pool).await?;
                Ok(())
            }

            pub async fn delete_expired(pool: &$pool) -> Result<u64, sqlx::Error> {
                let sql = format!(
                    "DELETE FROM sys_revoked_token WHERE expires_at < {}",
                    D.now()
                );
                let result = sqlx::query(&sql).execute(pool).await?;
                Ok(result.rows_affected())
            }
        }
    };
}

security_repository!(pg, sqlx::PgPool, Dialect::Postgres);
security_repository!(my, sqlx::MySqlPool, Dialect::MySql);
security_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn is_revoked(db: &Db, jti: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, is_revoked(jti))
}

pub async fn revoke(
    db: &Db,
    jti: &str,
    token_type: &str,
    expires_at: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, revoke(jti, token_type, expires_at))
}

pub async fn record_failure(
    db: &Db,
    key: &str,
    max_attempts: i32,
    lock_minutes: i64,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, record_failure(key, max_attempts, lock_minutes))
}

pub async fn is_blocked(db: &Db, keys: &[String]) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, is_blocked(keys))
}

pub async fn clear_attempt(db: &Db, key: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, clear_attempt(key))
}

pub async fn delete_expired(db: &Db) -> Result<u64, sqlx::Error> {
    dispatch_db!(db, delete_expired())
}
