//! HTTP routing, shared extractors and handlers.

pub mod auth;
pub mod groups;
pub mod menus;
pub mod operation_logs;
pub mod permissions;
pub mod roles;
pub mod users;

use std::time::Duration;

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::Query;
use axum::http::{header, HeaderName, HeaderValue, Method};
use axum::middleware::from_fn_with_state;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::auth::AuthUser;
use crate::config::Config;
use crate::domain::validate::{check_status, require_text, split_ids};
use crate::error::AppError;
use crate::middleware::{optional_auth, require_auth, trace_middleware};
use crate::operation_log::operation_log;
use crate::response::ApiResponse;
use crate::state::AppState;

pub type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Debug, Deserialize)]
pub struct IdsQuery {
    pub ids: Option<String>,
}

pub fn parse_json<T>(payload: Result<Json<T>, JsonRejection>) -> Result<T, AppError> {
    payload.map(|Json(value)| value).map_err(|rejection| {
        // A malformed or shape-invalid body is a DTO validation failure (40002)
        // with the offending message in `data`, not a generic 40001.
        let message = rejection.to_string();
        AppError::validation("请求体格式错误")
            .with_data(serde_json::json!({ "body": message }))
    })
}

pub fn parse_query<T>(params: Result<Query<T>, QueryRejection>) -> Result<T, AppError> {
    params
        .map(|Query(value)| value)
        .map_err(|_| AppError::param("参数错误"))
}

pub fn ids_from_query(query: IdsQuery) -> Result<Vec<String>, AppError> {
    match query.ids.as_deref() {
        Some(raw) => {
            let ids = split_ids(raw);
            if ids.is_empty() {
                Err(AppError::param("ids 不能为空"))
            } else {
                Ok(ids)
            }
        }
        None => Err(AppError::param("ids 不能为空")),
    }
}

pub fn status_from_body(body: crate::domain::dto::StatusReq) -> Result<String, AppError> {
    let status = require_text(body.status.as_deref(), "状态不能为空")?;
    check_status(&status)?;
    Ok(status)
}

pub fn require(auth: &AuthUser, authority: &str) -> Result<(), AppError> {
    auth.require(authority)
}

fn cors_layer(config: &Config) -> CorsLayer {
    let origins: Vec<HeaderValue> = config
        .cors_origins
        .iter()
        .filter_map(|origin| {
            let origin = origin.trim();
            if origin == "*" {
                // `*` is invalid together with credentials; ignore it loudly.
                tracing::warn!("CORS_ORIGINS contains '*', which is not allowed with credentials");
                None
            } else {
                origin.parse::<HeaderValue>().ok()
            }
        })
        .collect();

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ORIGIN,
            HeaderName::from_static("locale"),
            HeaderName::from_static("x-trace-id"),
            HeaderName::from_static("x-request-id"),
        ])
        .expose_headers([
            HeaderName::from_static("x-trace-id"),
            HeaderName::from_static("x-request-id"),
        ])
        .allow_credentials(true)
        .max_age(Duration::from_secs(3600))
}

async fn not_found() -> AppError {
    AppError::not_found("资源不存在")
}

async fn method_not_allowed() -> AppError {
    AppError::method_not_allowed()
}

/// Builds the complete application router.
pub fn router(state: AppState) -> Router {
    let system = Router::new()
        // Users
        .route(
            "/api/v1/system/users",
            get(users::list)
                .post(users::create)
                .delete(users::delete_many),
        )
        .route(
            "/api/v1/system/users/{userId}",
            get(users::get).patch(users::edit).delete(users::delete_one),
        )
        .route(
            "/api/v1/system/users/{userId}/status",
            axum::routing::patch(users::update_status),
        )
        .route(
            "/api/v1/system/users/{userId}/reset-password",
            post(users::reset_password),
        )
        // Roles
        .route(
            "/api/v1/system/roles",
            get(roles::list).post(roles::create).delete(roles::delete_many),
        )
        .route(
            "/api/v1/system/roles/{roleId}",
            get(roles::get).patch(roles::edit).delete(roles::delete_one),
        )
        // Groups
        .route(
            "/api/v1/system/groups",
            get(groups::list).delete(groups::delete_many),
        )
        .route("/api/v1/system/groups/children", post(groups::create))
        .route(
            "/api/v1/system/groups/{groupId}",
            get(groups::get).patch(groups::edit).delete(groups::delete_one),
        )
        .route(
            "/api/v1/system/groups/{groupId}/status",
            axum::routing::patch(groups::update_status),
        )
        // Permissions
        .route(
            "/api/v1/system/permissions",
            get(permissions::list).delete(permissions::delete_many),
        )
        .route(
            "/api/v1/system/permissions/children",
            post(permissions::create),
        )
        .route(
            "/api/v1/system/permissions/{permissionId}",
            get(permissions::get)
                .patch(permissions::edit)
                .delete(permissions::delete_one),
        )
        // Operation logs
        .route("/api/v1/system/operation-logs", get(operation_logs::list))
        .layer(from_fn_with_state(state.clone(), operation_log))
        .layer(from_fn_with_state(state.clone(), require_auth));

    let auth_protected = Router::new()
        .route("/api/v1/auth/user-info", get(auth::user_info))
        .route("/api/v1/auth/menus", get(menus::tree))
        .route(
            "/api/v1/auth/change-password",
            post(auth::change_password)
                .layer(from_fn_with_state(state.clone(), operation_log)),
        )
        .layer(from_fn_with_state(state.clone(), require_auth));

    let public = Router::new()
        .route("/api/v1/auth/login", post(auth::login))
        .route("/api/v1/auth/refresh", post(auth::refresh))
        .route(
            "/api/v1/auth/logout",
            post(auth::logout).layer(from_fn_with_state(state.clone(), optional_auth)),
        );

    let cors = cors_layer(&state.config);

    Router::new()
        // Documentation endpoints stay outside the `/api/v1` routers, so no auth
        // middleware wraps them.
        .route("/openapi.json", get(crate::swagger::openapi_json))
        .route("/swagger", get(crate::swagger::swagger_ui))
        .merge(system)
        .merge(auth_protected)
        .merge(public)
        .fallback(not_found)
        .method_not_allowed_fallback(method_not_allowed)
        // Outermost layer first: CORS preflight responses must carry the same
        // X-Trace-Id as every other response.
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(axum::middleware::from_fn(trace_middleware))
        .with_state(state)
}
