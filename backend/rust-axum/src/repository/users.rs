//! User persistence.
//!
//! Filters are appended only when present, so no dialect needs a typed
//! `$n IS NULL` guard. Sorting columns come from a whitelist in the service.

use sqlx::Row;

use crate::db::{Db, Dialect};
use crate::dispatch_db;
use crate::domain::entities::{Permission, Role, User};

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

fn user_columns(dialect: Dialect) -> String {
    format!(
        "id, {}, username, email, group_id, phone, status, token_version, \
         must_change_password, {}, create_time, update_time",
        dialect.quote("name"),
        dialect.quote("password")
    )
}

fn permission_columns(prefix: &str, dialect: Dialect) -> String {
    format!(
        "{prefix}.id, {prefix}.{}, {prefix}.name_en, {prefix}.path, {prefix}.action, \
         {prefix}.{} AS kind, {prefix}.status, {prefix}.parent_id, {prefix}.create_time, \
         {prefix}.update_time",
        dialect.quote("name"),
        dialect.quote("type")
    )
}

macro_rules! users_repository {
    ($module:ident, $pool:ty, $dialect:expr) => {
        mod $module {
            use super::*;

            const D: Dialect = $dialect;

            pub async fn find_by_username(
                pool: &$pool,
                username: &str,
            ) -> Result<Option<User>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_user WHERE username = {}",
                    user_columns(D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, User>(&sql)
                    .bind(username)
                    .fetch_optional(pool)
                    .await
            }

            pub async fn find_by_id(
                pool: &$pool,
                id: &str,
            ) -> Result<Option<User>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_user WHERE id = {}",
                    user_columns(D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, User>(&sql)
                    .bind(id)
                    .fetch_optional(pool)
                    .await
            }

            pub async fn exists_username(
                pool: &$pool,
                username: &str,
            ) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_user WHERE username = {}",
                    D.placeholder(1)
                );
                let count: i64 = sqlx::query_scalar(&sql)
                    .bind(username)
                    .fetch_one(pool)
                    .await?;
                Ok(count > 0)
            }

            pub async fn list(
                pool: &$pool,
                params: &UserListParams,
            ) -> Result<(i64, Vec<User>), sqlx::Error> {
                let mut clause = String::new();
                let mut binds: Vec<Option<String>> = Vec::new();

                if let Some(keyword) = &params.keyword {
                    // One placeholder per LIKE occurrence: MySQL cannot reuse `?`.
                    let name = D.placeholder(binds.len() + 1);
                    let username = D.placeholder(binds.len() + 2);
                    let email = D.placeholder(binds.len() + 3);
                    let phone = D.placeholder(binds.len() + 4);
                    clause.push_str(&format!(
                        " AND (lower({}) LIKE {name} ESCAPE '\\' OR lower(username) LIKE {username} ESCAPE '\\' \
                         OR lower(email) LIKE {email} ESCAPE '\\' OR lower(phone) LIKE {phone} ESCAPE '\\')",
                        D.quote("name")
                    ));
                    for _ in 0..4 {
                        binds.push(Some(keyword.clone()));
                    }
                }
                if let Some(status) = &params.status {
                    clause.push_str(&format!(
                        " AND status = {}",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(Some(status.clone()));
                }
                if let Some(group_id) = &params.group_id {
                    clause.push_str(&format!(
                        " AND lower(group_id) LIKE {} ESCAPE '\\'",
                        D.placeholder(binds.len() + 1)
                    ));
                    binds.push(Some(group_id.clone()));
                }

                let where_clause = if clause.is_empty() {
                    String::new()
                } else {
                    format!(" WHERE 1 = 1{clause}")
                };
                let direction = if params.descending { "DESC" } else { "ASC" };

                let count_sql = format!("SELECT count(*) FROM sys_user{where_clause}");
                let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
                for value in &binds {
                    count_query = count_query.bind(value.clone());
                }
                let total: i64 = count_query.fetch_one(pool).await?;

                let limit_ph = D.placeholder(binds.len() + 1);
                let offset_ph = D.placeholder(binds.len() + 2);
                let list_sql = format!(
                    "SELECT {} FROM sys_user{where_clause} ORDER BY {} {direction} \
                     LIMIT {limit_ph} OFFSET {offset_ph}",
                    user_columns(D),
                    params.sort_column
                );
                let mut list_query = sqlx::query_as::<_, User>(&list_sql);
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
                user: &NewUser,
                roles: &[String],
                permissions: &[String],
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let mut tx = pool.begin().await?;

                let sql = format!(
                    "INSERT INTO sys_user (id, {}, username, email, group_id, phone, \
                     status, {}, token_version, must_change_password, create_time, \
                     update_time) VALUES ({}, {}, {}, {}, {}, {}, {}, {}, 0, true, \
                     {now}, {now})",
                    D.quote("name"),
                    D.quote("password"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.placeholder(4),
                    D.placeholder(5),
                    D.placeholder(6),
                    D.placeholder(7),
                    D.placeholder(8)
                );
                sqlx::query(&sql)
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
                    let sql = format!(
                        "{} sys_user_role (user_id, role_id) VALUES ({}, {}){}",
                        D.insert_prefix(),
                        D.placeholder(1),
                        D.placeholder(2),
                        D.insert_suffix()
                    );
                    sqlx::query(&sql)
                        .bind(&user.id)
                        .bind(role_id)
                        .execute(&mut *tx)
                        .await?;
                }
                for permission_id in permissions {
                    let sql = format!(
                        "{} sys_user_permission (user_id, permission_id) VALUES ({}, {}){}",
                        D.insert_prefix(),
                        D.placeholder(1),
                        D.placeholder(2),
                        D.insert_suffix()
                    );
                    sqlx::query(&sql)
                        .bind(&user.id)
                        .bind(permission_id)
                        .execute(&mut *tx)
                        .await?;
                }

                tx.commit().await
            }

            pub async fn update(
                pool: &$pool,
                update: &UserUpdate,
                roles: Option<&[String]>,
                permissions: Option<&[String]>,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let mut tx = pool.begin().await?;

                let sql = format!(
                    "UPDATE sys_user SET {} = {}, email = {}, group_id = {}, phone = {}, \
                     status = {}, token_version = {}, update_time = {now}, \
                     version = version + 1 WHERE id = {}",
                    D.quote("name"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.placeholder(4),
                    D.placeholder(5),
                    D.placeholder(6),
                    D.placeholder(7)
                );
                sqlx::query(&sql)
                    .bind(&update.name)
                    .bind(&update.email)
                    .bind(&update.group_id)
                    .bind(&update.phone)
                    .bind(&update.status)
                    .bind(update.token_version)
                    .bind(&update.id)
                    .execute(&mut *tx)
                    .await?;

                if let Some(role_ids) = roles {
                    let delete = format!(
                        "DELETE FROM sys_user_role WHERE user_id = {}",
                        D.placeholder(1)
                    );
                    sqlx::query(&delete)
                        .bind(&update.id)
                        .execute(&mut *tx)
                        .await?;
                    for role_id in role_ids {
                        let insert = format!(
                            "{} sys_user_role (user_id, role_id) VALUES ({}, {}){}",
                            D.insert_prefix(),
                            D.placeholder(1),
                            D.placeholder(2),
                            D.insert_suffix()
                        );
                        sqlx::query(&insert)
                            .bind(&update.id)
                            .bind(role_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                }

                if let Some(permission_ids) = permissions {
                    let delete = format!(
                        "DELETE FROM sys_user_permission WHERE user_id = {}",
                        D.placeholder(1)
                    );
                    sqlx::query(&delete)
                        .bind(&update.id)
                        .execute(&mut *tx)
                        .await?;
                    for permission_id in permission_ids {
                        let insert = format!(
                            "{} sys_user_permission (user_id, permission_id) \
                             VALUES ({}, {}){}",
                            D.insert_prefix(),
                            D.placeholder(1),
                            D.placeholder(2),
                            D.insert_suffix()
                        );
                        sqlx::query(&insert)
                            .bind(&update.id)
                            .bind(permission_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                }

                tx.commit().await?;
                Ok(())
            }

            pub async fn delete(pool: &$pool, id: &str) -> Result<(), sqlx::Error> {
                let sql = format!("DELETE FROM sys_user WHERE id = {}", D.placeholder(1));
                sqlx::query(&sql).bind(id).execute(pool).await?;
                Ok(())
            }

            pub async fn roles_for_user(
                pool: &$pool,
                user_id: &str,
            ) -> Result<Vec<Role>, sqlx::Error> {
                let sql = format!(
                    "SELECT r.id, r.{}, r.status, r.create_time, r.update_time \
                     FROM sys_role r JOIN sys_user_role ur ON ur.role_id = r.id \
                     WHERE ur.user_id = {} ORDER BY r.id",
                    D.quote("name"),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, Role>(&sql)
                    .bind(user_id)
                    .fetch_all(pool)
                    .await
            }

            pub async fn role_permissions_for_user(
                pool: &$pool,
                user_id: &str,
            ) -> Result<Vec<(String, Permission)>, sqlx::Error> {
                let sql = format!(
                    "SELECT rp.role_id, {} \
                     FROM sys_role_permission rp \
                     JOIN sys_user_role ur ON ur.role_id = rp.role_id \
                     JOIN sys_permission p ON p.id = rp.permission_id \
                     WHERE ur.user_id = {} ORDER BY rp.role_id, p.id",
                    permission_columns("p", D),
                    D.placeholder(1)
                );
                let rows = sqlx::query(&sql).bind(user_id).fetch_all(pool).await?;

                let mut result = Vec::with_capacity(rows.len());
                for row in rows {
                    let role_id: String = row.try_get("role_id")?;
                    let permission = Permission {
                        id: row.try_get("id")?,
                        name: row.try_get("name")?,
                        name_en: row.try_get("name_en")?,
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
                pool: &$pool,
                user_id: &str,
            ) -> Result<Vec<Permission>, sqlx::Error> {
                let sql = format!(
                    "SELECT {} FROM sys_permission p \
                     JOIN sys_user_permission up ON up.permission_id = p.id \
                     WHERE up.user_id = {} ORDER BY p.id",
                    permission_columns("p", D),
                    D.placeholder(1)
                );
                sqlx::query_as::<_, Permission>(&sql)
                    .bind(user_id)
                    .fetch_all(pool)
                    .await
            }

            pub async fn count_enabled_supers(pool: &$pool) -> Result<i64, sqlx::Error> {
                sqlx::query_scalar(
                    "SELECT count(*) FROM sys_user u \
                     JOIN sys_user_role ur ON ur.user_id = u.id \
                     WHERE ur.role_id = 'super' AND u.status = '1'",
                )
                .fetch_one(pool)
                .await
            }

            pub async fn has_role(
                pool: &$pool,
                user_id: &str,
                role_id: &str,
            ) -> Result<bool, sqlx::Error> {
                let sql = format!(
                    "SELECT count(*) FROM sys_user_role WHERE user_id = {} AND role_id = {}",
                    D.placeholder(1),
                    D.placeholder(2)
                );
                let count: i64 = sqlx::query_scalar(&sql)
                    .bind(user_id)
                    .bind(role_id)
                    .fetch_one(pool)
                    .await?;
                Ok(count > 0)
            }

            pub async fn set_password(
                pool: &$pool,
                id: &str,
                password_hash: &str,
                must_change_password: bool,
                token_version: i32,
            ) -> Result<(), sqlx::Error> {
                let now = D.now();
                let sql = format!(
                    "UPDATE sys_user SET {} = {}, must_change_password = {}, \
                     token_version = {}, update_time = {now}, version = version + 1 \
                     WHERE id = {}",
                    D.quote("password"),
                    D.placeholder(1),
                    D.placeholder(2),
                    D.placeholder(3),
                    D.placeholder(4)
                );
                sqlx::query(&sql)
                    .bind(password_hash)
                    .bind(must_change_password)
                    .bind(token_version)
                    .bind(id)
                    .execute(pool)
                    .await?;
                Ok(())
            }

            pub async fn bump_token_version(
                pool: &$pool,
                id: &str,
            ) -> Result<(), sqlx::Error> {
                let sql = format!(
                    "UPDATE sys_user SET token_version = token_version + 1, \
                     update_time = {} WHERE id = {}",
                    D.now(),
                    D.placeholder(1)
                );
                sqlx::query(&sql).bind(id).execute(pool).await?;
                Ok(())
            }

            pub async fn bump_token_version_by_username(
                pool: &$pool,
                username: &str,
            ) -> Result<(), sqlx::Error> {
                let sql = format!(
                    "UPDATE sys_user SET token_version = token_version + 1, \
                     update_time = {} WHERE username = {}",
                    D.now(),
                    D.placeholder(1)
                );
                sqlx::query(&sql).bind(username).execute(pool).await?;
                Ok(())
            }
        }
    };
}

users_repository!(pg, sqlx::PgPool, Dialect::Postgres);
users_repository!(my, sqlx::MySqlPool, Dialect::MySql);
users_repository!(sqlite, sqlx::SqlitePool, Dialect::Sqlite);

pub async fn find_by_username(db: &Db, username: &str) -> Result<Option<User>, sqlx::Error> {
    dispatch_db!(db, find_by_username(username))
}

pub async fn find_by_id(db: &Db, id: &str) -> Result<Option<User>, sqlx::Error> {
    dispatch_db!(db, find_by_id(id))
}

pub async fn exists_username(db: &Db, username: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, exists_username(username))
}

pub async fn list(db: &Db, params: &UserListParams) -> Result<(i64, Vec<User>), sqlx::Error> {
    dispatch_db!(db, list(params))
}

pub async fn create(
    db: &Db,
    user: &NewUser,
    roles: &[String],
    permissions: &[String],
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, create(user, roles, permissions))
}

pub async fn update(
    db: &Db,
    update: &UserUpdate,
    roles: Option<&[String]>,
    permissions: Option<&[String]>,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, update(update, roles, permissions))
}

pub async fn delete(db: &Db, id: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, delete(id))
}

pub async fn roles_for_user(db: &Db, user_id: &str) -> Result<Vec<Role>, sqlx::Error> {
    dispatch_db!(db, roles_for_user(user_id))
}

pub async fn role_permissions_for_user(
    db: &Db,
    user_id: &str,
) -> Result<Vec<(String, Permission)>, sqlx::Error> {
    dispatch_db!(db, role_permissions_for_user(user_id))
}

pub async fn direct_permissions_for_user(
    db: &Db,
    user_id: &str,
) -> Result<Vec<Permission>, sqlx::Error> {
    dispatch_db!(db, direct_permissions_for_user(user_id))
}

pub async fn count_enabled_supers(db: &Db) -> Result<i64, sqlx::Error> {
    dispatch_db!(db, count_enabled_supers())
}

pub async fn has_role(db: &Db, user_id: &str, role_id: &str) -> Result<bool, sqlx::Error> {
    dispatch_db!(db, has_role(user_id, role_id))
}

pub async fn set_password(
    db: &Db,
    id: &str,
    password_hash: &str,
    must_change_password: bool,
    token_version: i32,
) -> Result<(), sqlx::Error> {
    dispatch_db!(
        db,
        set_password(id, password_hash, must_change_password, token_version)
    )
}

pub async fn bump_token_version(db: &Db, id: &str) -> Result<(), sqlx::Error> {
    dispatch_db!(db, bump_token_version(id))
}

pub async fn bump_token_version_by_username(
    db: &Db,
    username: &str,
) -> Result<(), sqlx::Error> {
    dispatch_db!(db, bump_token_version_by_username(username))
}
