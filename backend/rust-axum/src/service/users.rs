//! User CRUD, forced password change, temp passwords and the last-super guard.

use crate::db::Db;

use crate::auth::lockout::user_key;
use crate::auth::password;
use crate::auth::AuthUser;
use crate::domain::dto::{
    AddUserReq, EditUserReq, PageData, PermissionInfo, RoleInfo, UserBean, UserInfo,
    UserListQuery, UserRoleBean,
};
use crate::domain::effective::EffectivePermissions;
use crate::domain::entities::User;
use crate::domain::validate::{
    check_email, check_name, check_new_password, check_phone, check_status, check_username,
    like_prefix, parse_direction, parse_page, parse_size, require_text,
};
use crate::error::AppError;
use crate::repository::{groups, security, users as user_repo};

use super::{
    assert_can_assign_permissions, assert_can_assign_roles, existing_permission_ids,
    existing_role_ids, non_blank, pattern, status_filter,
};

const USER_SORT_FIELDS: [&str; 7] = [
    "id",
    "name",
    "username",
    "email",
    "status",
    "createTime",
    "updateTime",
];

fn sort_column(
    sort: Option<&str>,
    direction: Option<&str>,
) -> Result<(&'static str, bool), AppError> {
    let requested = non_blank(sort);
    let explicit = requested
        .map(|value| USER_SORT_FIELDS.contains(&value))
        .unwrap_or(false);
    let column = match requested {
        Some("id") if explicit => "id",
        Some("name") if explicit => r#""name""#,
        Some("username") if explicit => "username",
        Some("email") if explicit => "email",
        Some("status") if explicit => "status",
        Some("updateTime") if explicit => "update_time",
        _ => "create_time",
    };
    let parsed_direction = parse_direction(direction)?;
    let descending = !parsed_direction.unwrap_or(explicit);
    Ok((column, descending))
}

fn to_bean(user: &User, group_name: String) -> UserBean {
    UserBean {
        id: user.id.clone(),
        name: user.name.clone(),
        username: user.username.clone(),
        email: user.email.clone(),
        group_id: user.group_id.clone(),
        group_name: Some(group_name),
        phone: user.phone.clone(),
        status: user.status.clone(),
        create_time: user.create_time,
        update_time: user.update_time,
        roles: Vec::new(),
        permissions: Vec::new(),
    }
}

async fn group_name(pool: &Db, group_id: Option<&str>) -> Result<String, AppError> {
    match group_id.map(str::trim).filter(|value| !value.is_empty()) {
        Some(id) => Ok(groups::find(pool, id)
            .await?
            .and_then(|group| group.name)
            .unwrap_or_default()),
        None => Ok(String::new()),
    }
}

pub async fn list(
    pool: &Db,
    query: &UserListQuery,
) -> Result<PageData<UserBean>, AppError> {
    let page = parse_page(query.page, 1, 10_000)?;
    let size = parse_size(query.size, 10, 100)?;
    let (column, descending) = sort_column(query.sort.as_deref(), query.direction.as_deref())?;
    let status = status_filter(query.status.as_deref())?;

    let keyword = query
        .keyword
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(like_prefix);
    let group_id = pattern(query.group_id.as_deref());

    let (total, users) = user_repo::list(
        pool,
        &user_repo::UserListParams {
            keyword,
            status,
            group_id,
            sort_column: column,
            descending,
            limit: i64::from(size),
            offset: i64::from(page - 1) * i64::from(size),
        },
    )
    .await?;

    let mut group_names = std::collections::HashMap::new();
    for group in groups::all(pool).await? {
        group_names.insert(group.id, group.name.unwrap_or_default());
    }

    let list = users
        .iter()
        .map(|user| {
            let name = user
                .group_id
                .as_ref()
                .and_then(|group_id| group_names.get(group_id))
                .cloned()
                .unwrap_or_default();
            to_bean(user, name)
        })
        .collect();

    Ok(PageData::new(total, list, page, size))
}

pub async fn get(pool: &Db, id: &str) -> Result<UserBean, AppError> {
    let user = user_repo::find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::business("用户不存在"))?;

    let group_name_value = group_name(pool, user.group_id.as_deref()).await?;
    let mut bean = to_bean(&user, group_name_value);

    let assigned_roles = user_repo::roles_for_user(pool, &user.id).await?;
    bean.roles = assigned_roles
        .into_iter()
        .map(|role| UserRoleBean {
            id: role.id,
            name: role.name,
        })
        .collect();

    bean.permissions = user_repo::direct_permissions_for_user(pool, &user.id)
        .await?
        .into_iter()
        .map(|permission| permission.id)
        .collect();

    Ok(bean)
}

