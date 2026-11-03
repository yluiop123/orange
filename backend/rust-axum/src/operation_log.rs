//! Operation log policy and middleware.
//!
//! Only non-GET writes to `/api/v1/system/*` and `/api/v1/auth/change-password`
//! are recorded. Bodies on sensitive paths are never stored, sensitive JSON
//! fields are redacted, and body/query lengths are capped.

use std::net::SocketAddr;
use std::sync::OnceLock;
use std::time::Instant;

use axum::body::{to_bytes, Body};
use axum::extract::{ConnectInfo, Request, State};
use axum::http::{HeaderMap, Method};
use axum::middleware::Next;
use axum::response::Response;
use regex::Regex;

use crate::auth::AuthUser;
use crate::repository::operation_logs::{self, NewOperationLog};
use crate::response::TraceId;
use crate::state::AppState;

const QUERY_LIMIT: usize = 500;
const BODY_LIMIT: usize = 4000;
const BODY_READ_LIMIT: usize = 16 * 1024;

fn sensitive_field() -> &'static Regex {
    static REDACTOR: OnceLock<Regex> = OnceLock::new();
    REDACTOR.get_or_init(|| {
        Regex::new(
            r#"(?i)("[^"]*(?:password|token|secret)[^"]*"\s*:\s*)"(?:[^"\\]|\\.)*""#,
        )
        .expect("valid redaction regex")
    })
}

pub fn should_record(method: &str, path: &str) -> bool {
    if method.eq_ignore_ascii_case("GET") || method.eq_ignore_ascii_case("OPTIONS") {
        return false;
    }
    path.starts_with("/api/v1/system/") || path == "/api/v1/auth/change-password"
}

pub fn is_sensitive_path(path: &str) -> bool {
    let lower = path.to_lowercase();
    ["/login", "/refresh", "/change-password", "/reset-password"]
        .iter()
        .any(|suffix| lower.ends_with(suffix))
}

pub fn truncate(value: &str, limit: usize) -> String {
    value.chars().take(limit).collect()
}

pub fn sanitize_body(body: Option<&str>) -> Option<String> {
    let body = body?;
    let redacted = sensitive_field().replace_all(body, "$1\"***\"");
    let result = if redacted.chars().count() > BODY_LIMIT {
        redacted.chars().take(BODY_LIMIT).collect()
    } else {
        redacted.into_owned()
    };
    Some(result)
}

pub fn client_ip(headers: &HeaderMap, connect: Option<&ConnectInfo<SocketAddr>>) -> String {
    if let Some(forwarded) = headers.get("x-forwarded-for").and_then(|value| value.to_str().ok()) {
        let first = forwarded.split(',').next().unwrap_or("").trim();
        if !first.is_empty() {
            return first.to_string();
        }
    }
    connect
        .map(|ConnectInfo(addr)| addr.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

pub async fn operation_log(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let path = req.uri().path().to_string();

    if !should_record(method.as_str(), &path) {
        return next.run(req).await;
    }

    let trace_id = req
        .extensions()
        .get::<TraceId>()
        .map(|trace| trace.0.clone());
    let username = req
        .extensions()
        .get::<AuthUser>()
        .map(|user| user.username.clone());
    let query_string = req
        .uri()
        .query()
        .map(|query| truncate(query, QUERY_LIMIT));
    let ip = client_ip(req.headers(), req.extensions().get::<ConnectInfo<SocketAddr>>());

    let capture_body = !is_sensitive_path(&path)
        && method != Method::GET
        && method != Method::OPTIONS;

    let (parts, body) = req.into_parts();
    let (forwarded_body, request_body) = if capture_body {
        match to_bytes(body, BODY_READ_LIMIT).await {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                let sanitized = sanitize_body(Some(text.as_str()));
                (Body::from(bytes), sanitized)
            }
            Err(error) => {
                tracing::warn!(error = ?error, "operation log body capture failed");
                (Body::empty(), None)
            }
        }
    } else {
        (body, None)
    };

    let request = Request::from_parts(parts, forwarded_body);
    let started = Instant::now();
    let response = next.run(request).await;
    let duration_ms = started.elapsed().as_millis() as i64;
    let status = i32::from(response.status().as_u16());

    let log = NewOperationLog {
        trace_id,
        username,
        method: method.as_str().to_string(),
        path,
        query_string,
        request_body,
        status,
        duration_ms,
        ip: Some(ip),
    };
    if let Err(error) = operation_logs::insert(&state.db, &log).await {
        tracing::error!(error = %error, "failed to persist operation log");
    }

    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_writes_to_system_and_change_password_are_recorded() {
        assert!(should_record("POST", "/api/v1/system/users"));
        assert!(should_record("PATCH", "/api/v1/system/users/x"));
        assert!(should_record("DELETE", "/api/v1/system/roles"));
        assert!(should_record("POST", "/api/v1/auth/change-password"));
        assert!(!should_record("GET", "/api/v1/system/users"));
        assert!(!should_record("OPTIONS", "/api/v1/system/users"));
        assert!(!should_record("POST", "/api/v1/auth/login"));
        assert!(!should_record("POST", "/api/v1/auth/logout"));
    }

    #[test]
    fn sensitive_paths_are_detected() {
        assert!(is_sensitive_path("/api/v1/auth/login"));
        assert!(is_sensitive_path("/api/v1/auth/refresh"));
        assert!(is_sensitive_path("/api/v1/auth/change-password"));
        assert!(is_sensitive_path("/api/v1/system/users/1/reset-password"));
        assert!(!is_sensitive_path("/api/v1/system/users"));
    }

    #[test]
    fn sensitive_json_fields_are_redacted() {
        let body = r#"{"username":"super","password":"secret","nested":{"token":"a.b.c"},"secret":"x"}"#;
        let sanitized = sanitize_body(Some(body)).expect("sanitized");
        assert!(sanitized.contains("\"password\":\"***\""));
        assert!(sanitized.contains("\"token\":\"***\""));
        assert!(sanitized.contains("\"secret\":\"***\""));
        assert!(sanitized.contains("\"username\":\"super\""));
        assert!(!sanitized.contains("\"password\":\"secret\""));
    }

    #[test]
    fn body_is_truncated_to_4000_chars() {
        let body = "a".repeat(5000);
        let sanitized = sanitize_body(Some(&body)).expect("sanitized");
        assert_eq!(sanitized.chars().count(), 4000);
    }

    #[test]
    fn query_is_truncated_to_500_chars() {
        let query = "q".repeat(700);
        assert_eq!(truncate(&query, QUERY_LIMIT).chars().count(), 500);
    }
}
