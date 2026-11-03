//! Operation log read/write.

use chrono::{DateTime, Duration, Utc};

use crate::db::{Db, Dialect};
use crate::dispatch_db;
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

const COLUMNS: &str =
    "id, trace_id, username, method, path, query_string, request_body, status, \
     duration_ms, ip, create_time";

macro_rules! operation_logs_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;

            const D: Dialect = $dialect;

            pub async fn insert(
                pool: &$pool,
                log: &NewOperationLog,
            ) -> Result<(), sqlx::Error> {
                let sql = format!(
                    "INSERT INTO sys_operation_log \
                     (trace_id, username, method, path, query_string, request_body, \
                     status, duration_ms, ip, create_time) \
                     VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {}, {})",
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.placeholder(4),
                    D.placeholder(5),
                    D.placeholder(6),
                    D.placeholder(7),
                    D.placeholder(8),
                    D.placeholder(9),
                    D.now()
                );
                sqlx::query(&sql)
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
                pool: &$pool,
                params: &OperationLogListParams,
            ) -> Result<(i64, Vec<OperationLogRow>), sqlx::Error> {
                let mut clause = String::new();
                let mut string_binds: Vec<String> = Vec::new();
                let mut timestamp_binds: Vec<DateTime<Utc>> = Vec::new();

                if let Some(username) = &params.username {
                    let placeholder = D.placeholder(string_binds.len() + 1);
                    clause.push_str(&format!(
                        " AND {}",
                        D.contains("username", &placeholder)
                    ));
                    string_binds.push(username.clone());
                }
                if let Some(path) = &params.path {
                    let placeholder = D.placeholder(string_binds.len() + 1);
                    clause.push_str(&format!(" AND {}", D.contains("path", &placeholder)));
                    string_binds.push(path.clone());
                }

                let mut numeric_binds: Vec<i32> = Vec::new();
                if let Some(status) = params.status {
                    let index = string_binds.len() + numeric_binds.len() + 1;
                    clause.push_str(&format!(" AND status = {}", D.placeholder(index)));
                    numeric_binds.push(status);
                }

                let mut filter_index = string_binds.len() + numeric_binds.len();
                if let Some(from) = params.from {
                    filter_index += 1;
                    let placeholder = D.placeholder(filter_index);
                    clause.push_str(&format!(
                        " AND {}",
                        D.compare("create_time", ">=", &placeholder)
                    ));
                    timestamp_binds.push(from);
                }
                if let Some(to) = params.to {
                    filter_index += 1;
                    let placeholder = D.placeholder(filter_index);
                    clause.push_str(&format!(
                        " AND {}",
                        D.compare("create_time", "<=", &placeholder)
                    ));
                    timestamp_binds.push(to);
                }

                let where_clause = if clause.is_empty() {
                    String::new()
                } else {
                    format!(" WHERE 1 = 1{clause}")
                };

                let count_sql = format!("SELECT count(*) FROM sys_operation_log{where_clause}");
                let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
                for value in &string_binds {
                    count_query = count_query.bind(value.clone());
                }
                for value in &numeric_binds {
                    count_query = count_query.bind(*value);
                }
                for value in &timestamp_binds {
                    count_query = count_query.bind(*value);
                }
                let total: i64 = count_query.fetch_one(pool).await?;

                let limit_ph = D.placeholder(filter_index + 1);
                let offset_ph = D.placeholder(filter_index + 2);
                let list_sql = format!(
                    "SELECT {COLUMNS} FROM sys_operation_log{where_clause} \
                     ORDER BY id DESC LIMIT {limit_ph} OFFSET {offset_ph}"
                );
                let mut list_query = sqlx::query_as::<_, OperationLogRow>(&list_sql);
                for value in string_binds {
                    list_query = list_query.bind(value);
                }
                for value in numeric_binds {
                    list_query = list_query.bind(value);
                }
                for value in timestamp_binds {
                    list_query = list_query.bind(value);
                }
                let rows = list_query
                    .bind(params.limit)
                    .bind(params.offset)
                    .fetch_all(pool)
                    .await?;

                Ok((total, rows))
            }

            pub async fn delete_older_than_days(
                pool: &$pool,
                days: i64,
            ) -> Result<u64, sqlx::Error> {
                let cutoff = Utc::now() - Duration::days(days.max(0));
                let placeholder = D.placeholder(1);
                let sql = format!(
                    "DELETE FROM sys_operation_log WHERE {}",
                    D.compare("create_time", "<", &placeholder)
                );
                let result = sqlx::query(&sql).bind(cutoff).execute(pool).await?;
                Ok(result.rows_affected())
            }
        }
    };
}

operation_logs_repository!(pg, sqlx::PgPool, Dialect::Postgres);
operation_logs_repository!(my, sqlx::MySqlPool, Dialect::MySql);
operation_logs_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn insert(db: &Db, log: &NewOperationLog) -> Result<(), sqlx::Error> {
    dispatch_db!(db, insert(log))
}

pub async fn list(
    db: &Db,
    params: &OperationLogListParams,
) -> Result<(i64, Vec<OperationLogRow>), sqlx::Error> {
    dispatch_db!(db, list(params))
}

pub async fn delete_older_than_days(db: &Db, days: i64) -> Result<u64, sqlx::Error> {
    dispatch_db!(db, delete_older_than_days(days))
}
