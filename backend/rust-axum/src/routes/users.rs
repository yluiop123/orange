//! `/api/v1/system/users` handlers.

use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, Query, State};
use axum::http::{header, HeaderValue};
use axum::response::{IntoResponse, Response};
use axum::Extension;
use axum::Json;

use crate::auth::AuthUser;
use crate::domain::dto::{AddUserReq, EditUserReq, PageData, StatusReq, UserBean, UserListQuery};
use crate::response::ApiResponse;
use crate::service::users as user_service;
use crate::state::AppState;

use super::{
    ids_from_query, parse_json, parse_query, require, status_from_body, ApiResult, IdsQuery,
};

#[utoipa::path(
    get,
    path = "/api/v1/system/users",
    tag = "users",
    summary = "用户分页列表",
    security(("bearer_auth" = [])),
    params(UserListQuery),
    responses(
        (status = 200, description = "用户分页", body = ApiResponse<PageData<UserBean>>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<UserListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<PageData<UserBean>> {
    require(&auth, "menu#/system/user")?;
    let query = parse_query(params)?;
    let page = user_service::list(&state.db, &query).await?;
    Ok(Json(ApiResponse::ok(page)))
}

#[utoipa::path(
    get,
    path = "/api/v1/system/users/{userId}",
    tag = "users",
    summary = "用户详情",
    security(("bearer_auth" = [])),
    params(("userId" = String, Path, description = "用户 ID")),
    responses(
        (status = 200, description = "用户详情", body = ApiResponse<UserBean>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> ApiResult<UserBean> {
    require(&auth, "menu#/system/user")?;
    let user = user_service::get(&state.db, &user_id).await?;
    Ok(Json(ApiResponse::ok(user)))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/users",
    tag = "users",
    summary = "新增用户",
    description = "创建用户并返回初始临时密码。",
    security(("bearer_auth" = [])),
    request_body = AddUserReq,
    responses(
        (status = 200, description = "创建成功，data 为初始临时密码", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "用户名已存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddUserReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:add")?;
    let req = parse_json(payload)?;
    let temp_password = user_service::create(&state.db, &auth, &req).await?;
    Ok(Json(ApiResponse::message("操作成功", temp_password)))
}

#[utoipa::path(
    patch,
    path = "/api/v1/system/users/{userId}",
    tag = "users",
    summary = "修改用户",
    security(("bearer_auth" = [])),
    params(("userId" = String, Path, description = "用户 ID")),
    request_body = EditUserReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "数据冲突", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
    payload: Result<Json<EditUserReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:edit")?;
    let req = parse_json(payload)?;
    user_service::edit(&state.db, &auth, &user_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    patch,
    path = "/api/v1/system/users/{userId}/status",
    tag = "users",
    summary = "修改用户状态",
    security(("bearer_auth" = [])),
    params(("userId" = String, Path, description = "用户 ID")),
    request_body = StatusReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn update_status(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
    payload: Result<Json<StatusReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:edit")?;
    let status = status_from_body(parse_json(payload)?)?;
    user_service::edit_status(&state.db, &auth, &user_id, &status).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/users/{userId}/reset-password",
    tag = "users",
    summary = "重置用户密码",
    description = "生成新的初始临时密码并通过 `data` 返回，响应带 `Cache-Control: no-store`。",
    security(("bearer_auth" = [])),
    params(("userId" = String, Path, description = "用户 ID")),
    responses(
        (status = 200, description = "重置成功，data 为临时密码", body = ApiResponse<String>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn reset_password(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> Result<Response, crate::error::AppError> {
    require(&auth, "action#/system/user:edit")?;
    let temp_password = user_service::reset_password(&state.db, &auth, &user_id).await?;
    let mut response = Json(ApiResponse::message("操作成功", temp_password)).into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/users/{userId}",
    tag = "users",
    summary = "删除用户",
    security(("bearer_auth" = [])),
    params(("userId" = String, Path, description = "用户 ID")),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "不能删除当前用户", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:delete")?;
    user_service::delete(&state.db, &auth, &[user_id]).await?;
    Ok(Json(ApiResponse::ok_text("删除成功")))
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/users",
    tag = "users",
    summary = "批量删除用户",
    description = "以逗号分隔的 `ids` 查询参数批量删除用户。",
    security(("bearer_auth" = [])),
    params(IdsQuery),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "用户不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "不能删除当前用户", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    user_service::delete(&state.db, &auth, &ids).await?;
    Ok(Json(ApiResponse::ok_text("删除成功")))
}
