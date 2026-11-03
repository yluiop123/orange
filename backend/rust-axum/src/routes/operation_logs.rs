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

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<OperationLogQuery>, QueryRejection>,
) -> ApiResult<PageData<OperationLogBean>> {
    require(&auth, "menu#/system/operation-log")?;
    let query = parse_query(params)?;
    let page = log_service::list(&state.pool, &query).await?;
    Ok(Json(ApiResponse::ok(page)))
}
