//! Role persistence.

use crate::db::{Db, Dialect};
use crate::dispatch_db;
use crate::domain::entities::Role;

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

fn columns(dialect: Dialect) -> String {
    format!(
        "id, {}, status, create_time, update_time",
        dialect.quote("name")
    )
}

macro_rules! roles_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;

            const D: Dialect = $dialect;

            pub async fn find(pool: &$pool, id: &str) -> Result<Option<Role>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_role WHERE id = {}",
                    columns(D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, Role>(&sql)
                    .bind(id)
                    .fetch_optional(pool)
                    .await
            }

            pub async fn exists(pool: &$pool, id: &str) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_role WHERE id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }

            pub async fn list(
                pool: &$pool,
                params: &RoleListParams,
            ) -> Result<(i64, Vec<Role>), sqlx::Error> {
                let mut clause = String::new();
                let mut binds: Vec<Option<String>> = Vec::new();
                if params.id.is_some() {
                    clause.push_str(&format!(
                        " AND lower(id) LIKE {} ESCAPE '\\'",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.id.clone());
                }
                if params.name.is_some() {
                    clause.push_str(&format!(
                        " AND lower({}) LIKE {} ESCAPE '\\'",
                        D.quote("name"),
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.name.clone());
                }
                if params.status.is_some() {
                    clause.push_str(&format!(
                        " AND status = {}",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.status.clone());
                }
                let where_clause = if clause.is_empty() {
                    String::new()
                } else {
                    format!(" WHERE 1 = 1{clause}")
                };
                let direction = if params.descending { "DESC" } else { "ASC" };

                let count_sql = format!("SELECT count(*) FROM sys_role{where_clause}");
                let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
                for value in &binds {
                    count_query = count_query.bind(value.clone());
                }
                let total: i64 = count_query.fetch_one(pool).await?;

                let limit_ph = D.placeholder(binds.len() + 1);
                let offset_ph = D.placeholder(binds.len() + 2);
                let list_sql = format!(
                    "SELECT {} FROM sys_role{where_clause} ORDER BY {} {direction} \
                     LIMIT {limit_ph} OFFSET {offset_ph}",
                    columns(D),
                    params.sort_column
                );
                let mut list_query = sqlx::query_as::<_, Role>(&list_sql);
                for value in binds {
                    list_query = list_query.bind(value);
                }
                let rows = list_query
                    .bind(params.limit)
                    .bind(params.offset)
                    .fetch_all(pool)
                    .await?;

                Ok((total, rows))
            }

            pub async fn create(
                pool: &$pool,
                id: &str,
                name: Option<&str>,
                permission_ids: &[String],
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let mut tx = pool.begin().await?;
                let sql = format!(
                    "INSERT INTO sys_role (id, {}, status, create_time, update_time) \
                     VALUES ({}, {}, '1', {now}, {now})",
                    D.quote("name"),
                    D.placeholder(1),
                    D.placeholder(2)
                );
                sqlx::query(&sql)
                    .bind(id)
                    .bind(name)
                    .execute(&mut *tx)
                    .await?;

                for permission_id in permission_ids {
                    let sql = format!(
                        "{} sys_role_permission (role_id, permission_id) VALUES ({}, {}){}",
                        D.insert_prefix(),
                        D.placeholder(1),
                        D.placeholder(2),
                        D.insert_suffix()
                    );
                    sqlx::query(&sql)
                        .bind(id)
                        .bind(permission_id)
                        .execute(&mut *tx)
                        .await?;
                }
                tx.commit().await
            }

            pub async fn update(
                pool: &$pool,
                id: &str,
                name: Option<&str>,
                status: &str,
                permission_ids: Option<&[String]>,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let mut tx = pool.begin().await?;
                let sql = format!(
                    "UPDATE sys_role SET {} = {}, status = {}, update_time = {now}, \
                     version = version + 1 WHERE id = {}",
                    D.quote("name"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3)
                );
                sqlx::query(&sql)
                    .bind(name)
                    .bind(status)
                    .bind(id)
                    .execute(&mut *tx)
                    .await?;

                if let Some(permission_ids) = permission_ids {
                    let delete = format!(
                        "DELETE FROM sys_role_permission WHERE role_id = {}",
                        D.placeholder(1)
                    );
                    sqlx::query(&delete)
                        .bind(id)
                        .execute(&mut *tx)
                        .await?;
                    for permission_id in permission_ids {
                        let insert = format!(
                            "{} sys_role_permission (role_id, permission_id) \
                             VALUES ({}, {}){}",
                            D.insert_prefix(),
                            D.placeholder(1),
                            D.placeholder(2),
                            D.insert_suffix()
                        );
                        sqlx::query(&insert)
                            .bind(id)
                            .bind(permission_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                }
                tx.commit().await
            }

            pub async fn delete(pool: &$pool, id: &str) -> Result<(), sqlx::Error> {
                let mut tx = pool.begin().await?;
                // Role-owned grants are not an external reference.
                let grants = format!(
                    "DELETE FROM sys_role_permission WHERE role_id = {}",
                    D.placeholder(1)
                );
                sqlx::query(&grants).bind(id).execute(&mut *tx).await?;
                let role = format!("DELETE FROM sys_role WHERE id = {}", D.placeholder(1));
                sqlx::query(&role).bind(id).execute(&mut *tx).await?;
                tx.commit().await
            }

            pub async fn permission_ids(
                pool: &$pool,
                role_id: &str,
            ) -> Result<Vec<String>, sqlx::Error> {
                let sql = format!(
                    "SELECT permission_id FROM sys_role_permission \
                     WHERE role_id = {} ORDER BY permission_id",
                    D.placeholder(1)
                );
                sqlx::query_scalar(&sql).bind(role_id).fetch_all(pool).await
            }

            pub async fn referenced_by_user(
                pool: &$pool,
                role_id: &str,
            ) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_user_role WHERE role_id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql)
                    .bind(role_id)
                    .fetch_one(pool)
                    .await?;
                Ok(count > 0)
            }
        }
    };
}

roles_repository!(pg, sqlx::PgPool, Dialect::Postgres);
roles_repository!(my, sqlx::MySqlPool, Dialect::MySql);
roles_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn find(db: &Db, id: &str) -> Result<Option<Role>, sqlx::Error> {
    dispatch_db!(db, find(id))
}

pub async fn exists(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, exists(id))
}

pub async fn list(db: &Db, params: &RoleListParams) -> Result<(i64, Vec<Role>), sqlx::Error> {
    dispatch_db!(db, list(params))
}

pub async fn create(
    db: &Db,
    id: &str,
    name: Option<&str>,
    permission_ids: &[String],
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, create(id, name, permission_ids))
}

pub async fn update(
    db: &Db,
    id: &str,
    name: Option<&str>,
    status: &str,
    permission_ids: Option<&[String]>,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, update(id, name, status, permission_ids))
}

pub async fn delete(db: &Db, id: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, delete(id))
}

pub async fn permission_ids(db: &Db, role_id: &str) -> Result<Vec<String>, sqlx::Error> {
    dispatch_db!(db, permission_ids(role_id))
}

pub async fn referenced_by_user(db: &Db, role_id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, referenced_by_user(role_id))
}
