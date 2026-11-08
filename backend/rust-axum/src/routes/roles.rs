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

#[utoipa::path(
    get,
    path = "/api/v1/system/roles",
    tag = "roles",
    summary = "角色分页列表",
    security(("bearer_auth" = [])),
    params(RoleListQuery),
    responses(
        (status = 200, description = "角色分页", body = ApiResponse<PageData<RoleBean>>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    get,
    path = "/api/v1/system/roles/{roleId}",
    tag = "roles",
    summary = "角色详情",
    security(("bearer_auth" = [])),
    params(("roleId" = String, Path, description = "角色 ID")),
    responses(
        (status = 200, description = "角色详情", body = ApiResponse<RoleBean>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "角色不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(role_id): Path<String>,
) -> ApiResult<RoleBean> {
    require(&auth, "menu#/system/role")?;
    let role = role_service::get(&state.db, &role_id).await?;
    Ok(Json(ApiResponse::ok(role)))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/roles",
    tag = "roles",
    summary = "新增角色",
    security(("bearer_auth" = [])),
    request_body = AddRoleReq,
    responses(
        (status = 200, description = "创建成功，data 为新角色 ID", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "角色已存在", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    patch,
    path = "/api/v1/system/roles/{roleId}",
    tag = "roles",
    summary = "修改角色",
    security(("bearer_auth" = [])),
    params(("roleId" = String, Path, description = "角色 ID")),
    request_body = EditRoleReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "角色不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "数据冲突", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/system/roles/{roleId}",
    tag = "roles",
    summary = "删除角色",
    security(("bearer_auth" = [])),
    params(("roleId" = String, Path, description = "角色 ID")),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "角色不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "角色仍被引用，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(role_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:delete")?;
    role_service::delete(&state.db, &auth, &[role_id]).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/roles",
    tag = "roles",
    summary = "批量删除角色",
    description = "以逗号分隔的 `ids` 查询参数批量删除角色。",
    security(("bearer_auth" = [])),
    params(IdsQuery),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "角色不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "角色仍被引用，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/role:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    role_service::delete(&state.db, &auth, &ids).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}
