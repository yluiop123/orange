//! Role CRUD. Role ids are `[A-Za-z0-9_-]{2,32}`; a referenced role cannot be
//! deleted, and granting `super` or unknown direct permissions is guarded.

use crate::db::Db;

use crate::auth::AuthUser;
use crate::domain::dto::{
    AddRoleReq, EditRoleReq, PageData, RoleBean, RoleListQuery,
};
use crate::domain::validate::{check_name, check_role_id, check_status, parse_direction, parse_page, parse_size, require_text};
use crate::error::AppError;
use crate::repository::roles as role_repo;

use super::{
    assert_can_assign_permissions, existing_permission_ids, non_blank, pattern,
};

const ROLE_SORT_FIELDS: [&str; 5] = ["id", "name", "status", "createTime", "updateTime"];

fn sort_column(sort: Option<&str>, direction: Option<&str>) -> Result<(&'static str, bool), AppError> {
    let requested = non_blank(sort);
    let explicit = requested
        .map(|value| ROLE_SORT_FIELDS.contains(&value))
        .unwrap_or(false);
    let column = match requested {
        Some("id") if explicit => "id",
        Some("name") if explicit => r#""name""#,
        Some("status") if explicit => "status",
        Some("updateTime") if explicit => "update_time",
        _ => "create_time",
    };
    let parsed_direction = parse_direction(direction)?;
    let descending = !parsed_direction.unwrap_or(explicit);
    Ok((column, descending))
}

pub async fn list(
    pool: &Db,
    query: &RoleListQuery,
) -> Result<PageData<RoleBean>, AppError> {
    let page = parse_page(query.page, 1, 10_000)?;
    let size = parse_size(query.size, 10, 100)?;
    let (column, descending) = sort_column(query.sort.as_deref(), query.direction.as_deref())?;
    // The reference does not annotate `status` for roles: `all` and empty mean
    // no filter, anything else is an equality filter.
    let status = match non_blank(query.status.as_deref()) {
        None => None,
        Some("all") => None,
        Some(value) => Some(value.to_string()),
    };

    let (total, roles) = role_repo::list(
        pool,
        &role_repo::RoleListParams {
            id: pattern(query.id.as_deref()),
            name: pattern(query.name.as_deref()),
            status,
            sort_column: column,
            descending,
            limit: i64::from(size),
            offset: i64::from(page - 1) * i64::from(size),
        },
    )
    .await?;

    let list = roles
        .into_iter()
        .map(|role| RoleBean {
            id: role.id,
            name: role.name,
            status: role.status,
            permissions: None,
            create_time: role.create_time,
            update_time: role.update_time,
        })
        .collect();

    Ok(PageData::new(total, list, page, size))
}

pub async fn get(pool: &Db, id: &str) -> Result<RoleBean, AppError> {
    let role = role_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("角色不存在"))?;
    let permission_ids = role_repo::permission_ids(pool, id).await?;
    Ok(RoleBean {
        id: role.id,
        name: role.name,
        status: role.status,
        permissions: Some(permission_ids),
        create_time: role.create_time,
        update_time: role.update_time,
    })
}

pub async fn create(
    pool: &Db,
    caller: &AuthUser,
    req: &AddRoleReq,
) -> Result<String, AppError> {
    let name = require_text(req.name.as_deref(), "角色名称不能为空")?;
    check_name(&name)?;

    let id = match non_blank(req.id.as_deref()) {
        Some(value) => {
            check_role_id(value)?;
            value.to_string()
        }
        None => uuid::Uuid::new_v4().to_string(),
    };

    if role_repo::exists(pool, &id).await? {
        return Err(AppError::business("角色ID已存在"));
    }

    let permission_ids = req.permissions.clone().unwrap_or_default();
    assert_can_assign_permissions(caller, &permission_ids)?;
    let permission_ids = existing_permission_ids(pool, &permission_ids).await?;

    role_repo::create(pool, &id, Some(&name), &permission_ids).await?;
    Ok(id)
}

pub async fn edit(
    pool: &Db,
    caller: &AuthUser,
    id: &str,
    req: &EditRoleReq,
) -> Result<(), AppError> {
    let role = role_repo::find(pool, id)
        .await?
        .ok_or_else(|| AppError::business("角色不存在"))?;

    let name = match req.name.as_deref() {
        Some(value) => {
            check_name(value)?;
            Some(value.to_string())
        }
        None => role.name.clone(),
    };

    let status = match req.status.as_deref() {
        Some(value) => {
            check_status(value)?;
            value.to_string()
        }
        None => role.status.clone(),
    };

    let permission_ids = match req.permissions.as_ref() {
        Some(values) => {
            assert_can_assign_permissions(caller, values)?;
            Some(existing_permission_ids(pool, values).await?)
        }
        None => None,
    };

    role_repo::update(pool, id, name.as_deref(), &status, permission_ids.as_deref()).await?;
    Ok(())
}

pub async fn delete(pool: &Db, ids: &[String]) -> Result<(), AppError> {
    let mut existing = Vec::new();
    for id in ids {
        if let Some(role) = role_repo::find(pool, id).await? {
            existing.push(role);
        }
    }
    if existing.is_empty() {
        return Err(AppError::business("角色不存在"));
    }

    for role in &existing {
        if role_repo::referenced_by_user(pool, &role.id).await? {
            return Err(AppError::business(format!(
                "角色{}已被用户引用，不能删除",
                role.id
            )));
        }
    }
    for role in &existing {
        role_repo::delete(pool, &role.id).await?;
    }
    Ok(())
}
