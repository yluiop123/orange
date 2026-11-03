//! Authentication primitives: JWT issuing/validation, password hashing,
//! lockout accounting and the refresh cookie.

pub mod cookies;
pub mod jwt;
pub mod lockout;
pub mod password;

use std::collections::HashSet;

use axum::http::{header, HeaderMap};
use crate::db::Db;

use crate::domain::effective::EffectivePermissions;
use crate::domain::entities::User;
use crate::error::AppError;
use crate::repository::{security, users};
use crate::state::AppState;

/// The authenticated principal placed in request extensions by the auth
/// middleware and consumed by handlers.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub username: String,
    pub must_change_password: bool,
    pub token_version: i32,
    pub authorities: HashSet<String>,
    pub role_ids: HashSet<String>,
}

impl AuthUser {
    pub fn is_super(&self) -> bool {
        self.role_ids.contains("super")
    }

    pub fn has_authority(&self, authority: &str) -> bool {
        self.authorities.contains(authority)
    }

    pub fn require(&self, authority: &str) -> Result<(), AppError> {
        if self.has_authority(authority) {
            Ok(())
        } else {
            Err(AppError::forbidden("无权访问"))
        }
    }
}

/// Claims of the access token that logout needs in order to revoke the exact
/// `jti` even when the user row was already bumped.
#[derive(Debug, Clone)]
pub struct AccessClaims {
    pub jti: String,
    pub exp: i64,
    pub user_id: String,
    pub username: String,
}

pub fn bearer_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

pub fn cookie_value(headers: &HeaderMap, name: &str) -> Option<String> {
    let header = headers.get(header::COOKIE)?.to_str().ok()?;
    for part in header.split(';') {
        let mut pair = part.trim().splitn(2, '=');
        let key = pair.next()?;
        let value = pair.next().unwrap_or("");
        if key == name && !value.is_empty() {
            return Some(value.to_string());
        }
    }
    None
}

pub async fn build_auth_user(pool: &Db, user: User) -> Result<AuthUser, sqlx::Error> {
    let roles = users::roles_for_user(pool, &user.id).await?;
    let role_permissions = users::role_permissions_for_user(pool, &user.id).await?;
    let direct_permissions = users::direct_permissions_for_user(pool, &user.id).await?;
    let effective = EffectivePermissions::compute(roles, role_permissions, direct_permissions);

    Ok(AuthUser {
        id: user.id,
        username: user.username,
        must_change_password: user.must_change_password,
        token_version: user.token_version,
        authorities: effective.authorities,
        role_ids: effective.roles.into_iter().map(|role| role.id).collect(),
    })
}

/// Parses and validates an access token against the user row: type, revocation,
/// status, token version and subject all have to agree.
pub async fn authenticate_token(
    state: &AppState,
    token: &str,
) -> Result<(AuthUser, AccessClaims), AppError> {
    let claims = jwt::decode(token, &state.config.jwt_secret)
        .map_err(|_| AppError::unauthorized("未登录"))?;

    if claims.typ != jwt::TYPE_ACCESS {
        return Err(AppError::unauthorized("未登录"));
    }
    if security::is_revoked(&state.db, &claims.jti).await? {
        return Err(AppError::unauthorized("登录已过期"));
    }

    let user = users::find_by_username(&state.db, &claims.username)
        .await?
        .ok_or_else(|| AppError::unauthorized("未登录"))?;

    if user.status == "0" || user.token_version != claims.ver || user.id != claims.sub {
        return Err(AppError::unauthorized("登录已过期"));
    }

    let auth_user = build_auth_user(&state.db, user).await?;
    let claims = AccessClaims {
        jti: claims.jti,
        exp: claims.exp,
        user_id: claims.sub,
        username: claims.username,
    };
    Ok((auth_user, claims))
}

pub const ALLOWED_BEFORE_PASSWORD_CHANGE: [&str; 4] = [
    "/api/v1/auth/change-password",
    "/api/v1/auth/user-info",
    "/api/v1/auth/menus",
    "/api/v1/auth/logout",
];

pub fn path_allowed_before_password_change(path: &str) -> bool {
    ALLOWED_BEFORE_PASSWORD_CHANGE.contains(&path)
}
