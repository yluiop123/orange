//! Refresh token cookie.

use axum::http::HeaderMap;

use crate::auth;
use crate::config::Config;

pub const REFRESH_COOKIE: &str = "refresh_token";
pub const COOKIE_PATH: &str = "/api/v1/auth";

pub fn build(config: &Config, token: &str) -> String {
    let mut cookie = format!(
        "{name}={token}; Path={path}; HttpOnly; Max-Age={max_age}; SameSite={same_site}",
        name = REFRESH_COOKIE,
        token = token,
        path = COOKIE_PATH,
        max_age = config.refresh_expire,
        same_site = config.cookie_same_site,
    );
    if config.cookie_secure {
        cookie.push_str("; Secure");
    }
    if let Some(domain) = config.cookie_domain.as_deref() {
        if !domain.trim().is_empty() {
            cookie.push_str("; Domain=");
            cookie.push_str(domain.trim());
        }
    }
    cookie
}

pub fn clear(config: &Config) -> String {
    let mut cookie = format!(
        "{name}=; Path={path}; HttpOnly; Max-Age=0; SameSite={same_site}",
        name = REFRESH_COOKIE,
        path = COOKIE_PATH,
        same_site = config.cookie_same_site,
    );
    if config.cookie_secure {
        cookie.push_str("; Secure");
    }
    if let Some(domain) = config.cookie_domain.as_deref() {
        if !domain.trim().is_empty() {
            cookie.push_str("; Domain=");
            cookie.push_str(domain.trim());
        }
    }
    cookie
}

pub fn from_headers(headers: &HeaderMap) -> Option<String> {
    auth::cookie_value(headers, REFRESH_COOKIE)
}
