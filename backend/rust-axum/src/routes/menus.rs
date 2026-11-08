//! `/api/v1/auth/menus` handler.

use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;

use crate::domain::dto::MenuInfo;
use crate::response::ApiResponse;
use crate::service::menus as menu_service;
use crate::state::AppState;

use super::ApiResult;

pub async fn tree(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> ApiResult<Vec<MenuInfo>> {
    let locale = headers.get("locale").and_then(|value| value.to_str().ok());
    let tree = menu_service::tree(&state.db, locale).await?;
    Ok(Json(ApiResponse::ok(tree)))
}
