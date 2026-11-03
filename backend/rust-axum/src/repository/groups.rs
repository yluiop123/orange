//! Group persistence.

use sqlx::PgPool;

use crate::domain::entities::Group;

pub const GROUP_COLUMNS: &str = r#"id, "name", status, parent_id, create_time, update_time"#;

pub struct GroupListParams {
    /// Already escaped LIKE prefix pattern.
    pub id: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub name: Option<String>,
    pub status: Option<String>,
}

pub async fn all(pool: &PgPool) -> Result<Vec<Group>, sqlx::Error> {
    let sql = format!("SELECT {GROUP_COLUMNS} FROM sys_group ORDER BY id");
    sqlx::query_as::<_, Group>(&sql).fetch_all(pool).await
}

pub async fn list(
    pool: &PgPool,
    params: &GroupListParams,
) -> Result<Vec<Group>, sqlx::Error> {
    let sql = format!(
        r#"SELECT {GROUP_COLUMNS} FROM sys_group
           WHERE ($1::text IS NULL OR lower(id) LIKE $1::text)
             AND ($2::text IS NULL OR lower("name") LIKE $2::text)
             AND ($3::text IS NULL OR status = $3::text)
           ORDER BY id"#
    );
    sqlx::query_as::<_, Group>(&sql)
        .bind(&params.id)
        .bind(&params.name)
        .bind(&params.status)
        .fetch_all(pool)
        .await
}

pub async fn find(pool: &PgPool, id: &str) -> Result<Option<Group>, sqlx::Error> {
    let sql = format!("SELECT {GROUP_COLUMNS} FROM sys_group WHERE id = $1");
    sqlx::query_as::<_, Group>(&sql).bind(id).fetch_optional(pool).await
}

pub async fn exists(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_group WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}

pub async fn create(
    pool: &PgPool,
    id: &str,
    name: Option<&str>,
    parent_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO sys_group (id, "name", status, parent_id, create_time, update_time)
           VALUES ($1, $2, '1', $3, now(), now())"#,
    )
    .bind(id)
    .bind(name)
    .bind(parent_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update(
    pool: &PgPool,
    id: &str,
    name: Option<&str>,
    status: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"UPDATE sys_group SET "name" = $2, status = $3, update_time = now(),
               version = version + 1
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(name)
    .bind(status)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sys_group WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn has_users(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_user WHERE group_id = $1")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}
