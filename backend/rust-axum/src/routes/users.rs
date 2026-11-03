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

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<UserListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<PageData<UserBean>> {
    require(&auth, "menu#/system/user")?;
    let query = parse_query(params)?;
    let page = user_service::list(&state.pool, &query).await?;
    Ok(Json(ApiResponse::ok(page)))
}

pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> ApiResult<UserBean> {
    require(&auth, "menu#/system/user")?;
    let user = user_service::get(&state.pool, &user_id).await?;
    Ok(Json(ApiResponse::ok(user)))
}

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddUserReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:add")?;
    let req = parse_json(payload)?;
    let temp_password = user_service::create(&state.pool, &auth, &req).await?;
    Ok(Json(ApiResponse::message("操作成功", temp_password)))
}

pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
    payload: Result<Json<EditUserReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:edit")?;
    let req = parse_json(payload)?;
    user_service::edit(&state.pool, &auth, &user_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn update_status(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
    payload: Result<Json<StatusReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:edit")?;
    let status = status_from_body(parse_json(payload)?)?;
    user_service::edit_status(&state.pool, &auth, &user_id, &status).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn reset_password(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> Result<Response, crate::error::AppError> {
    require(&auth, "action#/system/user:edit")?;
    let temp_password = user_service::reset_password(&state.pool, &auth, &user_id).await?;
    let mut response =
        Json(ApiResponse::message("操作成功", temp_password)).into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(user_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:delete")?;
    user_service::delete(&state.pool, &auth, &[user_id]).await?;
    Ok(Json(ApiResponse::ok_text("删除成功")))
}

pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/user:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    user_service::delete(&state.pool, &auth, &ids).await?;
    Ok(Json(ApiResponse::ok_text("删除成功")))
}
