//! `/api/v1/auth/*` handlers.

use std::net::SocketAddr;
use std::str::FromStr;

use axum::extract::rejection::JsonRejection;
use axum::extract::{ConnectInfo, Request, State};
use axum::http::{header, HeaderMap, HeaderValue};
use axum::response::{IntoResponse, Response};
use axum::Extension;
use axum::Json;

use crate::auth::{cookies, AccessClaims, AuthUser};
use crate::domain::dto::{ChangePasswordReq, LoginReq, LoginResp, UserInfo};
use crate::domain::validate::{check_new_password, check_username};
use crate::error::AppError;
use crate::response::ApiResponse;
use crate::service::{auth as auth_service, users as user_service};
use crate::state::AppState;

use super::{parse_json, ApiResult};

fn with_set_cookie(mut response: Response, cookie: String) -> Response {
    if let Ok(value) = HeaderValue::from_str(&cookie) {
        response.headers_mut().append(header::SET_COOKIE, value);
    }
    response
}

fn error_with_clear(state: &AppState, error: AppError) -> Response {
    let response = error.into_response();
    with_set_cookie(response, cookies::clear(&state.config))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    tag = "auth",
    summary = "账号密码登录",
    description = "校验用户名与密码，成功时返回访问令牌，并通过 Set-Cookie 下发 refresh_token。",
    security(()),
    request_body = LoginReq,
    responses(
        (status = 200, description = "登录成功", body = ApiResponse<LoginResp>,
            headers(("Set-Cookie" = String, description = "refresh_token Cookie"))),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "用户名或密码错误", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "账号被锁定、禁用或需先修改密码", body = ApiResponse<serde_json::Value>),
        (status = 429, description = "请求过于频繁", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn login(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    payload: Result<Json<LoginReq>, JsonRejection>,
) -> Response {
    let result = async {
        let req = parse_json(payload)?;
        // Usernames are matched exactly; do not trim identity fields.
        let username = req
            .username
            .as_deref()
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| AppError::param("用户名不能为空"))?;
        check_username(username)?;
        let password_value = req
            .password
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| AppError::param("密码不能为空"))?;
        // Lockout uses the peer address, like the reference; X-Forwarded-For is
        // only trusted for the operation log.
        let ip = addr.ip().to_string();
        auth_service::login(&state, username, password_value, &ip).await
    }
    .await;

    match result {
        Ok(success) => {
            let body = Json(ApiResponse::ok(success.response)).into_response();
            with_set_cookie(body, cookies::build(&state.config, &success.refresh_token))
        }
        Err(error) => error_with_clear(&state, error),
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/refresh",
    tag = "auth",
    summary = "刷新访问令牌",
    description = "使用 refresh_token Cookie 换取新的访问令牌，并轮换 refresh_token。",
    security(()),
    params(("Cookie" = Option<String>, Header, description = "包含 refresh_token 的 Cookie")),
    responses(
        (status = 200, description = "刷新成功", body = ApiResponse<LoginResp>,
            headers(("Set-Cookie" = String, description = "轮换后的 refresh_token Cookie"))),
        (status = 401, description = "未登录或刷新令牌已失效", body = ApiResponse<serde_json::Value>),
        (status = 403, description = "账号被禁用", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn refresh(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let token = match cookies::from_headers(&headers) {
        Some(token) => token,
        None => return error_with_clear(&state, AppError::unauthorized("未登录")),
    };

    match auth_service::refresh(&state, &token).await {
        Ok(success) => {
            let body = Json(ApiResponse::ok(success.response)).into_response();
            with_set_cookie(body, cookies::build(&state.config, &success.refresh_token))
        }
        Err(error) => error_with_clear(&state, error),
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "auth",
    summary = "登出",
    description = "吊销当前访问令牌与 refresh_token，并清除 Cookie。未登录时同样返回成功。",
    security((), ("bearer_auth" = [])),
    params(("Cookie" = Option<String>, Header, description = "包含 refresh_token 的 Cookie")),
    responses(
        (status = 200, description = "已登出", body = ApiResponse<String>),
    )
)]
pub async fn logout(State(state): State<AppState>, req: Request) -> Response {
    let refresh_token = cookies::from_headers(req.headers());
    let access = req.extensions().get::<AccessClaims>().cloned();

    match auth_service::logout(&state, refresh_token, access.as_ref()).await {
        Ok(()) => {
            let body = Json(ApiResponse::ok_text("ok")).into_response();
            with_set_cookie(body, cookies::clear(&state.config))
        }
        Err(error) => error_with_clear(&state, error),
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/auth/user-info",
    tag = "auth",
    summary = "当前登录用户信息",
    description = "返回当前用户的资料、角色与生效权限。",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "用户信息", body = ApiResponse<UserInfo>),
        (status = 401, description = "未登录或登录已过期", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn user_info(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> ApiResult<UserInfo> {
    let info = user_service::user_info(&state.db, &auth.username).await?;
    Ok(Json(ApiResponse::ok(info)))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/change-password",
    tag = "auth",
    summary = "修改密码",
    description = "校验原密码后设置新密码，并清除 refresh_token Cookie 要求重新登录。",
    security(("bearer_auth" = [])),
    request_body = ChangePasswordReq,
    responses(
        (status = 200, description = "密码已修改", body = ApiResponse<String>),
        (status = 400, description = "参数或校验错误", body = ApiResponse<serde_json::Value>),
        (status = 401, description = "未登录或原密码错误", body = ApiResponse<serde_json::Value>),
    )
)]
pub async fn change_password(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
    payload: Result<Json<ChangePasswordReq>, JsonRejection>,
) -> Response {
    let result = async {
        let req = parse_json(payload)?;
        let old_password = req
            .old_password
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| AppError::param("原密码不能为空"))?;
        let new_password = req
            .new_password
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or_else(|| AppError::param("新密码不能为空"))?;
        check_new_password(new_password)?;
        user_service::change_password(&state.db, &auth.username, old_password, new_password).await
    }
    .await;

    match result {
        Ok(()) => {
            let body = Json(ApiResponse::message(
                "密码已修改，请重新登录",
                "密码已修改，请重新登录",
            ))
            .into_response();
            with_set_cookie(body, cookies::clear(&state.config))
        }
        Err(error) => error.into_response(),
    }
}
