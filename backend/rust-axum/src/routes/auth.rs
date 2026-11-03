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
use crate::domain::dto::{ChangePasswordReq, LoginReq, UserInfo};
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
            with_set_cookie(
                body,
                cookies::build(&state.config, &success.refresh_token),
            )
        }
        Err(error) => error_with_clear(&state, error),
    }
}

pub async fn refresh(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let token = match cookies::from_headers(&headers) {
        Some(token) => token,
        None => return error_with_clear(&state, AppError::unauthorized("未登录")),
    };

    match auth_service::refresh(&state, &token).await {
        Ok(success) => {
            let body = Json(ApiResponse::ok(success.response)).into_response();
            with_set_cookie(
                body,
                cookies::build(&state.config, &success.refresh_token),
            )
        }
        Err(error) => error_with_clear(&state, error),
    }
}

pub async fn logout(State(state): State<AppState>, req: Request) -> Response {
    let refresh_token = cookies::from_headers(req.headers());
    let access = req.extensions().get::<AccessClaims>().cloned();

    match auth_service::logout(&state, refresh_token, access.as_ref()).await {
        Ok(()) => {
            let body = Json(ApiResponse::message("ok", "ok")).into_response();
            with_set_cookie(body, cookies::clear(&state.config))
        }
        Err(error) => error_with_clear(&state, error),
    }
}

pub async fn user_info(
    State(state): State<AppState>,
    Extension(auth): Extension<AuthUser>,
) -> ApiResult<UserInfo> {
    let info = user_service::user_info(&state.pool, &auth.username).await?;
    Ok(Json(ApiResponse::ok(info)))
}

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
        user_service::change_password(&state.pool, &auth.username, old_password, new_password).await
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
