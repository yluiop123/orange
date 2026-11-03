//! Role persistence.

use sqlx::PgPool;

use crate::domain::entities::Role;

pub const ROLE_COLUMNS: &str = r#"id, "name", status, create_time, update_time"#;

pub struct RoleListParams {
    /// Already escaped LIKE prefix pattern.
    pub id: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub name: Option<String>,
    pub status: Option<String>,
    pub sort_column: &'static str,
    pub descending: bool,
    pub limit: i64,
    pub offset: i64,
}

pub async fn find(pool: &PgPool, id: &str) -> Result<Option<Role>, sqlx::Error> {
    let sql = format!("SELECT {ROLE_COLUMNS} FROM sys_role WHERE id = $1");
    sqlx::query_as::<_, Role>(&sql).bind(id).fetch_optional(pool).await
}

pub async fn exists(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_role WHERE id = $1")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}

pub async fn list(
    pool: &PgPool,
    params: &RoleListParams,
) -> Result<(i64, Vec<Role>), sqlx::Error> {
    let filter = r#"WHERE ($1::text IS NULL OR lower(id) LIKE $1::text)
        AND ($2::text IS NULL OR lower("name") LIKE $2::text)
        AND ($3::text IS NULL OR status = $3::text)"#;

    let count_sql = format!("SELECT count(*) FROM sys_role {filter}");
    let total: i64 = sqlx::query_scalar(&count_sql)
        .bind(&params.id)
        .bind(&params.name)
        .bind(&params.status)
        .fetch_one(pool)
        .await?;

    let direction = if params.descending { "DESC" } else { "ASC" };
    let list_sql = format!(
        "SELECT {ROLE_COLUMNS} FROM sys_role {filter} ORDER BY {} {direction} LIMIT $4 OFFSET $5",
        params.sort_column
    );
    let rows = sqlx::query_as::<_, Role>(&list_sql)
        .bind(&params.id)
        .bind(&params.name)
        .bind(&params.status)
        .bind(params.limit)
        .bind(params.offset)
        .fetch_all(pool)
        .await?;

    Ok((total, rows))
}

pub async fn create(
    pool: &PgPool,
    id: &str,
    name: Option<&str>,
    permission_ids: &[String],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"INSERT INTO sys_role (id, "name", status, create_time, update_time)
           VALUES ($1, $2, '1', now(), now())"#,
    )
    .bind(id)
    .bind(name)
    .execute(&mut *tx)
    .await?;

    for permission_id in permission_ids {
        sqlx::query(
            "INSERT INTO sys_role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(permission_id)
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await
}

pub async fn update(
    pool: &PgPool,
    id: &str,
    name: Option<&str>,
    status: &str,
    permission_ids: Option<&[String]>,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"UPDATE sys_role SET "name" = $2, status = $3, update_time = now(),
               version = version + 1
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(name)
    .bind(status)
    .execute(&mut *tx)
    .await?;

    if let Some(permission_ids) = permission_ids {
        sqlx::query("DELETE FROM sys_role_permission WHERE role_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        for permission_id in permission_ids {
            sqlx::query(
                "INSERT INTO sys_role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            )
            .bind(id)
            .bind(permission_id)
            .execute(&mut *tx)
            .await?;
        }
    }
    tx.commit().await
}

pub async fn delete(pool: &PgPool, id: &str) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    // Role-owned grants are not an external reference; clear them first.
    sqlx::query("DELETE FROM sys_role_permission WHERE role_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM sys_role WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await
}

pub async fn permission_ids(pool: &PgPool, role_id: &str) -> Result<Vec<String>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT permission_id FROM sys_role_permission WHERE role_id = $1 ORDER BY permission_id",
    )
    .bind(role_id)
    .fetch_all(pool)
    .await
}

pub async fn referenced_by_user(pool: &PgPool, role_id: &str) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM sys_user_role WHERE role_id = $1")
        .bind(role_id)
        .fetch_one(pool)
        .await?;
    Ok(count > 0)
}
