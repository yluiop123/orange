//! Request and response payloads. JSON names match the Java reference and
//! `contracts/openapi.json` (camelCase).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
pub struct PageData<T> {
    pub total: i64,
    pub list: Vec<T>,
    pub page: i32,
    pub size: i32,
    #[serde(rename = "totalPages")]
    pub total_pages: i32,
}

impl<T> PageData<T> {
    pub fn new(total: i64, list: Vec<T>, page: i32, size: i32) -> Self {
        let total_pages = if size <= 0 {
            0
        } else {
            ((total + i64::from(size) - 1) / i64::from(size)) as i32
        };
        Self {
            total,
            list,
            page,
            size,
            total_pages,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct StatusReq {
    pub status: Option<String>,
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize)]
pub struct LoginReq {
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordReq {
    pub old_password: Option<String>,
    pub new_password: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResp {
    pub token: String,
    pub status: String,
    pub field: Option<String>,
    pub msg: Option<String>,
    pub expires_in: i64,
    pub refresh_expires_in: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleInfo {
    pub id: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionInfo {
    pub path: String,
    pub role: Option<String>,
    #[serde(rename = "type")]
    pub kind: String,
    pub action: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub group_name: String,
    pub phone: Option<String>,
    pub status: String,
    pub must_change_password: bool,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
    pub roles: Vec<RoleInfo>,
    pub role_permissions: Vec<PermissionInfo>,
    pub user_permissions: Vec<PermissionInfo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuInfo {
    pub id: String,
    pub path: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub name: Option<String>,
    pub children: Vec<MenuInfo>,
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default, Deserialize)]
pub struct GroupListQuery {
    pub id: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupBean {
    pub id: String,
    pub name: Option<String>,
    pub status: String,
    pub parent_id: Option<String>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddChildGroupReq {
    pub id: Option<String>,
    pub name: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditGroupReq {
    pub name: Option<String>,
    pub status: Option<String>,
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default, Deserialize)]
pub struct PermissionListQuery {
    pub id: Option<String>,
    pub name: Option<String>,
    pub path: Option<String>,
    pub status: Option<String>,
    #[serde(rename = "type")]
    pub kind: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionBean {
    pub id: String,
    pub name: Option<String>,
    pub path: String,
    pub action: Option<String>,
    #[serde(rename = "type")]
    pub kind: String,
    pub status: String,
    pub parent_id: Option<String>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddChildPermissionReq {
    pub id: Option<String>,
    pub name: Option<String>,
    pub path: Option<String>,
    pub action: Option<String>,
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditPermissionReq {
    pub name: Option<String>,
    pub path: Option<String>,
    pub action: Option<String>,
    pub status: Option<String>,
    #[serde(rename = "type")]
    pub kind: Option<String>,
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default, Deserialize)]
pub struct RoleListQuery {
    pub id: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>,
    pub sort: Option<String>,
    pub direction: Option<String>,
    pub page: Option<i32>,
    pub size: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleBean {
    pub id: String,
    pub name: Option<String>,
    pub status: String,
    pub permissions: Option<Vec<String>>,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddRoleReq {
    pub id: Option<String>,
    pub name: Option<String>,
    pub permissions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditRoleReq {
    pub name: Option<String>,
    pub status: Option<String>,
    pub permissions: Option<Vec<String>>,
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserListQuery {
    pub keyword: Option<String>,
    pub status: Option<String>,
    pub group_id: Option<String>,
    pub sort: Option<String>,
    pub direction: Option<String>,
    pub page: Option<i32>,
    pub size: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserRoleBean {
    pub id: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBean {
    pub id: String,
    pub name: Option<String>,
    pub username: String,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub group_name: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub create_time: Option<DateTime<Utc>>,
    pub update_time: Option<DateTime<Utc>>,
    pub roles: Vec<UserRoleBean>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddUserReq {
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub phone: Option<String>,
    pub status: Option<String>,
    pub roles: Option<Vec<String>>,
    pub permissions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditUserReq {
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub group_id: Option<String>,
    pub phone: Option<String>,
    pub status: Option<String>,
    pub roles: Option<Vec<String>>,
    pub permissions: Option<Vec<String>>,
}

// ---------------------------------------------------------------------------
// Operation logs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default, Deserialize)]
pub struct OperationLogQuery {
    pub username: Option<String>,
    pub path: Option<String>,
    pub status: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub page: Option<i32>,
    pub size: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationLogBean {
    pub id: i64,
    pub trace_id: Option<String>,
    pub username: Option<String>,
    pub method: String,
    pub path: String,
    pub query_string: Option<String>,
    pub request_body: Option<String>,
    pub status: i32,
    pub duration_ms: i64,
    pub ip: Option<String>,
    pub create_time: DateTime<Utc>,
}
