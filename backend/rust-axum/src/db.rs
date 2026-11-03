//! Runtime database selection.
//!
//! One process talks to exactly one engine, chosen by `DB_DRIVER` (or inferred
//! from the `DATABASE_URL` scheme). SQLite, MySQL and MariaDB share one code
//! path; PostgreSQL differs only in its placeholder and identifier syntax, so
//! the small helpers below keep the repositories free of `cfg!` noise.

use std::str::FromStr;

use sqlx::mysql::{MySqlPoolOptions, MySqlConnectOptions};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{MySqlPool, PgPool, SqlitePool};

/// SQL dialect used to build statements. MariaDB uses `MySql`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Dialect {
    Postgres,
    MySql,
    Sqlite,
}

impl Dialect {
    /// Positional placeholder for the given 1-based bind index.
    pub fn placeholder(self, index: usize) -> String {
        match self {
            Dialect::Postgres => format!("${index}"),
            _ => "?".to_string(),
        }
    }

    /// Quotes an identifier. MySQL treats double quotes as string literals.
    pub fn quote(self, ident: &str) -> String {
        match self {
            Dialect::MySql => format!("`{ident}`"),
            _ => format!("\"{ident}\""),
        }
    }

    /// Current timestamp expression, valid on PostgreSQL, MySQL/MariaDB and SQLite.
    pub fn now(self) -> &'static str {
        "CURRENT_TIMESTAMP"
    }

    /// Prefix for an insert that silently skips an existing primary key.
    pub fn insert_prefix(self) -> &'static str {
        match self {
            Dialect::MySql => "INSERT IGNORE INTO",
            _ => "INSERT INTO",
        }
    }

    /// Suffix completing [`Dialect::insert_prefix`].
    pub fn insert_suffix(self) -> &'static str {
        match self {
            Dialect::MySql => "",
            _ => " ON CONFLICT DO NOTHING",
        }
    }

    /// Case-insensitive "contains" predicate over `column`.
    pub fn contains(self, column: &str, placeholder: &str) -> String {
        match self {
            Dialect::Postgres => {
                format!("strpos(lower({column}), lower({placeholder})) > 0")
            }
            _ => format!("instr(lower({column}), lower({placeholder})) > 0"),
        }
    }

    /// Timestamp comparison. SQLite stores ISO-8601 text, so both sides are
    /// normalised through `datetime()` before comparing.
    pub fn compare(self, column: &str, op: &str, placeholder: &str) -> String {
        match self {
            Dialect::Sqlite => {
                format!("datetime({column}) {op} datetime({placeholder})")
            }
            _ => format!("{column} {op} {placeholder}"),
        }
    }
}

/// The live connection pool of the configured engine.
#[derive(Clone)]
pub enum Db {
    Postgres(PgPool),
    MySql(MySqlPool),
    Sqlite(SqlitePool),
}

impl Db {
    pub fn engine(&self) -> &'static str {
        match self {
            Db::Postgres(_) => "postgres",
            Db::MySql(_) => "mysql",
            Db::Sqlite(_) => "sqlite",
        }
    }
}

/// Resolves the driver name: `DB_DRIVER` wins, otherwise the URL scheme decides.
pub fn resolve_driver(driver: Option<&str>, url: &str) -> Result<&'static str, String> {
    if let Some(driver) = driver.map(str::trim).filter(|value| !value.is_empty()) {
        return match driver.to_ascii_lowercase().as_str() {
            "postgres" | "postgresql" => Ok("postgres"),
            "mysql" => Ok("mysql"),
            "mariadb" => Ok("mariadb"),
            "sqlite" | "sqlite3" => Ok("sqlite"),
            other => Err(format!(
                "unsupported DB_DRIVER '{other}'; expected postgres, mysql, mariadb or sqlite"
            )),
        };
    }

    let scheme = url.split(':').next().unwrap_or_default().to_ascii_lowercase();
    match scheme.as_str() {
        "postgres" | "postgresql" => Ok("postgres"),
        "mysql" => Ok("mysql"),
        "mariadb" => Ok("mariadb"),
        "sqlite" => Ok("sqlite"),
        other => Err(format!(
            "cannot infer DB_DRIVER from DATABASE_URL scheme '{other}'"
        )),
    }
}

/// Opens a pool for the resolved driver. MariaDB uses the MySQL driver.
pub async fn connect(driver: &str, url: &str) -> Result<Db, String> {
    match driver {
        "postgres" => {
            let options = PgConnectOptions::from_str(url)
                .map_err(|error| format!("invalid PostgreSQL DATABASE_URL: {error}"))?;
            PgPoolOptions::new()
                .max_connections(10)
                .connect_with(options)
                .await
                .map(Db::Postgres)
                .map_err(|error| format!("failed to connect to PostgreSQL: {error}"))
        }
        "mysql" | "mariadb" => {
            let options = MySqlConnectOptions::from_str(url)
                .map_err(|error| format!("invalid MySQL DATABASE_URL: {error}"))?;
            MySqlPoolOptions::new()
                .max_connections(10)
                .connect_with(options)
                .await
                .map(Db::MySql)
                .map_err(|error| format!("failed to connect to MySQL/MariaDB: {error}"))
        }
        "sqlite" => {
            let options = sqlite_options(url)
                .map_err(|error| format!("invalid SQLite DATABASE_URL: {error}"))?;
            SqlitePoolOptions::new()
                .max_connections(5)
                .connect_with(options)
                .await
                .map(Db::Sqlite)
                .map_err(|error| format!("failed to open SQLite database: {error}"))
        }
        other => Err(format!("unsupported driver '{other}'")),
    }
}

/// Accepts `sqlite:relative.db`, `sqlite:///abs/path.db` and a bare filename.
fn sqlite_options(url: &str) -> Result<SqliteConnectOptions, String> {
    let options = match SqliteConnectOptions::from_str(url) {
        Ok(options) => options,
        Err(_) => {
            let path = url.strip_prefix("sqlite://").or_else(|| url.strip_prefix("sqlite:"));
            match path {
                Some(path) if !path.is_empty() => SqliteConnectOptions::new().filename(path),
                _ => return Err(format!("cannot read SQLite path from '{url}'")),
            }
        }
    };
    Ok(options.foreign_keys(true))
}

/// Maps a database integrity violation onto a stable description, independent
/// of the engine-specific error code formats.
pub fn integrity_conflict(code: &str) -> bool {
    matches!(
        code,
        // PostgreSQL SQLSTATE: unique, foreign key, check
        "23505" | "23503" | "23514"
            // MySQL/MariaDB: duplicate entry, FK add/update, FK delete
            | "1062" | "1451" | "1452"
            // SQLite extended result codes: unique, primary key, foreign key, check
            | "1555" | "2067" | "787" | "275"
    )
}

/// Runtime dispatch: runs the driver-specific copy of a repository function
/// generated by the per-module `*_repository!` macro. Each module exposes the
/// same function names under `pg`, `my` and `sqlite`.
#[macro_export]
macro_rules! dispatch_db {
    ($db:expr, $f:ident ( $($arg:expr),* )) => {
        match $db {
            $crate::db::Db::Postgres(pool) => pg::$f(pool, $($arg),*).await,
            $crate::db::Db::MySql(pool) => my::$f(pool, $($arg),*).await,
            $crate::db::Db::Sqlite(pool) => sqlite::$f(pool, $($arg),*).await,
        }
    };
}
