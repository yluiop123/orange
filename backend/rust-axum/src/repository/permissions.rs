//! Permission persistence.

use sqlx::PgPool;

use crate::domain::entities::Permission;

pub const PERMISSION_COLUMNS: &str =
    r#"id, "name", path, action, "type" AS kind, status, parent_id, create_time, update_time"#;

pub struct PermissionListParams {
    /// Already escaped LIKE prefix pattern.
    pub id: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub name: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub path: Option<String>,
    pub status: Option<String>,
    pub kind: Option<String>,
}

pub async fn all(pool: &PgPool) -> Result<Vec<Permission>, sqlx::Error> {
    let sql = format!("SELECT {PERMISSION_COLUMNS} FROM sys_permission ORDER BY id");
    sqlx::query_as::<_, Permission>(&sql).fetch_all(pool).await
}

pub async fn list(
    pool: &PgPool,
    params: &PermissionListParams,
) -> Result<Vec<Permission>, sqlx::Error> {
    let sql = format!(
        r#"SELECT {PERMISSION_COLUMNS} FROM sys_permission
           WHERE ($1::text IS NULL OR lower(id) LIKE $1::text)
             AND ($2::text IS NULL OR lower("name") LIKE $2::text)
             AND ($3::text IS NULL OR lower(path) LIKE $3::text)
             AND ($4::text IS NULL OR status = $4::text)
             AND ($5::text IS NULL OR "type" = $5::text)
           ORDER BY id"#
    );
    sqlx::query_as::<_, Permission>(&sql)
        .bind(&params.id)
        .bind(&params.name)
        .bind(&params.path)
        .bind(&params.status)
        .bind(&params.kind)
        .fetch_all(pool)
        .await
}

pub async fn find(pool: &PgPool, id: &str) -> Result<Option<Permission>, sqlx::Error> {
    let sql = format!("SELECT {PERMISSION_COLUMNS} FROM sys_permission WHERE id = $1");
    sqlx::query_as::<_, Permission>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn exists(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_permission WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}

/// `(type, path, action)` identity, with `NULL` action treated as one value.
pub async fn identity_exists(
    pool: &PgPool,
    kind: &str,
    path: &str,
    action: Option<&str>,
    exclude_id: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        r#"SELECT count(*) FROM sys_permission
           WHERE "type" = $1 AND path = $2
             AND (($3::text IS NULL AND action IS NULL) OR action = $3::text)
             AND ($4::text IS NULL OR id <> $4::text)"#,
    )
    .bind(kind)
    .bind(path)
    .bind(action)
    .bind(exclude_id)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

pub async fn create(
    pool: &PgPool,
    permission: &Permission,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO sys_permission
           (id, "name", path, action, "type", status, parent_id, create_time, update_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())"#,
    )
    .bind(&permission.id)
    .bind(&permission.name)
    .bind(&permission.path)
    .bind(&permission.action)
    .bind(&permission.kind)
    .bind(&permission.status)
    .bind(&permission.parent_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update(
    pool: &PgPool,
    permission: &Permission,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"UPDATE sys_permission SET "name" = $2, path = $3, action = $4, "type" = $5,
               status = $6, update_time = now(), version = version + 1
           WHERE id = $1"#,
    )
    .bind(&permission.id)
    .bind(&permission.name)
    .bind(&permission.path)
    .bind(&permission.action)
    .bind(&permission.kind)
    .bind(&permission.status)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sys_permission WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn referenced_by_role(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 =
        sqlx::query_scalar("SELECT count(*) FROM sys_role_permission WHERE permission_id = $1")
            .bind(id)
            .fetch_one(pool)
            .await?;
    Ok(count > 0)
}

pub async fn referenced_by_user(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 =
        sqlx::query_scalar("SELECT count(*) FROM sys_user_permission WHERE permission_id = $1")
            .bind(id)
            .fetch_one(pool)
            .await?;
    Ok(count > 0)
}
