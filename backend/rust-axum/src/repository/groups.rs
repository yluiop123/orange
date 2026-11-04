//! Group persistence.
//!
//! The query bodies are written once and expanded per concrete driver by
//! [`groups_repository!`]; [`dispatch_db!`] then picks the pool that
//! `DB_DRIVER` selected. Filters are appended conditionally instead of using
//! `$n IS NULL` guards, so no dialect needs type casts.

use crate::db::{Db, Dialect};
use crate::domain::entities::Group;
use crate::dispatch_db;

pub struct GroupListParams {
    /// Already escaped LIKE prefix pattern.
    pub id: Option<String>,
    /// Already escaped LIKE prefix pattern.
    pub name: Option<String>,
    pub status: Option<String>,
}

fn columns(dialect: Dialect) -> String {
    format!(
        "id, {}, status, parent_id, create_time, update_time",
        dialect.quote("name")
    )
}

macro_rules! groups_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;
            use sqlx::Pool;

            const D: Dialect = $dialect;

            pub async fn all(pool: &$pool) -> Result<Vec<Group>, sqlx::Error> {
                let sql = format!("SELECT {} FROM sys_group ORDER BY id", columns(D));
                sqlx::query_as::<_, Group>(&sql).fetch_all(pool).await
            }

            pub async fn list(
                pool: &$pool,
                params: &GroupListParams,
            ) -> Result<Vec<Group>, sqlx::Error> {
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

                let sql = format!(
                    "SELECT {} FROM sys_group{where_clause} ORDER BY id",
                    columns(D)
                );
                let mut query = sqlx::query_as::<_, Group>(&sql);
                for value in binds {
                    query = query.bind(value);
                }
                query.fetch_all(pool).await
            }

            pub async fn find(pool: &$pool, id: &str) -> Result<Option<Group>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_group WHERE id = {}",
                    columns(D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, Group>(&sql)
                    .bind(id)
                    .fetch_optional(pool)
                    .await
            }

            pub async fn exists(pool: &$pool, id: &str) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_group WHERE id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }

            pub async fn create(
                pool: &$pool,
                id: &str,
                name: Option<&str>,
                parent_id: Option<&str>,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let sql = format!(
                    "INSERT INTO sys_group (id, {}, status, parent_id, create_time, update_time) \
                     VALUES ({}, {}, '1', {}, {now}, {now})",
                    D.quote("name"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3)
                );
                sqlx::query(&sql)
                    .bind(id)
                    .bind(name)
                    .bind(parent_id)
                    .execute(pool)
                    .await?;
                Ok(())
            }

            pub async fn update(
                pool: &$pool,
                id: &str,
                name: Option<&str>,
                status: &str,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let sql = format!(
                    "UPDATE sys_group SET {} = {}, status = {}, update_time = {now}, \
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
                    .execute(pool)
                    .await?;
                Ok(())
            }

            pub async fn delete(pool: &$pool, id: &str) -> Result<(), sqlx::Error> {
                let sql = format!("DELETE FROM sys_group WHERE id = {}", D.placeholder(1));
                sqlx::query(&sql).bind(id).execute(pool).await?;
                Ok(())
            }

            pub async fn has_users(pool: &$pool, id: &str) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_user WHERE group_id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }
        }
    };
}

groups_repository!(pg, sqlx::PgPool, Dialect::Postgres);
groups_repository!(my, sqlx::MySqlPool, Dialect::MySql);
groups_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn all(db: &Db) -> Result<Vec<Group>, sqlx::Error> {
    dispatch_db!(db, all())
}

pub async fn list(db: &Db, params: &GroupListParams) -> Result<Vec<Group>, sqlx::Error> {
    dispatch_db!(db, list(params))
}

pub async fn find(db: &Db, id: &str) -> Result<Option<Group>, sqlx::Error> {
    dispatch_db!(db, find(id))
}

pub async fn exists(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, exists(id))
}

pub async fn create(
    db: &Db,
    id: &str,
    name: Option<&str>,
    parent_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, create(id, name, parent_id))
}

pub async fn update(
    db: &Db,
    id: &str,
    name: Option<&str>,
    status: &str,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, update(id, name, status))
}

pub async fn delete(db: &Db, id: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, delete(id))
}

pub async fn has_users(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, has_users(id))
}
