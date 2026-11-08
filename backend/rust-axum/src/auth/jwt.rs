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
    /// Issuer, validated on every decode.
    pub iss: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn issue(
    issuer: &str,
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
        iss: issuer.to_string(),
        iat: issued_at,
        exp: issued_at + expires_in,
    };
    Ok(claims)
}

/// RS256 when an RSA private key is configured, otherwise HS256 with `secret`.
pub fn encode_token(
    private_key: Option<&str>,
    secret: &str,
    claims: &Claims,
) -> Result<String, AppError> {
    let (algorithm, key) = match private_key {
        Some(pem) => (
            Algorithm::RS256,
            EncodingKey::from_rsa_pem(pem.as_bytes()).map_err(|error| {
                tracing::error!(error = %error, "invalid JWT private key");
                AppError::system()
            })?,
        ),
        None => (
            Algorithm::HS256,
            EncodingKey::from_secret(secret.as_bytes()),
        ),
    };
    encode(&Header::new(algorithm), claims, &key).map_err(|error| {
        tracing::error!(error = %error, "failed to sign token");
        AppError::system()
    })
}

/// RS256 when an RSA public key is configured, otherwise HS256 with `secret`.
pub fn decode(
    token: &str,
    public_key: Option<&str>,
    secret: &str,
    issuer: &str,
) -> Result<Claims, AppError> {
    let (algorithm, key) = match public_key {
        Some(pem) => (
            Algorithm::RS256,
            DecodingKey::from_rsa_pem(pem.as_bytes()).map_err(|error| {
                tracing::error!(error = %error, "invalid JWT public key");
                AppError::system()
            })?,
        ),
        None => (
            Algorithm::HS256,
            DecodingKey::from_secret(secret.as_bytes()),
        ),
    };
    let mut validation = Validation::new(algorithm);
    validation.set_issuer(&[issuer]);
    jwt_decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|error| {
            tracing::debug!(error = %error, "invalid token");
            AppError::unauthorized("未登录")
        })
}
