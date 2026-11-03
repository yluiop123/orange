//! Trace id, authentication and forced-password-change middleware.

use std::str::FromStr;

use axum::extract::{Request, State};
use axum::http::HeaderValue;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::auth::{self, AccessClaims};
use crate::error::AppError;
use crate::response::{new_trace_id, TraceId, TRACE_ID};
use crate::state::AppState;

fn is_safe_trace_id(value: &str) -> bool {
    let length = value.chars().count();
    (8..=64).contains(&length)
        && value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '-'))
}

/// Accepts `X-Trace-Id` (and the Java backend's `X-Request-Id`), otherwise
/// generates one, scopes it for the whole request and echoes it as a header.
pub async fn trace_middleware(mut req: Request, next: Next) -> Response {
    let incoming = req
        .headers()
        .get("x-trace-id")
        .or_else(|| req.headers().get("x-request-id"))
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| is_safe_trace_id(value))
        .map(str::to_string);

    let trace_id = incoming.unwrap_or_else(new_trace_id);
    req.extensions_mut().insert(TraceId(trace_id.clone()));

    let mut response = TRACE_ID.scope(trace_id.clone(), next.run(req)).await;
    if let Ok(value) = HeaderValue::from_str(&trace_id) {
        response.headers_mut().insert("x-trace-id", value);
    }
    response
}

/// Rejects missing/invalid access tokens, enforces `must_change_password`, and
/// stores the principal plus its claims in request extensions.
pub async fn require_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Response {
    let path = req.uri().path().to_string();
    let token = match auth::bearer_token(req.headers()) {
        Some(token) => token,
        None => return AppError::unauthorized("未登录").into_response(),
    };

    match auth::authenticate_token(&state, &token).await {
        Ok((user, claims)) => {
            if user.must_change_password && !auth::path_allowed_before_password_change(&path) {
                return AppError::password_change_required().into_response();
            }
            req.extensions_mut().insert(user);
            req.extensions_mut().insert(claims);
            next.run(req).await
        }
        Err(error) => error.into_response(),
    }
}

/// Used by logout: a stale access token must not prevent clearing the cookie.
pub async fn optional_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Response {
    if let Some(token) = auth::bearer_token(req.headers()) {
        if let Ok((user, claims)) = auth::authenticate_token(&state, &token).await {
            req.extensions_mut().insert::<crate::auth::AuthUser>(user);
            req.extensions_mut().insert::<AccessClaims>(claims);
        }
    }
    next.run(req).await
}
