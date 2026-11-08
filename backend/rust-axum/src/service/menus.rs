//! `/auth/menus`: enabled menu/directory nodes, ordered by code.
//!
//! A node whose parent is disabled or missing disappears with its whole branch
//! instead of being promoted to a root. Action nodes are never returned.
//!
//! Node names come from `sys_permission_i18n`: the requested locale
//! (case-insensitive), then its language part (`en-US` -> `en`), then the
//! default `sys_permission.name`.

use std::collections::HashMap;

use crate::db::Db;

use crate::domain::dto::MenuInfo;
use crate::domain::entities::{Permission, PermissionI18n};
use crate::error::AppError;
use crate::repository::permissions;

/// Permission id -> lowercase locale tag -> translated name.
type TranslationIndex = HashMap<String, HashMap<String, String>>;

fn translation_index(rows: Vec<PermissionI18n>) -> TranslationIndex {
    let mut index: TranslationIndex = HashMap::new();
    for row in rows {
        index
            .entry(row.permission_id)
            .or_default()
            .insert(row.locale.to_ascii_lowercase(), row.name);
    }
    index
}

fn usable(name: Option<&String>) -> Option<String> {
    name.filter(|value| !value.trim().is_empty()).cloned()
}

/// Exact locale first, then the language part before `-`, then `name`.
fn localized_name(
    permission: &Permission,
    translations: Option<&HashMap<String, String>>,
    locale: Option<&str>,
) -> Option<String> {
    if let Some(locale) = locale.map(str::trim).filter(|value| !value.is_empty()) {
        if let Some(translations) = translations {
            let key = locale.to_ascii_lowercase();
            if let Some(name) = usable(translations.get(&key)) {
                return Some(name);
            }
            let language = key.split('-').next().unwrap_or(key.as_str());
            if language != key.as_str() {
                if let Some(name) = usable(translations.get(language)) {
                    return Some(name);
                }
            }
        }
    }
    permission.name.clone()
}

fn build_node(
    id: &str,
    by_id: &HashMap<String, &Permission>,
    children: &HashMap<String, Vec<String>>,
    translations: &TranslationIndex,
    locale: Option<&str>,
) -> MenuInfo {
    let permission = by_id.get(id).expect("node exists");
    let child_ids = children.get(id).cloned().unwrap_or_default();
    MenuInfo {
        id: permission.id.clone(),
        path: permission.path.clone(),
        kind: permission.kind.clone(),
        name: localized_name(permission, translations.get(id), locale),
        children: child_ids
            .iter()
            .map(|child_id| {
                build_node(child_id, by_id, children, translations, locale)
            })
            .collect(),
    }
}

pub async fn tree(pool: &Db, locale: Option<&str>) -> Result<Vec<MenuInfo>, AppError> {
    let all = permissions::all(pool).await?;
    let translations = translation_index(permissions::all_i18n(pool).await?);

    let by_id: HashMap<String, &Permission> = all
        .iter()
        .filter(|permission| {
            permission.status == "1"
                && (permission.kind == "menu" || permission.kind == "directory")
        })
        .map(|permission| (permission.id.clone(), permission))
        .collect();

    let mut children: HashMap<String, Vec<String>> = HashMap::new();
    for permission in by_id.values() {
        let parent_id = permission
            .parent_id
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        if let Some(parent_id) = parent_id {
            if by_id.contains_key(parent_id) {
                children
                    .entry(parent_id.to_string())
                    .or_default()
                    .push(permission.id.clone());
            }
        }
    }
    for child_ids in children.values_mut() {
        child_ids.sort();
    }

    let mut roots: Vec<String> = by_id
        .values()
        .filter(|permission| {
            permission
                .parent_id
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .is_none()
        })
        .map(|permission| permission.id.clone())
        .collect();
    roots.sort();

    Ok(roots
        .iter()
        .map(|root| build_node(root, &by_id, &children, &translations, locale))
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn permission(name: Option<&str>) -> Permission {
        Permission {
            id: "0000".to_string(),
            name: name.map(str::to_string),
            path: "/dashboard".to_string(),
            action: None,
            kind: "menu".to_string(),
            status: "1".to_string(),
            parent_id: None,
            create_time: None,
            update_time: None,
        }
    }

    fn translations(pairs: &[(&str, &str)]) -> HashMap<String, String> {
        // The index lowercases locale tags when it is built.
        pairs
            .iter()
            .map(|(locale, name)| (locale.to_ascii_lowercase(), name.to_string()))
            .collect()
    }

    #[test]
    fn exact_locale_wins_case_insensitively() {
        let node = permission(Some("仪表盘"));
        let map = translations(&[("en-us", "US Dashboard"), ("en", "Dashboard")]);

        assert_eq!(
            localized_name(&node, Some(&map), Some("en-US")),
            Some("US Dashboard".to_string())
        );
        assert_eq!(
            localized_name(&node, Some(&map), Some("EN-us")),
            Some("US Dashboard".to_string())
        );
    }

    #[test]
    fn language_part_is_the_second_choice() {
        let node = permission(Some("仪表盘"));
        let map = translations(&[("en-us", "US Dashboard"), ("en", "Dashboard")]);

        assert_eq!(
            localized_name(&node, Some(&map), Some("en-GB")),
            Some("Dashboard".to_string())
        );
    }

    #[test]
    fn default_name_is_the_final_fallback() {
        let node = permission(Some("仪表盘"));
        let map = translations(&[("en", "Dashboard")]);

        assert_eq!(
            localized_name(&node, Some(&map), Some("fr")),
            Some("仪表盘".to_string())
        );
        assert_eq!(
            localized_name(&node, Some(&map), None),
            Some("仪表盘".to_string())
        );
        assert_eq!(
            localized_name(&node, None, Some("en")),
            Some("仪表盘".to_string())
        );
    }

    #[test]
    fn blank_translation_falls_through() {
        let node = permission(Some("仪表盘"));
        let map = translations(&[("en-us", "   "), ("en", "Dashboard")]);

        assert_eq!(
            localized_name(&node, Some(&map), Some("en-US")),
            Some("Dashboard".to_string())
        );
    }

    #[test]
    fn translation_index_lowercases_locale_tags() {
        let index = translation_index(vec![PermissionI18n {
            permission_id: "0000".to_string(),
            locale: "en-US".to_string(),
            name: "Dashboard".to_string(),
        }]);

        assert_eq!(
            index["0000"]["en-us"],
            "Dashboard".to_string()
        );
    }
}
