//! `/auth/menus`: enabled menu/directory nodes, ordered by code.
//!
//! A node whose parent is disabled or missing disappears with its whole branch
//! instead of being promoted to a root. Action nodes are never returned.

use std::collections::HashMap;

use crate::db::Db;

use crate::domain::dto::MenuInfo;
use crate::domain::entities::Permission;
use crate::error::AppError;
use crate::repository::permissions;

fn build_node(
    id: &str,
    by_id: &HashMap<String, &Permission>,
    children: &HashMap<String, Vec<String>>,
) -> MenuInfo {
    let permission = by_id.get(id).expect("node exists");
    let child_ids = children.get(id).cloned().unwrap_or_default();
    MenuInfo {
        id: permission.id.clone(),
        path: permission.path.clone(),
        kind: permission.kind.clone(),
        name: permission.name.clone(),
        children: child_ids
            .iter()
            .map(|child_id| build_node(child_id, by_id, children))
            .collect(),
    }
}

pub async fn tree(pool: &Db) -> Result<Vec<MenuInfo>, AppError> {
    let all = permissions::all(pool).await?;

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
        .map(|root| build_node(root, &by_id, &children))
        .collect())
}
