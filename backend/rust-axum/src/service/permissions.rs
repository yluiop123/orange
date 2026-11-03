//! Permission tree rules. Identity is `(type, path, action)` with a NULL action
//! treated as a single value; action nodes cannot have children.

use std::collections::HashSet;

use sqlx::PgPool;

use crate::domain::dto::{
    AddChildPermissionReq, EditPermissionReq, PermissionBean, PermissionListQuery,
};
use crate::domain::entities::Permission;
use crate::domain::permission_shape::{
    normalise_action, validate_shape, TYPE_ACTION, TYPE_DIRECTORY, TYPE_MENU,
};
use crate::domain::tree::{
    delete_order, has_enabled_descendant, subtree_ids, with_ancestor_ids,
};
use crate::domain::tree_code::PERMISSION_CODE;
use crate::domain::validate::{check_path, check_path_length, check_status, require_text};
use crate::error::AppError;
use crate::repository::permissions as permission_repo;

use super::{non_blank, pattern, status_filter};

pub fn to_bean(permission: &Permission) -> PermissionBean {
    PermissionBean {
        id: permission.id.clone(),
        name: permission.name.clone(),
        path: permission.path.clone(),
        action: permission.action.clone(),
        kind: permission.kind.clone(),
        status: permission.status.clone(),
        parent_id: permission.parent_id.clone(),
        create_time: permission.create_time,
        update_time: permission.update_time,
    }
}

fn type_filter(value: Option<&str>) -> Result<Option<String>, AppError> {
    match value.map(str::trim) {
        None | Some("") | Some("all") => Ok(None),
        Some(kind)
            if kind == TYPE_MENU || kind == TYPE_DIRECTORY || kind == TYPE_ACTION =>
        {
            Ok(Some(kind.to_string()))
        }
        Some(_) => Err(AppError::param(
            "权限类型只能是 menu、directory、action 或 all",
        )),
    }
}

pub async fn list(
    pool: &PgPool,
    query: &PermissionListQuery,
) -> Result<Vec<PermissionBean>, AppError> {
    let status = status_filter(query.status.as_deref())?;
    let kind = type_filter(query.kind.as_deref())?;

    let id_pattern = pattern(query.id.as_deref());
    let name_pattern = pattern(query.name.as_deref());
    let path_pattern = pattern(query.path.as_deref());
    let text_filter = id_pattern.is_some()
        || name_pattern.is_some()
        || path_pattern.is_some()
        || kind.is_some();

    let matched = permission_repo::list(
        pool,
        &permission_repo::PermissionListParams {
            id: id_pattern,
            name: name_pattern,
            path: path_pattern,
            status,
            kind,
        },
    )
    .await?;

    if !text_filter {
        return Ok(matched.iter().map(to_bean).collect());
    }

    let all = permission_repo::all(pool).await?;
    let matched_ids: Vec<String> = matched.iter().map(|permission| permission.id.clone()).collect();
    let ids = with_ancestor_ids(&all, &matched_ids);
    let mut result: Vec<Permission> = all
        .into_iter()
        .filter(|permission| ids.contains(&permission.id))
        .collect();
    result.sort_by(|left, right| left.id.cmp(&right.id));
    Ok(result.iter().map(to_bean).collect())
}

pub async fn get(pool: &PgPool, id: &str) -> Result<PermissionBean, AppError> {
    let permission = permission_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("权限不存在"))?;
    Ok(to_bean(&permission))
}

