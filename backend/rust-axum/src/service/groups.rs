//! Group tree rules: code shape, parent existence, disable guard,
//! reference guard and deepest-first delete.

use crate::db::Db;

use crate::domain::dto::{AddChildGroupReq, EditGroupReq, GroupBean, GroupListQuery};
use crate::domain::entities::Group;
use crate::domain::tree::{
    delete_order, has_enabled_descendant, subtree_ids, with_ancestor_ids,
};
use crate::domain::tree_code::GROUP_CODE;
use crate::domain::validate::{check_status, require_text};
use crate::error::AppError;
use crate::repository::groups as group_repo;

use super::{non_blank, pattern, status_filter};

pub fn to_bean(group: &Group) -> GroupBean {
    GroupBean {
        id: group.id.clone(),
        name: group.name.clone(),
        status: group.status.clone(),
        parent_id: group.parent_id.clone(),
        create_time: group.create_time,
        update_time: group.update_time,
    }
}

pub async fn list(pool: &Db, query: &GroupListQuery) -> Result<Vec<GroupBean>, AppError> {
    let status = status_filter(query.status.as_deref())?;

    let id_pattern = match non_blank(query.id.as_deref()) {
        Some(value) => {
            if !value.chars().all(|ch| ch.is_ascii_alphanumeric()) {
                return Err(AppError::param("只能包含数字和大小写字母"));
            }
            Some(crate::domain::validate::like_prefix(value))
        }
        None => None,
    };
    let name_pattern = pattern(query.name.as_deref());
    let text_filter = id_pattern.is_some() || name_pattern.is_some();

    let matched = group_repo::list(
        pool,
        &group_repo::GroupListParams {
            id: id_pattern,
            name: name_pattern,
            status,
        },
    )
    .await?;

    if !text_filter {
        return Ok(matched.iter().map(to_bean).collect());
    }

    let all = group_repo::all(pool).await?;
    let matched_ids: Vec<String> = matched.iter().map(|group| group.id.clone()).collect();
    let ids = with_ancestor_ids(&all, &matched_ids);
    let mut result: Vec<Group> = all
        .into_iter()
        .filter(|group| ids.contains(&group.id))
        .collect();
    result.sort_by(|left, right| left.id.cmp(&right.id));
    Ok(result.iter().map(to_bean).collect())
}

pub async fn get(pool: &Db, id: &str) -> Result<GroupBean, AppError> {
    let group = group_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("组织不存在"))?;
    Ok(to_bean(&group))
}

pub async fn create(pool: &Db, req: &AddChildGroupReq) -> Result<GroupBean, AppError> {
    let id = require_text(req.id.as_deref(), "分组ID不能为空")?;
    if id.chars().count() < 2 || !id.chars().all(|ch| ch.is_ascii_digit()) {
        return Err(AppError::param("组织编码只能包含数字"));
    }
    let name = require_text(req.name.as_deref(), "分组名称不能为空")?;
    let parent_id = non_blank(req.parent_id.as_deref());

    GROUP_CODE.validate(&id, parent_id)?;

    if group_repo::exists(pool, &id).await? {
        return Err(AppError::business("组织编码已存在"));
    }
    if let Some(parent_id) = parent_id {
        if !group_repo::exists(pool, parent_id).await? {
            return Err(AppError::business("父组织不存在"));
        }
    }

    group_repo::create(pool, &id, Some(&name), parent_id).await?;
    let group = group_repo::find(pool, &id)
        .await?
        .ok_or_else(|| AppError::business("组织不存在"))?;
    Ok(to_bean(&group))
}

pub async fn edit(pool: &Db, id: &str, req: &EditGroupReq) -> Result<(), AppError> {
    let group = group_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("组织不存在"))?;

    let name = match req.name.as_deref() {
        Some(value) => {
            let value = value.trim();
            if value.is_empty() {
                return Err(AppError::param("组织名称不能为空"));
            }
            Some(value.to_string())
        }
        None => group.name.clone(),
    };

    let status = match req.status.as_deref() {
        Some(value) => {
            check_status(value)?;
            if group.status != "0" && value == "0" {
                let all = group_repo::all(pool).await?;
                if has_enabled_descendant(&all, &group.id, |node| node.status == "1") {
                    return Err(AppError::conflict("请先禁用子组织"));
                }
            }
            value.to_string()
        }
        None => group.status.clone(),
    };

    group_repo::update(pool, id, name.as_deref(), &status).await?;
    Ok(())
}

pub async fn delete(pool: &Db, ids: &[String]) -> Result<(), AppError> {
    if ids.is_empty() {
        return Ok(());
    }
    let all = group_repo::all(pool).await?;

    for id in ids {
        if !all.iter().any(|group| &group.id == id) {
            return Err(AppError::business("组织不存在"));
        }
    }

    let subtree = subtree_ids(&all, ids);
    for group_id in &subtree {
        if group_repo::has_users(pool, group_id).await? {
            return Err(AppError::business("组织或其子组织下有用户，不能删除"));
        }
    }

    for group_id in delete_order(&all, &subtree) {
        group_repo::delete(pool, &group_id).await?;
    }
    Ok(())
}
