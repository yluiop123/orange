//! Business code policy for the two tree resources.
//!
//! Roots are fixed-width; a child code is the parent code plus one segment and
//! starts with the parent code. Codes are immutable once created.

use crate::error::AppError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TreeCodePolicy {
    pub root_length: usize,
    pub segment_length: usize,
    pub label: &'static str,
}

pub const GROUP_CODE: TreeCodePolicy = TreeCodePolicy {
    root_length: 2,
    segment_length: 2,
    label: "组织",
};

pub const PERMISSION_CODE: TreeCodePolicy = TreeCodePolicy {
    root_length: 4,
    segment_length: 2,
    label: "权限",
};

impl TreeCodePolicy {
    pub fn validate(&self, id: &str, parent_id: Option<&str>) -> Result<(), AppError> {
        if id.trim().is_empty() {
            return Err(AppError::validation(format!(
                "{}编码不能为空",
                self.label
            )));
        }
        if !id.chars().all(|ch| ch.is_ascii_digit()) {
            return Err(AppError::validation(format!(
                "{}编码只能包含数字",
                self.label
            )));
        }

        let parent = parent_id.map(str::trim).filter(|value| !value.is_empty());
        match parent {
            None => {
                if id.chars().count() != self.root_length {
                    return Err(AppError::validation(format!(
                        "根{}编码长度必须为{}",
                        self.label, self.root_length
                    )));
                }
            }
            Some(parent) => {
                let expected = parent.chars().count() + self.segment_length;
                if id.chars().count() != expected {
                    return Err(AppError::validation(format!(
                        "{}编码长度必须为{}",
                        self.label, expected
                    )));
                }
                if !id.starts_with(parent) {
                    return Err(AppError::validation(format!(
                        "{}编码必须以{}开头",
                        self.label, parent
                    )));
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_group_root_and_children() {
        assert!(GROUP_CODE.validate("00", None).is_ok());
        assert!(GROUP_CODE.validate("0001", Some("00")).is_ok());
        assert!(GROUP_CODE.validate("000301", Some("0003")).is_ok());
    }

    #[test]
    fn rejects_wrong_root_length() {
        assert!(GROUP_CODE.validate("0", None).is_err());
        assert!(GROUP_CODE.validate("000", None).is_err());
        assert!(PERMISSION_CODE.validate("000", None).is_err());
        assert!(PERMISSION_CODE.validate("0000", None).is_ok());
    }

    #[test]
    fn rejects_non_digits() {
        assert!(GROUP_CODE.validate("0a", None).is_err());
        assert!(PERMISSION_CODE.validate("000x", None).is_err());
    }

    #[test]
    fn rejects_wrong_child_length_and_prefix() {
        assert!(GROUP_CODE.validate("0001", Some("00")).is_ok());
        assert!(GROUP_CODE.validate("001", Some("00")).is_err());
        assert!(GROUP_CODE.validate("0101", Some("00")).is_err());
        assert!(GROUP_CODE.validate("00 01", Some("00")).is_err());
    }

    #[test]
    fn blank_parent_means_root() {
        assert!(GROUP_CODE.validate("00", Some("   ")).is_ok());
        assert!(GROUP_CODE.validate("0001", Some("   ")).is_err());
    }

    #[test]
    fn rejects_blank_code() {
        assert!(GROUP_CODE.validate("", None).is_err());
        assert!(GROUP_CODE.validate("   ", None).is_err());
    }
}
