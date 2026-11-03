//! Response envelope shared by every endpoint, including errors.
//!
//! The trace id is carried in a task-local so handlers and extractors can build
//! an envelope without threading a `TraceId` argument through every signature.
//! The trace middleware opens the scope and copies the id to `X-Trace-Id`.

use serde::Serialize;

tokio::task_local! {
    pub static TRACE_ID: String;
}

/// Request-scoped trace id stored in request extensions by the trace middleware.
#[derive(Clone, Debug)]
pub struct TraceId(pub String);

pub fn new_trace_id() -> String {
    let hex = uuid::Uuid::new_v4().simple().to_string();
    hex.chars().take(16).collect()
}

pub fn current_trace_id() -> String {
    TRACE_ID
        .try_with(|trace_id| trace_id.clone())
        .unwrap_or_else(|_| new_trace_id())
}

pub fn now_millis() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub message: String,
    pub data: T,
    pub timestamp: i64,
    #[serde(rename = "traceId")]
    pub trace_id: String,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            code: 200,
            message: "success".to_string(),
            data,
            timestamp: now_millis(),
            trace_id: current_trace_id(),
        }
    }

    /// Successful operation with an explicit message and payload. The Java
    /// reference returns `message` and `data` for these actions.
    pub fn message(message: impl Into<String>, data: T) -> Self {
        Self {
            code: 200,
            message: message.into(),
            data,
            timestamp: now_millis(),
            trace_id: current_trace_id(),
        }
    }

    pub fn error(code: i32, message: impl Into<String>, data: T) -> Self {
        Self {
            code,
            message: message.into(),
            data,
            timestamp: now_millis(),
            trace_id: current_trace_id(),
        }
    }
}

impl ApiResponse<String> {
    /// Java's `Response.ok(String)` puts the same text in `message` and `data`.
    pub fn ok_text(text: impl Into<String>) -> Self {
        let text = text.into();
        Self {
            code: 200,
            message: text.clone(),
            data: text,
            timestamp: now_millis(),
            trace_id: current_trace_id(),
        }
    }
}
