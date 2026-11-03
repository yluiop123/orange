//! `/api/v1/auth/menus` handler.

use axum::extract::State;
use axum::Json;

use crate::domain::dto::MenuInfo;
use crate::response::ApiResponse;
use crate::service::menus as menu_service;
use crate::state::AppState;

use super::ApiResult;

pub async fn tree(State(state): State<AppState>) -> ApiResult<Vec<MenuInfo>> {
    let tree = menu_service::tree(&state.pool).await?;
    Ok(Json(ApiResponse::ok(tree)))
}
