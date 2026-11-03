pub mod auth;
pub mod groups;
pub mod menus;
pub mod operation_logs;
pub mod permissions;
pub mod roles;
pub mod users;

use crate::auth::AuthUser;
use crate::db::Db;
use crate::domain::validate::{like_prefix, STATUS_ALL};
use crate::error::AppError;
use crate::repository::{permissions as permission_repo, roles as role_repo};

/// Shared optional status filter: empty and `all` mean "no filter".
pub fn status_filter(value: Option<&str>) -> Result<Option<String>, AppError> {
    match value.map(str::trim) {
        None => Ok(None),
        Some(value) if value.is_empty() || value == STATUS_ALL => Ok(None),
        Some("0") => Ok(Some("0".to_string())),
        Some("1") => Ok(Some("1".to_string())),
        Some(_) => Err(AppError::param("状态只能是 0、1 或 all")),
    }
}

/// Builds an escaped LIKE prefix pattern, or `None` for an empty filter.
pub fn pattern(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(like_prefix)
}

pub fn non_blank(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
}

pub fn assert_can_assign_roles(
    caller: &AuthUser,
    role_ids: &[String],
) -> Result<(), AppError> {
    if role_ids.iter().any(|id| id == "super") && !caller.is_super() {
        return Err(AppError::business("只有超级管理员可以授予 super 角色"));
    }
    Ok(())
}

pub fn assert_can_assign_permissions(
    caller: &AuthUser,
    permission_ids: &[String],
) -> Result<(), AppError> {
    for permission_id in permission_ids {
        if !caller.authorities.contains(permission_id) {
            return Err(AppError::business("不能授予当前账号没有的权限"));
        }
    }
    Ok(())
}

/// The Java reference loads grants with `findAllById`, which silently drops
/// unknown ids. Filtering here keeps that behaviour and avoids FK errors.
pub async fn existing_role_ids(
    pool: &Db,
    ids: &[String],
) -> Result<Vec<String>, AppError> {
    let mut existing = Vec::new();
    for id in ids {
        if role_repo::exists(pool, id).await? {
            existing.push(id.clone());
        }
    }
    Ok(existing)
}

pub async fn existing_permission_ids(
    pool: &Db,
    ids: &[String],
) -> Result<Vec<String>, AppError> {
    let mut existing = Vec::new();
    for id in ids {
        if permission_repo::exists(pool, id).await? {
            existing.push(id.clone());
        }
    }
    Ok(existing)
}
