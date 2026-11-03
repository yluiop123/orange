//! `/api/v1/system/permissions` handlers.

use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, Query, State};
use axum::Extension;
use axum::Json;

use crate::auth::AuthUser;
use crate::domain::dto::{
    AddChildPermissionReq, EditPermissionReq, PermissionBean, PermissionListQuery,
};
use crate::response::ApiResponse;
use crate::service::permissions as permission_service;
use crate::state::AppState;

use super::{ids_from_query, parse_json, parse_query, require, ApiResult, IdsQuery};

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<PermissionListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<Vec<PermissionBean>> {
    require(&auth, "menu#/system/permission")?;
    let query = parse_query(params)?;
    let permissions = permission_service::list(&state.pool, &query).await?;
    Ok(Json(ApiResponse::ok(permissions)))
}

pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
) -> ApiResult<PermissionBean> {
    require(&auth, "menu#/system/permission")?;
    let permission = permission_service::get(&state.pool, &permission_id).await?;
    Ok(Json(ApiResponse::ok(permission)))
}

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddChildPermissionReq>, JsonRejection>,
) -> ApiResult<PermissionBean> {
    require(&auth, "action#/system/permission:add")?;
    let req = parse_json(payload)?;
    let permission = permission_service::create(&state.pool, &req).await?;
    Ok(Json(ApiResponse::ok(permission)))
}

pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
    payload: Result<Json<EditPermissionReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:edit")?;
    let req = parse_json(payload)?;
    permission_service::edit(&state.pool, &permission_id, &req).await?;
    Ok(Json(ApiResponse::message("操作成功", "操作成功")))
}

pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:delete")?;
    permission_service::delete(&state.pool, &[permission_id]).await?;
    Ok(Json(ApiResponse::message("操作成功", "操作成功")))
}

pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    permission_service::delete(&state.pool, &ids).await?;
    Ok(Json(ApiResponse::message("操作成功", "操作成功")))
}
