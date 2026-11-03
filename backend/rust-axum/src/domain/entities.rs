//! Database row types. Column names match `database/postgres/ddl.sql`.

use chrono::{DateTime, Utc};

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub token_version: i32,
    pub must_change_password: bool,
    pub password: Option<String>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, PartialEq, Eq, sqlx::FromRow)]
pub struct Group {
    pub id: String,
    pub name: Option<String>,
    pub status: String,
    pub parent_id: Option<String>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, PartialEq, Eq, sqlx::FromRow)]
pub struct Permission {
    pub id: String,
    pub name: Option<String>,
    pub path: String,
    pub action: Option<String>,
    pub kind: String,
    pub status: String,
    pub parent_id: Option<String>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, PartialEq, Eq, sqlx::FromRow)]
pub struct Role {
    pub id: String,
    pub name: Option<String>,
    pub status: String,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct LoginAttemptRow {
    pub attempt_key: String,
    pub failures: i32,
    pub window_start: DateTime<Utc>,
    pub locked_until: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OperationLogRow {
    pub id: i64,
    pub trace_id: Option<String>,
    pub username: Option<String>,
    pub method: String,
    pub path: String,
    pub query_string: Option<String>,
    pub request_body: Option<String>,
    pub status: i32,
    pub duration_ms: i64,
    pub ip: Option<String>,
    pub create_time: DateTime<Utc>,
}
