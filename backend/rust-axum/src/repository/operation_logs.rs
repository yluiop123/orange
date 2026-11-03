//! Operation log read/write.

use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::domain::entities::OperationLogRow;

#[derive(Debug, Clone)]
pub struct NewOperationLog {
    pub trace_id: Option<String>,
    pub username: Option<String>,
    pub method: String,
    pub path: String,
    pub query_string: Option<String>,
    pub request_body: Option<String>,
    pub status: i32,
    pub duration_ms: i64,
    pub ip: Option<String>,
}

pub struct OperationLogListParams {
    pub username: Option<String>,
    pub path: Option<String>,
    pub status: Option<i32>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: i64,
    pub offset: i64,
}

const COLUMNS: &str = "id, trace_id, username, method, path, query_string, request_body, status, duration_ms, ip, create_time";

pub async fn insert(pool: &PgPool, log: &NewOperationLog) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO sys_operation_log
           (trace_id, username, method, path, query_string, request_body, status, duration_ms, ip, create_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())"#,
    )
    .bind(&log.trace_id)
    .bind(&log.username)
    .bind(&log.method)
    .bind(&log.path)
    .bind(&log.query_string)
    .bind(&log.request_body)
    .bind(log.status)
    .bind(log.duration_ms)
    .bind(&log.ip)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list(
    pool: &PgPool,
    params: &OperationLogListParams,
) -> Result<(i64, Vec<OperationLogRow>), sqlx::Error> {
    let filter = r#"WHERE ($1::text IS NULL OR strpos(lower(username), lower($1::text)) > 0)
        AND ($2::text IS NULL OR strpos(lower(path), lower($2::text)) > 0)
        AND ($3::int4 IS NULL OR status = $3::int4)
        AND ($4::timestamptz IS NULL OR create_time >= $4::timestamptz)
        AND ($5::timestamptz IS NULL OR create_time <= $5::timestamptz)"#;

    let count_sql = format!("SELECT count(*) FROM sys_operation_log {filter}");
    let total: i64 = sqlx::query_scalar(&count_sql)
        .bind(&params.username)
        .bind(&params.path)
        .bind(params.status)
        .bind(params.from.clone())
        .bind(params.to.clone())
        .fetch_one(pool)
        .await?;

    let list_sql = format!(
        "SELECT {COLUMNS} FROM sys_operation_log {filter} ORDER BY id DESC LIMIT $6 OFFSET $7"
    );
    let rows = sqlx::query_as::<_, OperationLogRow>(&list_sql)
        .bind(&params.username)
        .bind(&params.path)
        .bind(params.status)
        .bind(params.from.clone())
        .bind(params.to.clone())
        .bind(params.limit)
        .bind(params.offset)
        .fetch_all(pool)
        .await?;

    Ok((total, rows))
}

pub async fn delete_older_than_days(pool: &PgPool, days: i64) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM sys_operation_log WHERE create_time < now() - make_interval(days => $1::int)",
    )
    .bind(days)
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}
