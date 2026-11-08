//! `/api/v1/system/operation-logs` handler.

use axum::extract::rejection::QueryRejection;
use axum::extract::{Query, State};
use axum::Extension;
use axum::Json;

use crate::auth::AuthUser;
use crate::domain::dto::{OperationLogBean, OperationLogQuery, PageData};
use crate::response::ApiResponse;
use crate::service::operation_logs as log_service;
use crate::state::AppState;

use super::{parse_query, require, ApiResult};

#[utoipa::path(
    get,
    path = "/api/v1/system/operation-logs",
    tag = "operation-logs",
    summary = "操作日志分页列表",
    security(("bearer_auth" = [])),
    params(OperationLogQuery),
    responses(
        (status = 200, description = "操作日志分页", body = ApiResponse<PageData<OperationLogBean>>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<OperationLogQuery>, QueryRejection>,
) -> ApiResult<PageData<OperationLogBean>> {
    require(&auth, "menu#/system/operation-log")?;
    let query = parse_query(params)?;
    let page = log_service::list(&state.db, &query).await?;
    Ok(Json(ApiResponse::ok(page)))
}
