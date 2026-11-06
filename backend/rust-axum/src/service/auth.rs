//! Login, refresh rotation and logout.

use chrono::{TimeZone, Utc};

use crate::auth::lockout::{ip_key, user_key};
use crate::auth::{jwt, password, AccessClaims};
use crate::domain::dto::LoginResp;
use crate::domain::entities::User;
use crate::error::AppError;
use crate::repository::{security, users};
use crate::state::AppState;

pub struct LoginSuccess {
    pub response: LoginResp,
    pub refresh_token: String,
}

fn expires_at(seconds: i64) -> chrono::DateTime<Utc> {
    Utc.timestamp_opt(seconds, 0).single().unwrap_or_else(Utc::now)
}

fn issue_tokens(state: &AppState, user: &User) -> Result<LoginSuccess, AppError> {
    let access_claims = jwt::issue(
        &state.config.jwt_issuer,
        &user.id,
        &user.username,
        user.token_version,
        jwt::TYPE_ACCESS,
        state.config.access_expire,
    )?;
    let refresh_claims = jwt::issue(
        &state.config.jwt_issuer,
        &user.id,
        &user.username,
        user.token_version,
        jwt::TYPE_REFRESH,
        state.config.refresh_expire,
    )?;

    let access_token = jwt::encode_token(&state.config.jwt_secret, &access_claims)?;
    let refresh_token = jwt::encode_token(&state.config.jwt_secret, &refresh_claims)?;

    Ok(LoginSuccess {
        response: LoginResp {
            token: access_token,
            status: "ok".to_string(),
            field: None,
            msg: None,
            expires_in: state.config.access_expire,
            refresh_expires_in: state.config.refresh_expire,
        },
        refresh_token,
    })
}

async fn record_failure(state: &AppState, ip: &str, username: &str) {
    let attempts = [
        (ip_key(ip), state.config.login_ip_max_attempts),
        (user_key(username), state.config.login_max_attempts),
    ];
    for (key, max_attempts) in attempts {
        if let Err(error) = security::record_failure(
            &state.db,
            &key,
            max_attempts,
            state.config.login_lock_minutes,
        )
        .await
        {
            tracing::error!(error = %error, key = %key, "failed to record login attempt");
        }
    }
}

pub async fn login(
    state: &AppState,
    username: &str,
    password_value: &str,
    ip: &str,
) -> Result<LoginSuccess, AppError> {
    let keys = vec![ip_key(ip), user_key(username)];
    if security::is_blocked(&state.db, &keys).await? {
        return Err(AppError::rate_limited("登录失败次数过多，请稍后再试"));
    }

    let user = users::find_by_username(&state.db, username).await?;
    let mut valid = false;
    if let Some(found) = user.as_ref() {
        if let Some(hash) = found.password.as_deref() {
            if !hash.is_empty() {
                valid = password::verify(password_value.to_string(), hash.to_string()).await;
            }
        }
    }

    match user {
        Some(found) if valid && found.status != "0" => {
            security::clear_attempt(&state.db, &user_key(&found.username)).await?;
            issue_tokens(state, &found)
        }
        _ => {
            record_failure(state, ip, username).await;
            Err(AppError::unauthorized("用户名或密码错误"))
        }
    }
}

pub async fn refresh(
    state: &AppState,
    refresh_token: &str,
) -> Result<LoginSuccess, AppError> {
    let claims = jwt::decode(
        refresh_token,
        &state.config.jwt_secret,
        &state.config.jwt_issuer,
    )
        .map_err(|_| AppError::unauthorized("登录已过期"))?;
    if claims.typ != jwt::TYPE_REFRESH {
        return Err(AppError::unauthorized("登录已过期"));
    }
    if security::is_revoked(&state.db, &claims.jti).await? {
        return Err(AppError::unauthorized("登录已过期"));
    }

    let user = users::find_by_username(&state.db, &claims.username)
        .await?
        .ok_or_else(|| AppError::unauthorized("登录已过期"))?;
    if user.status == "0" || user.token_version != claims.ver || user.id != claims.sub {
        return Err(AppError::unauthorized("登录已过期"));
    }

    // Rotate: the old jti is revoked before a new refresh token is issued.
    // Replaying the old token then fails at the revocation check above.
    if !security::revoke(
        &state.db,
        &claims.jti,
        jwt::TYPE_REFRESH,
        expires_at(claims.exp),
    )
    .await?
    {
        return Err(AppError::unauthorized("登录已过期"));
    }

    issue_tokens(state, &user)
}

pub async fn logout(
    state: &AppState,
    refresh_token: Option<String>,
    access_claims: Option<&AccessClaims>,
) -> Result<(), AppError> {
    let mut username: Option<String> = None;

    if let Some(token) = refresh_token {
        if let Ok(claims) = jwt::decode(
            &token,
            &state.config.jwt_secret,
            &state.config.jwt_issuer,
        ) {
            if claims.typ == jwt::TYPE_REFRESH {
                username = Some(claims.username.clone());
                let _ = security::revoke(
                    &state.db,
                    &claims.jti,
                    jwt::TYPE_REFRESH,
                    expires_at(claims.exp),
                )
                .await;
            }
        }
    }

    if let Some(claims) = access_claims {
        if username.is_none() {
            username = Some(claims.username.clone());
        }
        let _ = security::revoke(
            &state.db,
            &claims.jti,
            jwt::TYPE_ACCESS,
            expires_at(claims.exp),
        )
        .await;
    }

    if let Some(username) = username {
        // Matches the reference: logout invalidates every session for the user.
        users::bump_token_version_by_username(&state.db, &username).await?;
    }
    Ok(())
}
