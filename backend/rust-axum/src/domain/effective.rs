//! Effective permissions: enabled roles union direct grants, minus disabled.
//!
//! This is the single place where visibility/RBAC filtering happens. The
//! middleware, `/auth/user-info` and unit tests all derive from it.

use std::collections::HashSet;

use crate::domain::entities::{Permission, Role};
use crate::domain::permission_shape::authority;

pub const STATUS_ENABLE: &str = "1";
pub const STATUS_DISABLE: &str = "0";

#[derive(Debug, Clone)]
pub struct RolePermission {
    pub role_id: String,
    pub permission: Permission,
}

#[derive(Debug, Clone, Default)]
pub struct EffectivePermissions {
    pub roles: Vec<Role>,
    pub role_permissions: Vec<RolePermission>,
    pub direct_permissions: Vec<Permission>,
    /// Enabled permissions from roles and direct grants, de-duplicated by id.
    pub permissions: Vec<Permission>,
    /// Permission ids and `type#path[:action]` strings.
    pub authorities: HashSet<String>,
}

impl EffectivePermissions {
    pub fn compute(
        roles: Vec<Role>,
        role_permissions: Vec<(String, Permission)>,
        direct_permissions: Vec<Permission>,
    ) -> Self {
        let active_roles: Vec<Role> = roles
            .into_iter()
            .filter(|role| role.status != STATUS_DISABLE)
            .collect();

        let active_role_ids: HashSet<String> = active_roles
            .iter()
            .map(|role| role.id.clone())
            .collect();

        let collected: Vec<RolePermission> = role_permissions
            .into_iter()
            .filter(|(role_id, permission)| {
                active_role_ids.contains(role_id)
                    && permission.status != STATUS_DISABLE
            })
            .map(|(role_id, permission)| RolePermission {
                role_id,
                permission,
            })
            .collect();

        let direct: Vec<Permission> = direct_permissions
            .into_iter()
            .filter(|permission| permission.status != STATUS_DISABLE)
            .collect();

        let mut seen: HashSet<String> = HashSet::new();
        let mut permissions: Vec<Permission> = Vec::new();
        for item in &collected {
            if seen.insert(item.permission.id.clone()) {
                permissions.push(item.permission.clone());
            }
        }
        for permission in &direct {
            if seen.insert(permission.id.clone()) {
                permissions.push(permission.clone());
            }
        }

        let mut authorities = HashSet::new();
        for permission in &permissions {
            authorities.insert(permission.id.clone());
            authorities.insert(authority(
                &permission.kind,
                &permission.path,
                permission.action.as_deref(),
            ));
        }

        Self {
            roles: active_roles,
            role_permissions: collected,
            direct_permissions: direct,
            permissions,
            authorities,
        }
    }

    /// The `super` role can only be granted by a `super`; role ids are checked
    /// here so callers never rebuild the rule.
    pub fn is_super(&self) -> bool {
        self.roles.iter().any(|role| role.id == "super")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn role(id: &str, status: &str) -> Role {
        Role {
            id: id.to_string(),
            name: Some(id.to_string()),
            status: status.to_string(),
            create_time: None,
            update_time: None,
        }
    }

    fn permission(id: &str, kind: &str, path: &str, action: Option<&str>, status: &str) -> Permission {
        Permission {
            id: id.to_string(),
            name: Some(id.to_string()),
            path: path.to_string(),
            action: action.map(str::to_string),
            kind: kind.to_string(),
            status: status.to_string(),
            parent_id: None,
            create_time: None,
            update_time: None,
        }
    }

    #[test]
    fn disabled_roles_are_dropped() {
        let effective = EffectivePermissions::compute(
            vec![role("super", "1"), role("user", "0")],
            vec![
                (
                    "super".to_string(),
                    permission("000500", "menu", "/system/user", None, "1"),
                ),
                (
                    "user".to_string(),
                    permission("0000", "directory", "/dashboard", None, "1"),
                ),
            ],
            vec![],
        );

        assert_eq!(effective.roles.len(), 1);
        assert_eq!(effective.role_permissions.len(), 1);
        assert!(effective.is_super());
        assert!(effective.authorities.contains("000500"));
        assert!(!effective.authorities.contains("0000"));
    }

    #[test]
    fn disabled_permissions_are_dropped() {
        let effective = EffectivePermissions::compute(
            vec![role("admin", "1")],
            vec![
                (
                    "admin".to_string(),
                    permission("000500", "menu", "/system/user", None, "1"),
                ),
                (
                    "admin".to_string(),
                    permission("00050000", "action", "/system/user", Some("add"), "0"),
                ),
            ],
            vec![permission("0000", "directory", "/dashboard", None, "0")],
        );

        assert_eq!(effective.permissions.len(), 1);
        assert!(effective.authorities.contains("menu#/system/user"));
        assert!(!effective.authorities.contains("action#/system/user:add"));
        assert!(effective.direct_permissions.is_empty());
    }

    #[test]
    fn direct_grants_are_unioned_and_deduplicated() {
        let shared = permission("000500", "menu", "/system/user", None, "1");
        let effective = EffectivePermissions::compute(
            vec![role("admin", "1")],
            vec![("admin".to_string(), shared.clone())],
            vec![
                shared,
                permission("0000", "directory", "/dashboard", None, "1"),
            ],
        );

        assert_eq!(effective.permissions.len(), 2);
        assert_eq!(effective.direct_permissions.len(), 2);
        assert!(effective.authorities.contains("menu#/system/user"));
        assert!(effective.authorities.contains("directory#/dashboard"));
    }

    #[test]
    fn action_authority_includes_action() {
        let effective = EffectivePermissions::compute(
            vec![],
            vec![],
            vec![permission(
                "00050000",
                "action",
                "/system/user",
                Some("add"),
                "1",
            )],
        );

        assert!(effective.authorities.contains("00050000"));
        assert!(effective
            .authorities
            .contains("action#/system/user:add"));
        assert!(!effective.authorities.contains("action#/system/user"));
    }

    #[test]
    fn role_permissions_keep_the_owning_role() {
        let effective = EffectivePermissions::compute(
            vec![role("admin", "1"), role("user", "1")],
            vec![
                (
                    "admin".to_string(),
                    permission("000500", "menu", "/system/user", None, "1"),
                ),
                (
                    "user".to_string(),
                    permission("000500", "menu", "/system/user", None, "1"),
                ),
            ],
            vec![],
        );

        assert_eq!(effective.role_permissions.len(), 2);
        assert_eq!(effective.permissions.len(), 1);
        assert_eq!(effective.role_permissions[0].role_id, "admin");
    }
}
