//! Permission identity (`type` + `path` + `action`) rules.

use crate::error::AppError;

pub const TYPE_MENU: &str = "menu";
pub const TYPE_ACTION: &str = "action";
pub const TYPE_DIRECTORY: &str = "directory";

pub fn is_valid_type(kind: &str) -> bool {
    kind == TYPE_MENU || kind == TYPE_ACTION || kind == TYPE_DIRECTORY
}

/// `action` requires a non-blank action; `menu`/`directory` must not have one.
/// A blank action is treated as "no action" and normalised to NULL on write.
pub fn validate_shape(kind: &str, action: Option<&str>) -> Result<(), AppError> {
    if !is_valid_type(kind) {
        return Err(AppError::param("权限类型只能是 menu、action 或 directory"));
    }
    let action = action.map(str::trim).filter(|value| !value.is_empty());
    if kind == TYPE_ACTION {
        if action.is_none() {
            return Err(AppError::validation("action 类型的权限必须填写 action"));
        }
    } else if action.is_some() {
        return Err(AppError::validation(
            "menu/directory 类型的权限不能填写 action",
        ));
    }
    Ok(())
}

pub fn normalise_action(action: Option<&str>) -> Option<String> {
    action
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

/// An authority string is `type#path` or `type#path:action`.
pub fn authority(kind: &str, path: &str, action: Option<&str>) -> String {
    match action.map(str::trim).filter(|value| !value.is_empty()) {
        Some(action) => format!("{kind}#{path}:{action}"),
        None => format!("{kind}#{path}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn action_type_requires_action() {
        assert!(validate_shape(TYPE_ACTION, Some("add")).is_ok());
        assert!(validate_shape(TYPE_ACTION, None).is_err());
        assert!(validate_shape(TYPE_ACTION, Some("   ")).is_err());
    }

    #[test]
    fn menu_and_directory_forbid_action() {
        assert!(validate_shape(TYPE_MENU, None).is_ok());
        assert!(validate_shape(TYPE_DIRECTORY, None).is_ok());
        assert!(validate_shape(TYPE_MENU, Some("add")).is_err());
        assert!(validate_shape(TYPE_DIRECTORY, Some("add")).is_err());
        assert!(validate_shape(TYPE_MENU, Some("  ")).is_ok());
    }

    #[test]
    fn unknown_type_is_rejected() {
        assert!(validate_shape("api", None).is_err());
    }

    #[test]
    fn action_is_normalised() {
        assert_eq!(normalise_action(Some("  add  ")), Some("add".to_string()));
        assert_eq!(normalise_action(Some("   ")), None);
        assert_eq!(normalise_action(None), None);
    }

    #[test]
    fn authority_shape_matches_contract() {
        assert_eq!(authority("menu", "/system/user", None), "menu#/system/user");
        assert_eq!(
            authority("action", "/system/user", Some("add")),
            "action#/system/user:add"
        );
        assert_eq!(
            authority("action", "/system/user", Some("  ")),
            "action#/system/user"
        );
    }
}