pub async fn create(
    pool: &Db,
    caller: &AuthUser,
    req: &AddUserReq,
) -> Result<String, AppError> {
    let name = require_text(req.name.as_deref(), "用户姓名不能为空")?;
    check_name(&name)?;

    let username = req
        .username
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| AppError::param("用户名不能为空"))?
        .to_string();
    check_username(&username)?;

    let email = require_text(req.email.as_deref(), "邮箱不能为空")?;
    check_email(&email)?;

    let group_id = require_text(req.group_id.as_deref(), "用户组不能为空")?;
    if !groups::exists(pool, &group_id).await? {
        return Err(AppError::business("组织不存在"));
    }

    let phone = require_text(req.phone.as_deref(), "手机号不能为空")?;
    check_phone(&phone)?;

    let status = match req.status.as_deref() {
        Some(value) => {
            check_status(value)?;
            value.to_string()
        }
        None => "1".to_string(),
    };

    if user_repo::exists_username(pool, &username).await? {
        return Err(AppError::business("用户名已存在"));
    }

    let role_ids = req.roles.clone().unwrap_or_default();
    let permission_ids = req.permissions.clone().unwrap_or_default();
    assert_can_assign_roles(caller, &role_ids)?;
    assert_can_assign_permissions(caller, &permission_ids)?;
    let role_ids = existing_role_ids(pool, &role_ids).await?;
    let permission_ids = existing_permission_ids(pool, &permission_ids).await?;

    let temp_password = password::generate_temp_password();
    let password_hash = password::hash(temp_password.clone()).await?;

    let user = user_repo::NewUser {
        id: uuid::Uuid::new_v4().to_string(),
        name: Some(name),
        username,
        email: Some(email),
        group_id: Some(group_id),
        phone: Some(phone),
        status,
        password: password_hash,
    };
    user_repo::create(pool, &user, &role_ids, &permission_ids).await?;

    Ok(temp_password)
}

pub async fn edit(
    pool: &Db,
    caller: &AuthUser,
    id: &str,
    req: &EditUserReq,
) -> Result<(), AppError> {
    let user = user_repo::find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::business("用户不存在"))?;

    if let Some(username) = req.username.as_deref() {
        check_username(username)?;
        if username != user.username.as_str() {
            return Err(AppError::business("用户名创建后不可修改"));
        }
    }

    let name = match req.name.as_deref() {
        Some(value) => {
            check_name(value)?;
            Some(value.to_string())
        }
        None => user.name.clone(),
    };

    let email = match req.email.as_deref() {
        Some(value) => {
            check_email(value)?;
            Some(value.to_string())
        }
        None => user.email.clone(),
    };

    let group_id = match req.group_id.as_deref() {
        Some(value) => {
            let value = value.trim();
            if value.is_empty() || !groups::exists(pool, value).await? {
                return Err(AppError::business("组织不存在"));
            }
            Some(value.to_string())
        }
        None => user.group_id.clone(),
    };

    let phone = match req.phone.as_deref() {
        Some(value) => {
            check_phone(value)?;
            Some(value.to_string())
        }
        None => user.phone.clone(),
    };

    let status = match req.status.as_deref() {
        Some(value) => {
            check_status(value)?;
            value.to_string()
        }
        None => user.status.clone(),
    };

    let disabling = user.status != "0" && status == "0";
    if disabling {
        assert_not_self(caller, &user.id, "禁用")?;
        assert_not_last_super(pool, &user, "禁用").await?;
    }

    let role_ids = match req.roles.as_ref() {
        Some(values) => {
            assert_can_assign_roles(caller, values)?;
            Some(existing_role_ids(pool, values).await?)
        }
        None => None,
    };
    let permission_ids = match req.permissions.as_ref() {
        Some(values) => {
            assert_can_assign_permissions(caller, values)?;
            Some(existing_permission_ids(pool, values).await?)
        }
        None => None,
    };

    let token_version = if disabling {
        user.token_version + 1
    } else {
        user.token_version
    };

    let update = user_repo::UserUpdate {
        id: user.id.clone(),
        name,
        email,
        group_id,
        phone,
        status,
        token_version,
    };
    user_repo::update(
        pool,
        &update,
        role_ids.as_deref(),
        permission_ids.as_deref(),
    )
    .await?;
    Ok(())
}

pub async fn edit_status(
    pool: &Db,
    caller: &AuthUser,
    id: &str,
    status: &str,
) -> Result<(), AppError> {
    let req = EditUserReq {
        name: None,
        username: None,
        email: None,
        group_id: None,
        phone: None,
        status: Some(status.to_string()),
        roles: None,
        permissions: None,
    };
    edit(pool, caller, id, &req).await
}

pub async fn reset_password(
    pool: &Db,
    caller: &AuthUser,
    id: &str,
) -> Result<String, AppError> {
    let user = user_repo::find_by_id(pool, id)
        .await?
        .ok_or_else(|| AppError::business("用户不存在"))?;

    if user_repo::has_role(pool, &user.id, "super").await? && !caller.is_super() {
        return Err(AppError::business("无权重置超级管理员密码"));
    }

    let temp_password = password::generate_temp_password();
    let password_hash = password::hash(temp_password.clone()).await?;
    user_repo::set_password(
        pool,
        &user.id,
        &password_hash,
        true,
        user.token_version + 1,
    )
    .await?;
    security::clear_attempt(pool, &user_key(&user.username)).await?;

    Ok(temp_password)
}

