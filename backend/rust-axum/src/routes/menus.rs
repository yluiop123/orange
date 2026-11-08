//! `/api/v1/auth/menus` handler.

use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;

use crate::domain::dto::MenuInfo;
use crate::response::ApiResponse;
use crate::service::menus as menu_service;
use crate::state::AppState;

use super::ApiResult;

#[utoipa::path(
    get,
    path = "/api/v1/auth/menus",
    tag = "menus",
    summary = "当前用户菜单树",
    description = "按 locale 返回当前用户可见的菜单树。",
    security(("bearer_auth" = [])),
    params(("locale" = Option<String>, Header, description = "语言，如 zh-CN / en-US")),
    responses(
        (status = 200, description = "菜单树", body = ApiResponse<Vec<MenuInfo>>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn tree(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Vec<MenuInfo>> {
    let locale = headers.get("locale").and_then(|value| value.to_str().ok());
    let tree = menu_service::tree(&state.db, locale).await?;
    Ok(Json(ApiResponse::ok(tree)))
}
