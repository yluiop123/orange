//! Permission persistence.

use crate::db::{Db, Dialect};
use crate::dispatch_db;
use crate::domain::entities::Permission;

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

fn columns(dialect: Dialect) -> String {
    format!(
        "id, {}, path, action, {} AS kind, status, parent_id, create_time, update_time",
        dialect.quote("name"),
        dialect.quote("type")
    )
}

macro_rules! permissions_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;

            const D: Dialect = $dialect;

            pub async fn all(pool: &$pool) -> Result<Vec<Permission>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_permission ORDER BY id",
                    columns(D)
                );
                sqlx::query_as::<_, Permission>(&sql).fetch_all(pool).await
            }

            pub async fn list(
                pool: &$pool,
                params: &PermissionListParams,
            ) -> Result<Vec<Permission>, sqlx::Error> {
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
                if params.path.is_some() {
                    clause.push_str(&format!(
                        " AND lower(path) LIKE {} ESCAPE '\\'",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.path.clone());
                }
                if params.status.is_some() {
                    clause.push_str(&format!(
                        " AND status = {}",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.status.clone());
                }
                if params.kind.is_some() {
                    clause.push_str(&format!(
                        " AND {} = {}",
                        D.quote("type"),
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(params.kind.clone());
                }
                let where_clause = if clause.is_empty() {
                    String::new()
                } else {
                    format!(" WHERE 1 = 1{clause}")
                };

                let sql = format!(
                    "SELECT {} FROM sys_permission{where_clause} ORDER BY id",
                    columns(D)
                );
                let mut query = sqlx::query_as::<_, Permission>(&sql);
                for value in binds {
                    query = query.bind(value);
                }
                query.fetch_all(pool).await
            }

            pub async fn find(
                pool: &$pool,
                id: &str,
            ) -> Result<Option<Permission>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_permission WHERE id = {}",
                    columns(D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, Permission>(&sql)
                    .bind(id)
                    .fetch_optional(pool)
                    .await
            }

            pub async fn exists(pool: &$pool, id: &str) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_permission WHERE id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }

            /// `(type, path, action)` identity, with `NULL` action treated as
            /// one value.
            pub async fn identity_exists(
                pool: &$pool,
                kind: &str,
                path: &str,
                action: Option<&str>,
                exclude_id: Option<&str>,
            ) -> Result<bool, sqlx::Error> {
                let mut sql = format!(
                    "SELECT count(*) FROM sys_permission WHERE {} = {} AND path = {}",
                    D.quote("type"),
                    D.placeholder(1),
                    D.placeholder(2)
                );
                let mut binds: Vec<Option<String>> =
                    vec![Some(kind.to_string()), Some(path.to_string())];
                match action {
                    Some(value) => {
                        sql.push_str(&format!(" AND action = {}", D.placeholder(binds.len() + 1)));
                        binds.push(Some(value.to_string()));
                    }
                    None => sql.push_str(" AND action IS NULL"),
                }
                if let Some(exclude) = exclude_id {
                    sql.push_str(&format!(" AND id <> {}", D.placeholder(binds.len() + 1)));
                    binds.push(Some(exclude.to_string()));
                }

                let mut query = sqlx::query_scalar::<_, i64>(&sql);
                for value in binds {
                    query = query.bind(value);
                }
                let count: i64 = query.fetch_one(pool).await?;
                Ok(count > 0)
            }

            pub async fn create(
                pool: &$pool,
                permission: &Permission,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let sql = format!(
                    "INSERT INTO sys_permission (id, {}, path, action, {}, status, \
                     parent_id, create_time, update_time) \
                     VALUES ({}, {}, {}, {}, {}, {}, {}, {now}, {now})",
                    D.quote("name"),
                    D.quote("type"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.placeholder(4),
                    D.placeholder(5),
                    D.placeholder(6),
                    D.placeholder(7)
                );
                sqlx::query(&sql)
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
                pool: &$pool,
                permission: &Permission,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let sql = format!(
                    "UPDATE sys_permission SET {} = {}, path = {}, action = {}, {} = {}, \
                     status = {}, update_time = {now}, version = version + 1 WHERE id = {}",
                    D.quote("name"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.quote("type"),
                    D.placeholder(4),
                    D.placeholder(5),
                    D.placeholder(6)
                );
                sqlx::query(&sql)
                    .bind(&permission.name)
                    .bind(&permission.path)
                    .bind(&permission.action)
                    .bind(&permission.kind)
                    .bind(&permission.status)
                    .bind(&permission.id)
                    .execute(pool)
                    .await?;
                Ok(())
            }

            pub async fn delete(pool: &$pool, id: &str) -> Result<(), sqlx::Error> {
                let sql = format!(
                    "DELETE FROM sys_permission WHERE id = {}",
                    D.placeholder(1)
                );
                sqlx::query(&sql).bind(id).execute(pool).await?;
                Ok(())
            }

            pub async fn referenced_by_role(
                pool: &$pool,
                id: &str,
            ) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_role_permission WHERE permission_id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }

            pub async fn referenced_by_user(
                pool: &$pool,
                id: &str,
            ) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_user_permission WHERE permission_id = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql).bind(id).fetch_one(pool).await?;
                Ok(count > 0)
            }
        }
    };
}

permissions_repository!(pg, sqlx::PgPool, Dialect::Postgres);
permissions_repository!(my, sqlx::MySqlPool, Dialect::MySql);
permissions_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn all(db: &Db) -> Result<Vec<Permission>, sqlx::Error> {
    dispatch_db!(db, all())
}

pub async fn list(
    db: &Db,
    params: &PermissionListParams,
) -> Result<Vec<Permission>, sqlx::Error> {
    dispatch_db!(db, list(params))
}

pub async fn find(db: &Db, id: &str) -> Result<Option<Permission>, sqlx::Error> {
    dispatch_db!(db, find(id))
}

pub async fn exists(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, exists(id))
}

pub async fn identity_exists(
    db: &Db,
    kind: &str,
    path: &str,
    action: Option<&str>,
    exclude_id: Option<&str>,
) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, identity_exists(kind, path, action, exclude_id))
}

pub async fn create(db: &Db, permission: &Permission) -> Result<(), sqlx::Error> {
    dispatch_db!(db, create(permission))
}

pub async fn update(db: &Db, permission: &Permission) -> Result<(), sqlx::Error> {
    dispatch_db!(db, update(permission))
}

pub async fn delete(db: &Db, id: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, delete(id))
}

pub async fn referenced_by_role(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, referenced_by_role(id))
}

pub async fn referenced_by_user(db: &Db, id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, referenced_by_user(id))
}