pub async fn delete(
    pool: &Db,
    caller: &AuthUser,
    ids: &[String],
) -> Result<(), AppError> {
    let mut existing = Vec::new();
    for id in ids {
        if let Some(user) = user_repo::find_by_id(pool, id).await? {
            existing.push(user);
        }
    }
    if existing.is_empty() {
        return Err(AppError::business("用户不存在"));
    }

    let enabled_supers = user_repo::count_enabled_supers(pool).await?;
    let mut deleting_supers = 0i64;
    for user in &existing {
        if user.status != "0" && user_repo::has_role(pool, &user.id, "super").await? {
            deleting_supers += 1;
        }
    }
    if deleting_supers > 0 && enabled_supers - deleting_supers < 1 {
        return Err(AppError::business("系统至少需要保留一个启用的超级管理员"));
    }

    for user in &existing {
        assert_not_self(caller, &user.id, "删除")?;
    }
    for user in &existing {
        user_repo::delete(pool, &user.id).await?;
    }
    Ok(())
}

pub async fn change_password(
    pool: &Db,
    username: &str,
    old_password: &str,
    new_password: &str,
) -> Result<(), AppError> {
    check_new_password(new_password)?;

    let user = user_repo::find_by_username(pool, username)
        .await?
        .ok_or_else(|| AppError::business("用户不存在"))?;

    let current_hash = user.password.clone().unwrap_or_default();
    if !password::verify(old_password.to_string(), current_hash.clone()).await {
        return Err(AppError::business("原密码错误"));
    }
    if password::verify(new_password.to_string(), current_hash).await {
        return Err(AppError::business("新密码不能与原密码相同"));
    }

    let password_hash = password::hash(new_password.to_string()).await?;
    user_repo::set_password(pool, &user.id, &password_hash, false, user.token_version + 1).await?;
    security::clear_attempt(pool, &user_key(&user.username)).await?;
    Ok(())
}

pub async fn user_info(pool: &Db, username: &str) -> Result<UserInfo, AppError> {
    let user = user_repo::find_by_username(pool, username)
        .await?
        .ok_or_else(|| AppError::business("用户不存在"))?;

    let group_name_value = group_name(pool, user.group_id.as_deref()).await?;

    let assigned_roles = user_repo::roles_for_user(pool, &user.id).await?;
    let role_permission_rows = user_repo::role_permissions_for_user(pool, &user.id).await?;
    let direct_permissions = user_repo::direct_permissions_for_user(pool, &user.id).await?;
    let effective = EffectivePermissions::compute(
        assigned_roles,
        role_permission_rows,
        direct_permissions,
    );

    let roles = effective
        .roles
        .iter()
        .map(|role| RoleInfo {
            id: role.id.clone(),
            name: role.name.clone(),
        })
        .collect();

    let role_permissions = effective
        .role_permissions
        .iter()
        .map(|item| PermissionInfo {
            path: item.permission.path.clone(),
            role: Some(item.role_id.clone()),
            kind: item.permission.kind.clone(),
            action: item.permission.action.clone(),
        })
        .collect();

    let user_permissions = effective
        .direct_permissions
        .iter()
        .map(|permission| PermissionInfo {
            path: permission.path.clone(),
            role: None,
            kind: permission.kind.clone(),
            action: permission.action.clone(),
        })
        .collect();

    Ok(UserInfo {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        group_id: user.group_id,
        group_name: group_name_value,
        phone: user.phone,
        status: user.status,
        must_change_password: user.must_change_password,
        create_time: user.create_time,
        update_time: user.update_time,
        roles,
        role_permissions,
        user_permissions,
    })
}

/// Exposed for the logout flow (increments `token_version`).
pub async fn revoke_tokens(pool: &Db, username: &str) -> Result<(), AppError> {
    user_repo::bump_token_version_by_username(pool, username).await?;
    Ok(())
}

fn assert_not_self(caller: &AuthUser, target_id: &str, action: &str) -> Result<(), AppError> {
    if caller.id == target_id {
        return Err(AppError::business(format!("不能{action}当前登录用户")));
    }
    Ok(())
}

async fn assert_not_last_super(
    pool: &Db,
    user: &User,
    action: &str,
) -> Result<(), AppError> {
    if user.status == "0" || !user_repo::has_role(pool, &user.id, "super").await? {
        return Ok(());
    }
    let enabled_supers = user_repo::count_enabled_supers(pool).await?;
    if enabled_supers <= 1 {
        return Err(AppError::business(format!(
            "系统至少需要保留一个启用的超级管理员，不能{action}"
        )));
    }
    Ok(())
}

