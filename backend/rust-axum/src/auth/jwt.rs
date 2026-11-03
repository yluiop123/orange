use jsonwebtoken::{
    decode as jwt_decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

pub const TYPE_ACCESS: &str = "access";
pub const TYPE_REFRESH: &str = "refresh";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// User id.
    pub sub: String,
    /// Unique token id; revocation is keyed on this.
    pub jti: String,
    /// `access` or `refresh`.
    pub typ: String,
    /// `sys_user.token_version` at issue time.
    pub ver: i32,
    pub username: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn issue(
    secret: &str,
    user_id: &str,
    username: &str,
    token_version: i32,
    token_type: &str,
    expires_in: i64,
) -> Result<Claims, AppError> {
    let issued_at = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: user_id.to_string(),
        jti: uuid::Uuid::new_v4().to_string(),
        typ: token_type.to_string(),
        ver: token_version,
        username: username.to_string(),
        iat: issued_at,
        exp: issued_at + expires_in,
    };
    Ok(claims)
}

pub fn encode_token(secret: &str, claims: &Claims) -> Result<String, AppError> {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|error| {
        tracing::error!(error = %error, "failed to sign token");
        AppError::system()
    })
}

pub fn decode(token: &str, secret: &str) -> Result<Claims, AppError> {
    let validation = Validation::new(Algorithm::HS256);
    jwt_decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|error| {
        tracing::debug!(error = %error, "invalid token");
        AppError::unauthorized("未登录")
    })
}