pub async fn create(
    pool: &PgPool,
    req: &AddChildPermissionReq,
) -> Result<PermissionBean, AppError> {
    let id = require_text(req.id.as_deref(), "权限编码不能为空")?;
    if id.chars().count() < 2 || !id.chars().all(|ch| ch.is_ascii_digit()) {
        return Err(AppError::param("权限编码只能包含数字"));
    }
    let name = require_text(req.name.as_deref(), "权限名称不能为空")?;
    let raw_path = require_text(req.path.as_deref(), "权限路径不能为空")?;
    let path = raw_path.trim().to_string();
    let kind = require_text(req.kind.as_deref(), "权限类型不能为空")?;
    let parent_id = non_blank(req.parent_id.as_deref());
    let action = normalise_action(req.action.as_deref());

    PERMISSION_CODE.validate(&id, parent_id)?;
    validate_shape(&kind, action.as_deref())?;

    if permission_repo::exists(pool, &id).await? {
        return Err(AppError::business("权限编码已存在"));
    }
    if let Some(parent_id) = parent_id {
        let parent = permission_repo::find(pool, parent_id)
            .await?
            .ok_or_else(|| AppError::business("父权限不存在"))?;
        if parent.kind == TYPE_ACTION {
            return Err(AppError::business("动作权限不能添加子节点"));
        }
    }
    if permission_repo::identity_exists(pool, &kind, &path, action.as_deref(), None).await? {
        return Err(AppError::business("权限已存在"));
    }

    let permission = Permission {
        id,
        name: Some(name),
        path,
        action,
        kind,
        status: "1".to_string(),
        parent_id: parent_id.map(str::to_string),
        create_time: None,
        update_time: None,
    };
    permission_repo::create(pool, &permission).await?;

    let saved = permission_repo::find(pool, &permission.id)
        .await?
        .ok_or_else(|| AppError::business("权限不存在"))?;
    Ok(to_bean(&saved))
}

pub async fn edit(
    pool: &PgPool,
    id: &str,
    req: &EditPermissionReq,
) -> Result<(), AppError> {
    let mut permission = permission_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("权限不存在"))?;

    let name = match req.name.as_deref() {
        Some(value) => {
            let length = value.trim().chars().count();
            if !(2..=50).contains(&length) {
                return Err(AppError::param("权限名称长度需在 2-50 之间"));
            }
            Some(value.to_string())
        }
        None => permission.name.clone(),
    };

    let path = match req.path.as_deref() {
        Some(value) => {
            check_path_length(value)?;
            check_path(value)?;
            value.trim().to_string()
        }
        None => {
            let current = permission.path.trim().to_string();
            check_path(&current)?;
            current
        }
    };

    let kind = match req.kind.as_deref() {
        Some(value) => {
            if !crate::domain::permission_shape::is_valid_type(value) {
                return Err(AppError::param(
                    "权限类型只能是 menu、action 或 directory",
                ));
            }
            value.to_string()
        }
        None => permission.kind.clone(),
    };

    let action = match req.action.as_deref() {
        Some(value) => normalise_action(Some(value)),
        None => permission.action.clone(),
    };

    validate_shape(&kind, action.as_deref())?;
    if permission_repo::identity_exists(pool, &kind, &path, action.as_deref(), Some(id)).await? {
        return Err(AppError::business("权限已存在"));
    }

    let status = match req.status.as_deref() {
        Some(value) => {
            check_status(value)?;
            if permission.status != "0" && value == "0" {
                let all = permission_repo::all(pool).await?;
                if has_enabled_descendant(&all, &permission.id, |node| node.status == "1") {
                    return Err(AppError::business("请先禁用子权限"));
                }
            }
            value.to_string()
        }
        None => permission.status.clone(),
    };

    permission.name = name;
    permission.path = path;
    permission.kind = kind;
    permission.action = action;
    permission.status = status;

    permission_repo::update(pool, &permission).await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, ids: &[String]) -> Result<(), AppError> {
    if ids.is_empty() {
        return Ok(());
    }
    let all = permission_repo::all(pool).await?;

    for id in ids {
        if !all.iter().any(|permission| &permission.id == id) {
            return Err(AppError::business("权限不存在"));
        }
    }

    let subtree: HashSet<String> = subtree_ids(&all, ids);
    for permission_id in &subtree {
        if permission_repo::referenced_by_role(pool, permission_id).await? {
            return Err(AppError::business("权限已被角色引用，不能删除"));
        }
        if permission_repo::referenced_by_user(pool, permission_id).await? {
            return Err(AppError::business("权限已被用户引用，不能删除"));
        }
    }

    for permission_id in delete_order(&all, &subtree) {
        permission_repo::delete(pool, &permission_id).await?;
    }
    Ok(())
}
