//! Environment-driven configuration.
//!
//! Every backend in this repository reads the database connection and secrets
//! from the environment; nothing is hard-coded for production.

use std::env;
use std::str::FromStr;

const DEV_JWT_SECRET: &str = "orange-dev-secret-change-me-in-production";

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    /// `DB_DRIVER` when set; otherwise the URL scheme decides.
    pub db_driver: Option<String>,
    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub cors_origins: Vec<String>,
    pub port: u16,
    pub access_expire: i64,
    pub refresh_expire: i64,
    pub cookie_secure: bool,
    pub cookie_same_site: String,
    pub cookie_domain: Option<String>,
    pub login_max_attempts: i32,
    pub login_ip_max_attempts: i32,
    pub login_lock_minutes: i64,
    pub operation_log_retention_days: i64,
}

impl Config {
    pub fn from_env() -> Self {
        let database_url = resolve_database_url();
        let db_driver = optional_env("DB_DRIVER");

        let jwt_secret = match optional_env("JWT_SECRET") {
            Some(secret) => secret,
            None => {
                tracing::warn!(
                    "JWT_SECRET is not set; using the development default. \
                     Set JWT_SECRET before exposing this service."
                );
                DEV_JWT_SECRET.to_string()
            }
        };

        let environment = optional_env("APP_ENV")
            .unwrap_or_else(|| "local".to_string())
            .to_ascii_lowercase();
        if matches!(environment.as_str(), "production" | "prod")
            && jwt_secret == DEV_JWT_SECRET
        {
            panic!("JWT_SECRET must be set to a non-default value in production");
        }

        let jwt_issuer =
            optional_env("JWT_ISSUER").unwrap_or_else(|| "orange".to_string());

        let origins = optional_env("CORS_ORIGINS")
            .or_else(|| optional_env("CORS_ALLOWED_ORIGINS"))
            .unwrap_or_else(|| "http://localhost:5173,http://localhost:5174,http://localhost:4200".to_string());
        let cors_origins = origins
            .split(',')
            .map(str::trim)
            .filter(|origin| !origin.is_empty())
            .map(str::to_string)
            .collect();

        Self {
            database_url,
            db_driver,
            jwt_secret,
            jwt_issuer,
            cors_origins,
            port: parse_env_any(&["APP_PORT", "PORT"], 8083u16),
            access_expire: parse_env_any(&["JWT_ACCESS_EXPIRE", "ACCESS_TOKEN_EXPIRE_SECONDS"], 900i64),
            refresh_expire: parse_env_any(&["JWT_REFRESH_EXPIRE", "REFRESH_TOKEN_EXPIRE_SECONDS"], 604_800i64),
            cookie_secure: parse_env("COOKIE_SECURE", false),
            cookie_same_site: optional_env("COOKIE_SAME_SITE").unwrap_or_else(|| "Lax".to_string()),
            cookie_domain: optional_env("COOKIE_DOMAIN"),
            login_max_attempts: parse_env("LOGIN_MAX_ATTEMPTS", 5i32),
            login_ip_max_attempts: parse_env("LOGIN_IP_MAX_ATTEMPTS", 20i32),
            login_lock_minutes: parse_env("LOGIN_LOCK_MINUTES", 15i64),
            operation_log_retention_days: parse_env_any(&["LOG_RETENTION_DAYS", "OPERATION_LOG_RETENTION_DAYS"], 90i64),
        }
    }
}

fn optional_env(key: &str) -> Option<String> {
    env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

/// Builds the connection string.
///
/// `DATABASE_URL` wins. Otherwise the discrete `DB_*` variables are assembled;
/// `DB_DRIVER` defaults to `postgres`. SQLite accepts `DB_FILE` or `DB_NAME`
/// as the database file path.
fn resolve_database_url() -> String {
    if let Some(url) = optional_env("DATABASE_URL") {
        return url;
    }

    let driver = optional_env("DB_DRIVER")
        .unwrap_or_else(|| "postgres".to_string())
        .to_ascii_lowercase();
    let is_mysql = matches!(driver.as_str(), "mysql" | "mariadb");

    let host = optional_env("DB_HOST").unwrap_or_else(|| "localhost".to_string());
    let user = optional_env("DB_USER")
        .unwrap_or_else(|| if is_mysql { "root".into() } else { "postgres".into() });
    let password = optional_env("DB_PASSWORD")
        .unwrap_or_else(|| if is_mysql { "root".into() } else { "postgres".into() });
    let name = optional_env("DB_NAME").unwrap_or_else(|| "orange".to_string());
    let port = optional_env("DB_PORT")
        .unwrap_or_else(|| if is_mysql { "3306".into() } else { "5432".into() });

    if matches!(driver.as_str(), "sqlite" | "sqlite3") {
        let path = optional_env("DB_FILE").unwrap_or(name);
        return format!("sqlite:{path}");
    }

    let scheme = if is_mysql { "mysql" } else { "postgres" };
    format!("{scheme}://{user}:{password}@{host}:{port}/{name}")
}

fn parse_env<T>(key: &str, default: T) -> T
where
    T: FromStr + Copy,
{
    match optional_env(key) {
        Some(raw) => match raw.parse::<T>() {
            Ok(value) => value,
            Err(_) => {
                tracing::warn!(key, value = %raw, "invalid number in environment; using default");
                default
            }
        },
        None => default,
    }
}

fn parse_env_any<T>(keys: &[&str], default: T) -> T
where
    T: FromStr + Copy,
{
    for key in keys {
        if optional_env(key).is_some() {
            return parse_env(key, default);
        }
    }
    default
}
