//! `/api/v1/system/groups` handlers.

use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, Query, State};
use axum::Extension;
use axum::Json;

use crate::auth::AuthUser;
use crate::domain::dto::{AddChildGroupReq, EditGroupReq, GroupBean, GroupListQuery, StatusReq};
use crate::response::ApiResponse;
use crate::service::groups as group_service;
use crate::state::AppState;

use super::{
    ids_from_query, parse_json, parse_query, require, status_from_body, ApiResult, IdsQuery,
};

pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<GroupListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<Vec<GroupBean>> {
    require(&auth, "menu#/system/group")?;
    let query = parse_query(params)?;
    let groups = group_service::list(&state.db, &query).await?;
    Ok(Json(ApiResponse::ok(groups)))
}

pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
) -> ApiResult<GroupBean> {
    require(&auth, "menu#/system/group")?;
    let group = group_service::get(&state.db, &group_id).await?;
    Ok(Json(ApiResponse::ok(group)))
}

pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddChildGroupReq>, JsonRejection>,
) -> ApiResult<GroupBean> {
    require(&auth, "action#/system/group:add")?;
    let req = parse_json(payload)?;
    let group = group_service::create(&state.db, &req).await?;
    Ok(Json(ApiResponse::ok(group)))
}

pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
    payload: Result<Json<EditGroupReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/group:edit")?;
    let req = parse_json(payload)?;
    if req
        .name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .is_none()
    {
        return Err(crate::error::AppError::param("组织名称不能为空"));
    }
    group_service::edit(&state.db, &group_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn update_status(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
    payload: Result<Json<StatusReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/group:edit")?;
    let status = status_from_body(parse_json(payload)?)?;
    let req = EditGroupReq {
        name: None,
        status: Some(status),
    };
    group_service::edit(&state.db, &group_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/group:delete")?;
    group_service::delete(&state.db, &[group_id]).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/group:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    group_service::delete(&state.db, &ids).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}
