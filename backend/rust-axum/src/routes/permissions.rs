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

#[utoipa::path(
    get,
    path = "/api/v1/system/permissions",
    tag = "permissions",
    summary = "权限列表",
    security(("bearer_auth" = [])),
    params(PermissionListQuery),
    responses(
        (status = 200, description = "权限列表", body = ApiResponse<Vec<PermissionBean>>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn list(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<PermissionListQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<Vec<PermissionBean>> {
    require(&auth, "menu#/system/permission")?;
    let query = parse_query(params)?;
    let permissions = permission_service::list(&state.db, &query).await?;
    Ok(Json(ApiResponse::ok(permissions)))
}

#[utoipa::path(
    get,
    path = "/api/v1/system/permissions/{permissionId}",
    tag = "permissions",
    summary = "权限详情",
    security(("bearer_auth" = [])),
    params(("permissionId" = String, Path, description = "权限 ID")),
    responses(
        (status = 200, description = "权限详情", body = ApiResponse<PermissionBean>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "权限不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
) -> ApiResult<PermissionBean> {
    require(&auth, "menu#/system/permission")?;
    let permission = permission_service::get(&state.db, &permission_id).await?;
    Ok(Json(ApiResponse::ok(permission)))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/permissions/children",
    tag = "permissions",
    summary = "新增子权限",
    security(("bearer_auth" = [])),
    request_body = AddChildPermissionReq,
    responses(
        (status = 200, description = "创建成功", body = ApiResponse<PermissionBean>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "权限已存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn create(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<AddChildPermissionReq>, JsonRejection>,
) -> ApiResult<PermissionBean> {
    require(&auth, "action#/system/permission:add")?;
    let req = parse_json(payload)?;
    let permission = permission_service::create(&state.db, &req).await?;
    Ok(Json(ApiResponse::ok(permission)))
}

#[utoipa::path(
    patch,
    path = "/api/v1/system/permissions/{permissionId}",
    tag = "permissions",
    summary = "修改权限",
    security(("bearer_auth" = [])),
    params(("permissionId" = String, Path, description = "权限 ID")),
    request_body = EditPermissionReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "权限不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "数据冲突", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn edit(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
    payload: Result<Json<EditPermissionReq>, JsonRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:edit")?;
    let req = parse_json(payload)?;
    permission_service::edit(&state.db, &permission_id, &req).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/permissions/{permissionId}",
    tag = "permissions",
    summary = "删除权限",
    security(("bearer_auth" = [])),
    params(("permissionId" = String, Path, description = "权限 ID")),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "权限不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "权限仍被引用，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(permission_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:delete")?;
    permission_service::delete(&state.db, &[permission_id]).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/permissions",
    tag = "permissions",
    summary = "批量删除权限",
    description = "以逗号分隔的 `ids` 查询参数批量删除权限。",
    security(("bearer_auth" = [])),
    params(IdsQuery),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "权限不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "权限仍被引用，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_many(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    params: Result<Query<IdsQuery>, axum::extract::rejection::QueryRejection>,
) -> ApiResult<String> {
    require(&auth, "action#/system/permission:delete")?;
    let ids = ids_from_query(parse_query(params)?)?;
    permission_service::delete(&state.db, &ids).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}
