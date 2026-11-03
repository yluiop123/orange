//! User persistence. Dynamic filters use nullable parameters so the SQL stays
//! static and bind-safe; sorting columns come from a whitelist in the service.

use sqlx::{PgPool, Row};

use crate::domain::entities::{Permission, Role, User};

pub const USER_COLUMNS: &str = r#"id, "name", username, email, group_id, phone, status, token_version, must_change_password, "password", create_time, update_time"#;

pub struct UserListParams {
    /// Already escaped LIKE prefix pattern.
    pub keyword: Option<String>,
    pub status: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub group_id: Option<String>,
    pub sort_column: &'static str,
    pub descending: bool,
    pub limit: i64,
    pub offset: i64,
}

pub struct NewUser {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub password: String,
}

pub struct UserUpdate {
    pub id: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub token_version: i32,
}

const FILTER: &str = r#"WHERE ($1::text IS NULL
        OR lower("name") LIKE $1::text
        OR lower(username) LIKE $1::text
        OR lower(email) LIKE $1::text
        OR lower(phone) LIKE $1::text)
    AND ($2::text IS NULL OR status = $2::text)
    AND ($3::text IS NULL OR lower(group_id) LIKE $3::text)"#;

pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, sqlx::Error> {
    let sql = format!("SELECT {USER_COLUMNS} FROM sys_user WHERE username = $1");
    sqlx::query_as::<_, User>(&sql)
        .bind(username)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_id(pool: &PgPool, id: &str) -> Result<Option<User>, sqlx::Error> {
    let sql = format!("SELECT {USER_COLUMNS} FROM sys_user WHERE id = $1");
    sqlx::query_as::<_, User>(&sql).bind(id).fetch_optional(pool).await
}

pub async fn exists_username(pool: &PgPool, username: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_user WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}

pub async fn list(
    pool: &PgPool,
    params: &UserListParams,
) -> Result<(i64, Vec<User>), sqlx::Error> {
    let count_sql = format!("SELECT count(*) FROM sys_user {FILTER}");
    let total: i64 = sqlx::query_scalar(&count_sql)
        .bind(&params.keyword)
        .bind(&params.status)
        .bind(&params.group_id)
        .fetch_one(pool)
        .await?;

    let direction = if params.descending { "DESC" } else { "ASC" };
    let list_sql = format!(
        "SELECT {USER_COLUMNS} FROM sys_user {FILTER} ORDER BY {} {direction} LIMIT $4 OFFSET $5",
        params.sort_column
    );
    let rows = sqlx::query_as::<_, User>(&list_sql)
        .bind(&params.keyword)
        .bind(&params.status)
        .bind(&params.group_id)
        .bind(params.limit)
        .bind(params.offset)
        .fetch_all(pool)
        .await?;

    Ok((total, rows))
}

pub async fn create(
    pool: &PgPool,
    user: &NewUser,
    roles: &[String],
    permissions: &[String],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"INSERT INTO sys_user
           (id, "name", username, email, group_id, phone, status, "password",
            token_version, must_change_password, create_time, update_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, true, now(), now())"#,
    )
    .bind(&user.id)
    .bind(&user.name)
    .bind(&user.username)
    .bind(&user.email)
    .bind(&user.group_id)
    .bind(&user.phone)
    .bind(&user.status)
    .bind(&user.password)
    .execute(&mut *tx)
    .await?;

    for role_id in roles {
        sqlx::query(
            "INSERT INTO sys_user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(&user.id)
        .bind(role_id)
        .execute(&mut *tx)
        .await?;
    }
    for permission_id in permissions {
        sqlx::query(
            "INSERT INTO sys_user_permission (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(&user.id)
        .bind(permission_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await
}

pub async fn update(
    pool: &PgPool,
    update: &UserUpdate,
    roles: Option<&[String]>,
    permissions: Option<&[String]>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query(
        r#"UPDATE sys_user SET "name" = $2, email = $3, group_id = $4, phone = $5,
               status = $6, token_version = $7, update_time = now(), version = version + 1
           WHERE id = $1"#,
    )
    .bind(&update.id)
    .bind(&update.name)
    .bind(&update.email)
    .bind(&update.group_id)
    .bind(&update.phone)
    .bind(&update.status)
    .bind(update.token_version)
    .execute(&mut *tx)
    .await?;

    if let Some(role_ids) = roles {
        sqlx::query("DELETE FROM sys_user_role WHERE user_id = $1")
            .bind(&update.id)
            .execute(&mut *tx)
            .await?;
        for role_id in role_ids {
            sqlx::query(
                "INSERT INTO sys_user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(&update.id)
            .bind(role_id)
            .execute(&mut *tx)
            .await?;
        }
    }

    if let Some(permission_ids) = permissions {
        sqlx::query("DELETE FROM sys_user_permission WHERE user_id = $1")
            .bind(&update.id)
            .execute(&mut *tx)
            .await?;
        for permission_id in permission_ids {
            sqlx::query(
                "INSERT INTO sys_user_permission (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(&update.id)
            .bind(permission_id)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    // Join rows cascade on sys_user.id.
    sqlx::query("DELETE FROM sys_user WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn roles_for_user(pool: &PgPool, user_id: &str) -> Result<Vec<Role>, sqlx::Error> {
    sqlx::query_as::<_, Role>(
        r#"SELECT r.id, r."name", r.status, r.create_time, r.update_time
           FROM sys_role r
           JOIN sys_user_role ur ON ur.role_id = r.id
           WHERE ur.user_id = $1
           ORDER BY r.id"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn role_permissions_for_user(
    pool: &PgPool,
    user_id: &str,
) -> Result<Vec<(String, Permission)>, sqlx::Error> {
    let rows = sqlx::query(
        r#"SELECT rp.role_id,
                  p.id, p."name", p.path, p.action, p."type" AS kind, p.status, p.parent_id,
                  p.create_time, p.update_time
           FROM sys_role_permission rp
           JOIN sys_user_role ur ON ur.role_id = rp.role_id
           JOIN sys_permission p ON p.id = rp.permission_id
           WHERE ur.user_id = $1
           ORDER BY rp.role_id, p.id"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    let mut result = Vec::with_capacity(rows.len());
    for row in rows {
        let role_id: String = row.try_get("role_id")?;
        let permission = Permission {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            path: row.try_get("path")?,
            action: row.try_get("action")?,
            kind: row.try_get("kind")?,
            status: row.try_get("status")?,
            parent_id: row.try_get("parent_id")?,
            create_time: row.try_get("create_time")?,
            update_time: row.try_get("update_time")?,
        };
        result.push((role_id, permission));
    }
    Ok(result)
}

pub async fn direct_permissions_for_user(
    pool: &PgPool,
    user_id: &str,
) -> Result<Vec<Permission>, sqlx::Error> {
    sqlx::query_as::<_, Permission>(
        r#"SELECT p.id, p."name", p.path, p.action, p."type" AS kind, p.status, p.parent_id,
                  p.create_time, p.update_time
           FROM sys_permission p
           JOIN sys_user_permission up ON up.permission_id = p.id
           WHERE up.user_id = $1
           ORDER BY p.id"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn count_enabled_supers(pool: &PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        r#"SELECT count(*)
           FROM sys_user u
           JOIN sys_user_role ur ON ur.user_id = u.id
           WHERE ur.role_id = 'super' AND u.status = '1'"#,
    )
    .fetch_one(pool)
    .await
}

pub async fn has_role(pool: &PgPool, user_id: &str, role_id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM sys_user_role WHERE user_id = $1 AND role_id = $2",
    )
    .bind(user_id)
    .bind(role_id)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

pub async fn set_password(
    pool: &PgPool,
    id: &str,
    password_hash: &str,
    must_change_password: bool,
    token_version: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"UPDATE sys_user SET "password" = $2, must_change_password = $3,
               token_version = $4, update_time = now(), version = version + 1
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(password_hash)
    .bind(must_change_password)
    .bind(token_version)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn bump_token_version(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE sys_user SET token_version = token_version + 1, update_time = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn bump_token_version_by_username(
    pool: &PgPool,
    username: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE sys_user SET token_version = token_version + 1, update_time = now() WHERE username = $1",
    )
    .bind(username)
    .execute(pool)
    .await?;
    Ok(())
}
