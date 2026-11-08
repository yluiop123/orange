//! Business error type. Business codes and HTTP statuses mirror docs/API.md
//! and the Spring Boot `ErrorCode` enum.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::Value;

use crate::response::ApiResponse;

pub const CODE_SUCCESS: i32 = 200;
pub const CODE_PARAM: i32 = 40001;
pub const CODE_VALIDATE: i32 = 40002;
pub const CODE_UNAUTHORIZED: i32 = 40101;
pub const CODE_FORBIDDEN: i32 = 40301;
pub const CODE_PASSWORD_CHANGE: i32 = 40302;
pub const CODE_NOT_FOUND: i32 = 40401;
pub const CODE_METHOD_NOT_ALLOWED: i32 = 40501;
pub const CODE_CONFLICT: i32 = 40901;
pub const CODE_RATE_LIMITED: i32 = 429;
pub const CODE_SYSTEM: i32 = 50000;

#[derive(Debug, Clone)]
pub struct AppError {
    pub code: i32,
    pub status: StatusCode,
    pub message: String,
    pub data: Option<Value>,
}

impl AppError {
    pub fn new(code: i32, status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            code,
            status,
            message: message.into(),
            data: None,
        }
    }

    /// Semantic/business check failure. The reference maps messages containing
    /// 不存在 to 404 and 已存在/已被/不能删除 to 409; everything else is 40002.
    pub fn business(message: impl Into<String>) -> Self {
        let message = message.into();
        if message.contains("不存在") {
            Self::new(CODE_NOT_FOUND, StatusCode::NOT_FOUND, message)
        } else if message.contains("已存在")
            || message.contains("已被")
            || message.contains("不能删除")
            || message.contains("请先禁用子组织")
        {
            Self::new(CODE_CONFLICT, StatusCode::CONFLICT, message)
        } else {
            Self::new(CODE_VALIDATE, StatusCode::BAD_REQUEST, message)
        }
    }

    pub fn param(message: impl Into<String>) -> Self {
        Self::new(CODE_PARAM, StatusCode::BAD_REQUEST, message)
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self::new(CODE_VALIDATE, StatusCode::BAD_REQUEST, message)
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::new(CODE_UNAUTHORIZED, StatusCode::UNAUTHORIZED, message)
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(CODE_FORBIDDEN, StatusCode::FORBIDDEN, message)
    }

    pub fn password_change_required() -> Self {
        Self::new(
            CODE_PASSWORD_CHANGE,
            StatusCode::FORBIDDEN,
            "请先修改初始密码",
        )
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(CODE_NOT_FOUND, StatusCode::NOT_FOUND, message)
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::new(CODE_CONFLICT, StatusCode::CONFLICT, message)
    }

    pub fn method_not_allowed() -> Self {
        Self::new(
            CODE_METHOD_NOT_ALLOWED,
            StatusCode::METHOD_NOT_ALLOWED,
            "方法不允许",
        )
    }

    pub fn rate_limited(message: impl Into<String>) -> Self {
        Self::new(CODE_RATE_LIMITED, StatusCode::TOO_MANY_REQUESTS, message)
    }

    pub fn system() -> Self {
        Self::new(CODE_SYSTEM, StatusCode::INTERNAL_SERVER_ERROR, "系统异常")
    }

    pub fn with_data(mut self, data: Value) -> Self {
        self.data = Some(data);
        self
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        if let sqlx::Error::Database(database_error) = &error {
            if let Some(code) = database_error.code() {
                if crate::db::integrity_conflict(code.as_ref()) {
                    tracing::warn!(error = %error, "database integrity conflict");
                    return Self::conflict("数据冲突，请刷新后重试");
                }
            }
        }
        tracing::error!(error = %error, "database error");
        Self::system()
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if self.status.is_server_error() {
            tracing::error!(code = self.code, message = %self.message, "request failed");
        } else {
            tracing::warn!(code = self.code, message = %self.message, "request rejected");
        }

        let body = ApiResponse::<Value>::error(
            self.code,
            self.message.clone(),
            self.data.clone().unwrap_or(Value::Null),
        );
        (self.status, Json(body)).into_response()
    }
}
