//! Request validation shared by every write endpoint.
//!
//! Format/shape problems are 40001 (`PARAM_ERROR`); business conflicts are
//! handled by `AppError::business` in the services.

use crate::error::AppError;

pub const STATUS_ENABLE: &str = "1";
pub const STATUS_DISABLE: &str = "0";
pub const STATUS_ALL: &str = "all";

pub fn is_blank(value: &str) -> bool {
    value.trim().is_empty()
}

pub fn is_status(value: &str) -> bool {
    value == STATUS_ENABLE || value == STATUS_DISABLE
}

pub fn require_text(
    value: Option<&str>,
    message: &str,
) -> Result<String, AppError> {
    match value.map(str::trim).filter(|value| !value.is_empty()) {
        Some(value) => Ok(value.to_string()),
        None => Err(AppError::param(message.to_string())),
    }
}

pub fn check_name(value: &str) -> Result<(), AppError> {
    let length = value.trim().chars().count();
    if !(2..=50).contains(&length) {
        return Err(AppError::param("名称长度需在 2-50 之间"));
    }
    Ok(())
}

pub fn check_username(value: &str) -> Result<(), AppError> {
    let length = value.chars().count();
    if !(4..=50).contains(&length)
        || !value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '_')
    {
        return Err(AppError::param("用户名只能包含字母、数字和下划线，且长度需在 4-50 之间"));
    }
    Ok(())
}

pub fn check_email(value: &str) -> Result<(), AppError> {
    if value.is_empty() {
        return Ok(());
    }
    if value.contains(char::is_whitespace) {
        return Err(AppError::param("邮箱格式不正确"));
    }
    let mut parts = value.split('@');
    let local = parts.next().unwrap_or("");
    let domain = parts.next().unwrap_or("");
    if parts.next().is_some()
        || local.is_empty()
        || domain.is_empty()
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
    {
        return Err(AppError::param("邮箱格式不正确"));
    }
    Ok(())
}

pub fn check_phone(value: &str) -> Result<(), AppError> {
    let chars: Vec<char> = value.chars().collect();
    let valid = chars.len() == 11
        && chars[0] == '1'
        && ('3'..='9').contains(&chars[1])
        && chars.iter().all(|ch| ch.is_ascii_digit());
    if !valid {
        return Err(AppError::param("手机号格式不正确"));
    }
    Ok(())
}

pub fn check_status(value: &str) -> Result<(), AppError> {
    if is_status(value) {
        Ok(())
    } else {
        Err(AppError::param("状态只能是 0 或 1"))
    }
}

pub fn check_role_id(value: &str) -> Result<(), AppError> {
    let length = value.chars().count();
    let valid = (2..=32).contains(&length)
        && value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-');
    if !valid {
        return Err(AppError::param("角色ID只能包含字母、数字、下划线和中划线"));
    }
    Ok(())
}

pub fn check_new_password(value: &str) -> Result<(), AppError> {
    let length = value.chars().count();
    let has_letter = value.chars().any(|ch| ch.is_ascii_alphabetic());
    let has_digit = value.chars().any(|ch| ch.is_ascii_digit());
    if !(8..=64).contains(&length) {
        return Err(AppError::param("新密码长度需在 8-64 之间"));
    }
    if !has_letter || !has_digit {
        return Err(AppError::param("新密码需同时包含字母和数字"));
    }
    Ok(())
}

pub fn check_path(value: &str) -> Result<(), AppError> {
    if value.trim().is_empty() {
        return Err(AppError::validation("权限路径不能为空"));
    }
    Ok(())
}

/// `EditPermissionReq.path` is annotated `@Size(max = 200)`; create has no
/// upper bound in the reference.
pub fn check_path_length(value: &str) -> Result<(), AppError> {
    if value.chars().count() > 200 {
        return Err(AppError::param("权限路径长度不能超过 200"));
    }
    Ok(())
}

pub fn parse_page(value: Option<i32>, default: i32, max: i32) -> Result<i32, AppError> {
    let page = value.unwrap_or(default);
    if page < 1 || page > max {
        return Err(AppError::param(format!("页码必须在 1-{max} 之间")));
    }
    Ok(page)
}

pub fn parse_size(value: Option<i32>, default: i32, max: i32) -> Result<i32, AppError> {
    let size = value.unwrap_or(default);
    if size < 1 || size > max {
        return Err(AppError::param(format!("每页数量必须在 1-{max} 之间")));
    }
    Ok(size)
}

/// Returns `true` for ascending and `false` for descending.
pub fn parse_direction(value: Option<&str>) -> Result<Option<bool>, AppError> {
    match value.map(str::trim) {
        None | Some("") => Ok(None),
        Some("asc") => Ok(Some(true)),
        Some("desc") => Ok(Some(false)),
        Some(_) => Err(AppError::param("排序方向只能是 asc 或 desc")),
    }
}

/// Prefix pattern used by the reference implementation: lower-cased, escaped,
/// and anchored at the start (`LIKE 'value%'`).
pub fn like_prefix(value: &str) -> String {
    let mut escaped = String::with_capacity(value.len() + 1);
    for ch in value.to_lowercase().chars() {
        match ch {
            '\\' => escaped.push_str("\\\\"),
            '%' => escaped.push_str("\\%"),
            '_' => escaped.push_str("\\_"),
            other => escaped.push(other),
        }
    }
    escaped.push('%');
    escaped
}

pub fn split_ids(raw: &str) -> Vec<String> {
    raw.split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn username_shape_matches_contract() {
        assert!(check_username("super").is_ok());
        assert!(check_username("user_01").is_ok());
        assert!(check_username("abc").is_err());
        assert!(check_username("has space").is_err());
        assert!(check_username("has-dash").is_err());
    }

    #[test]
    fn phone_and_email_are_checked() {
        assert!(check_phone("13800000000").is_ok());
        assert!(check_phone("12800000000").is_err());
        assert!(check_phone("1380000000").is_err());
        assert!(check_email("a@b.com").is_ok());
        assert!(check_email("a@b").is_err());
        assert!(check_email("a b@c.com").is_err());
    }

    #[test]
    fn new_password_needs_letter_and_digit() {
        assert!(check_new_password("abcd1234").is_ok());
        assert!(check_new_password("abcdefgh").is_err());
        assert!(check_new_password("12345678").is_err());
        assert!(check_new_password("ab12").is_err());
    }

    #[test]
    fn like_prefix_escapes_wildcards() {
        assert_eq!(like_prefix("AB%_"), "ab\\%\\_%");
    }

    #[test]
    fn ids_are_split_and_trimmed() {
        assert_eq!(
            split_ids("a, b, ,c"),
            vec!["a".to_string(), "b".to_string(), "c".to_string()]
        );
    }
}
