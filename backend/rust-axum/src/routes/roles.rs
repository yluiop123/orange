//! `/api/v1/system/roles` handlers.

use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, Query, State};
use axum::Extension;
use axum::Json;

use crate::auth::AuthUser;
use crate::domain::dto::{AddRoleReq, EditRoleReq, PageData, RoleBean, RoleListQuery};
use crate::response::ApiResponse;
use crate::service::roles as role_service;
use crate::state::AppState;

use super::{ids_from_query, parse_json, parse_query, require, ApiResult, IdsQuery};

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<RoleListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<PageData<RoleBean>> {
    require(&auth, "menu#/system/role")?;
    let query = parse_query(params)?;
    let page = role_service::list(&state.db, &query).await?;
    Ok(Json(ApiResponse::ok(page)))
}

pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(role_id): Path<String>,
) -> ApiResult<RoleBean> {
    require(&auth, "menu#/system/role")?;
    let role = role_service::get(&state.db, &role_id).await?;
    Ok(Json(ApiResponse::ok(role)))
}

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddRoleReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:add")?;
    let req = parse_json(payload)?;
    let id = role_service::create(&state.db, &auth, &req).await?;
    Ok(Json(ApiResponse::message("操作成功", id)))
}

pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(role_id): Path<String>,
    payload: Result<Json<EditRoleReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:edit")?;
    let req = parse_json(payload)?;
    role_service::edit(&state.db, &auth, &role_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(role_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:delete")?;
    role_service::delete(&state.db, &[role_id]).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    role_service::delete(&state.db, &ids).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}
