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

#[utoipa::path(
    get,
    path = "/api/v1/system/groups",
    tag = "groups",
    summary = "组织列表",
    description = "按 ID、名称或状态筛选组织列表。",
    security(("bearer_auth" = [])),
    params(GroupListQuery),
    responses(
        (status = 200, description = "组织列表", body = ApiResponse<Vec<GroupBean>>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    get,
    path = "/api/v1/system/groups/{groupId}",
    tag = "groups",
    summary = "组织详情",
    security(("bearer_auth" = [])),
    params(("groupId" = String, Path, description = "组织 ID")),
    responses(
        (status = 200, description = "组织详情", body = ApiResponse<GroupBean>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "组织不存在", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn get(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
) -> ApiResult<GroupBean> {
    require(&auth, "menu#/system/group")?;
    let group = group_service::get(&state.db, &group_id).await?;
    Ok(Json(ApiResponse::ok(group)))
}

#[utoipa::path(
    post,
    path = "/api/v1/system/groups/children",
    tag = "groups",
    summary = "新增子组织",
    description = "在指定父组织下创建子组织。",
    security(("bearer_auth" = [])),
    request_body = AddChildGroupReq,
    responses(
        (status = 200, description = "创建成功", body = ApiResponse<GroupBean>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "组织已存在", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    patch,
    path = "/api/v1/system/groups/{groupId}",
    tag = "groups",
    summary = "修改组织",
    security(("bearer_auth" = [])),
    params(("groupId" = String, Path, description = "组织 ID")),
    request_body = EditGroupReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "组织不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "数据冲突", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    patch,
    path = "/api/v1/system/groups/{groupId}/status",
    tag = "groups",
    summary = "修改组织状态",
    security(("bearer_auth" = [])),
    params(("groupId" = String, Path, description = "组织 ID")),
    request_body = StatusReq,
    responses(
        (status = 200, description = "修改成功", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "组织不存在", body = ApiResponse<serde_json::Value>),
    )
)]
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

#[utoipa::path(
    delete,
    path = "/api/v1/system/groups/{groupId}",
    tag = "groups",
    summary = "删除组织",
    security(("bearer_auth" = [])),
    params(("groupId" = String, Path, description = "组织 ID")),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "组织不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "存在子组织，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn delete_one(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    Path(group_id): Path<String>,
) -> ApiResult<String> {
    require(&auth, "action#/system/group:delete")?;
    group_service::delete(&state.db, &[group_id]).await?;
    Ok(Json(ApiResponse::ok_text("操作成功")))
}

#[utoipa::path(
    delete,
    path = "/api/v1/system/groups",
    tag = "groups",
    summary = "批量删除组织",
    description = "以逗号分隔的 `ids` 查询参数批量删除组织。",
    security(("bearer_auth" = [])),
    params(IdsQuery),
    responses(
        (status = 200, description = "删除成功", body = ApiResponse<String>),
        (status = 400, description = "参数错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "无权访问", body = ApiResponse<serde_json::Value>),
        (status = 404, description = "组织不存在", body = ApiResponse<serde_json::Value>),
        (status = 409, description = "存在子组织，不能删除", body = ApiResponse<serde_json::Value>),
    )
)]
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
