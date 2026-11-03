//! Operation log query validation and mapping.

use sqlx::PgPool;

use crate::domain::dto::{OperationLogBean, OperationLogQuery, PageData};
use crate::domain::validate::{parse_page, parse_size};
use crate::error::AppError;
use crate::repository::operation_logs;

fn parse_time(value: Option<&str>, label: &str) -> Result<Option<chrono::DateTime<chrono::Utc>>, AppError> {
    match value.map(str::trim).filter(|value| !value.is_empty()) {
        Some(raw) => chrono::DateTime::parse_from_rfc3339(raw)
            .map(|value| Some(value.with_timezone(&chrono::Utc)))
            .map_err(|_| AppError::param(format!("{label}时间格式不正确"))),
        None => Ok(None),
    }
}

fn parse_status(value: Option<&str>) -> Result<Option<i32>, AppError> {
    match value.map(str::trim).filter(|value| !value.is_empty()) {
        None => Ok(None),
        Some(raw) => {
            if raw.chars().count() == 3 && raw.chars().all(|ch| ch.is_ascii_digit()) {
                raw.parse::<i32>()
                    .map(Some)
                    .map_err(|_| AppError::param("状态码必须是 3 位数字"))
            } else {
                Err(AppError::param("状态码必须是 3 位数字"))
            }
        }
    }
}

pub async fn list(
    pool: &PgPool,
    query: &OperationLogQuery,
) -> Result<PageData<OperationLogBean>, AppError> {
    let page = parse_page(query.page, 1, i32::MAX)?;
    let size = parse_size(query.size, 10, 100)?;
    let status = parse_status(query.status.as_deref())?;
    let from = parse_time(query.from.as_deref(), "开始")?;
    let to = parse_time(query.to.as_deref(), "结束")?;

    let (total, rows) = operation_logs::list(
        pool,
        &operation_logs::OperationLogListParams {
            username: query
                .username
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            path: query
                .path
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string),
            status,
            from,
            to,
            limit: i64::from(size),
            offset: i64::from(page - 1) * i64::from(size),
        },
    )
    .await?;

    let list = rows
        .into_iter()
        .map(|row| OperationLogBean {
            id: row.id,
            trace_id: row.trace_id,
            username: row.username,
            method: row.method,
            path: row.path,
            query_string: row.query_string,
            request_body: row.request_body,
            status: row.status,
            duration_ms: row.duration_ms,
            ip: row.ip,
            create_time: row.create_time,
        })
        .collect();

    Ok(PageData::new(total, list, page, size))
}
