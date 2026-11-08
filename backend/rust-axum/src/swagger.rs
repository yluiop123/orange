//! Generated OpenAPI document and the Swagger UI.
//!
//! The document is assembled by `utoipa` from the `#[utoipa::path]` attributes on
//! the handlers and the `#[derive(ToSchema)]` payload types; nothing is read from
//! the filesystem. Both routes are top-level (outside `/api/v1`), so neither the
//! auth nor the operation-log middleware wraps them.

use std::sync::OnceLock;

use axum::routing::get;
use axum::{Json, Router};
use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::openapi::{Components, OpenApi as OpenApiDocument};
use utoipa::{Modify, OpenApi};
use utoipa_swagger_ui::{Config as SwaggerUiConfig, SwaggerUi, Url};

use crate::domain::dto::{
    AddChildGroupReq, AddChildPermissionReq, AddRoleReq, AddUserReq, ChangePasswordReq,
    EditGroupReq, EditPermissionReq, EditRoleReq, EditUserReq, GroupBean, LoginReq, LoginResp,
    MenuInfo, OperationLogBean, PageData, PermissionBean, RoleBean, RoleInfo, StatusReq, UserBean,
    UserInfo, UserRoleBean,
};
use crate::response::ApiResponse;

/// Adds the `bearer_auth` HTTP security scheme; `utoipa` 5 only accepts
/// `schemas`/`responses` in `components(...)`, so the scheme is injected here.
struct BearerAuth;

impl Modify for BearerAuth {
    fn modify(&self, openapi: &mut OpenApiDocument) {
        let components = openapi.components.get_or_insert_with(Components::default);
        components.security_schemes.insert(
            "bearer_auth".to_string(),
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("JWT")
                    .build(),
            ),
        );
    }
}

/// OpenAPI 3 document covering every `/api/v1` operation.
#[derive(OpenApi)]
#[openapi(
    info(
        title = "ORANGE API",
        version = "1.0.0",
        description = "由 Rust 处理器与 DTO 上的 utoipa 注解生成，勿手工维护。"
    ),
    tags(
        (name = "auth", description = "登录、刷新、登出与当前用户"),
        (name = "menus", description = "当前用户可见菜单"),
        (name = "groups", description = "组织管理"),
        (name = "permissions", description = "权限管理"),
        (name = "roles", description = "角色管理"),
        (name = "users", description = "用户管理"),
        (name = "operation-logs", description = "操作日志")
    ),
    paths(
        crate::routes::auth::login,
        crate::routes::auth::refresh,
        crate::routes::auth::logout,
        crate::routes::auth::user_info,
        crate::routes::auth::change_password,
        crate::routes::menus::tree,
        crate::routes::groups::list,
        crate::routes::groups::get,
        crate::routes::groups::create,
        crate::routes::groups::edit,
        crate::routes::groups::update_status,
        crate::routes::groups::delete_one,
        crate::routes::groups::delete_many,
        crate::routes::permissions::list,
        crate::routes::permissions::get,
        crate::routes::permissions::create,
        crate::routes::permissions::edit,
        crate::routes::permissions::delete_one,
        crate::routes::permissions::delete_many,
        crate::routes::roles::list,
        crate::routes::roles::get,
        crate::routes::roles::create,
        crate::routes::roles::edit,
        crate::routes::roles::delete_one,
        crate::routes::roles::delete_many,
        crate::routes::users::list,
        crate::routes::users::get,
        crate::routes::users::create,
        crate::routes::users::edit,
        crate::routes::users::update_status,
        crate::routes::users::reset_password,
        crate::routes::users::delete_one,
        crate::routes::users::delete_many,
        crate::routes::operation_logs::list,
    ),
    components(schemas(
        LoginReq,
        LoginResp,
        ChangePasswordReq,
        RoleInfo,
        UserInfo,
        MenuInfo,
        StatusReq,
        GroupBean,
        AddChildGroupReq,
        EditGroupReq,
        PermissionBean,
        AddChildPermissionReq,
        EditPermissionReq,
        RoleBean,
        AddRoleReq,
        EditRoleReq,
        UserRoleBean,
        UserBean,
        AddUserReq,
        EditUserReq,
        OperationLogBean,
        PageData<RoleBean>,
        PageData<UserBean>,
        PageData<OperationLogBean>,
        ApiResponse<LoginResp>,
        ApiResponse<UserInfo>,
        ApiResponse<String>,
        ApiResponse<Vec<MenuInfo>>,
        ApiResponse<Vec<GroupBean>>,
        ApiResponse<Vec<PermissionBean>>,
        ApiResponse<GroupBean>,
        ApiResponse<PermissionBean>,
        ApiResponse<RoleBean>,
        ApiResponse<UserBean>,
        ApiResponse<PageData<RoleBean>>,
        ApiResponse<PageData<UserBean>>,
        ApiResponse<PageData<OperationLogBean>>,
        ApiResponse<serde_json::Value>,
    )),
    security(("bearer_auth" = [])),
    modifiers(&BearerAuth)
)]
pub struct ApiDoc;

/// The document is built once and reused by `/openapi.json`.
pub fn document() -> &'static OpenApiDocument {
    static DOCUMENT: OnceLock<OpenApiDocument> = OnceLock::new();
    DOCUMENT.get_or_init(ApiDoc::openapi)
}

/// `GET /openapi.json` - the generated document.
pub async fn openapi_json() -> Json<&'static OpenApiDocument> {
    Json(document())
}

/// Documentation routes: the generated document plus the Swagger UI that loads it.
pub fn router<S>() -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    Router::<S>::new()
        .route("/openapi.json", get(openapi_json))
        .merge(Router::from(
            SwaggerUi::new("/swagger").config(
                SwaggerUiConfig::new([Url::new("ORANGE API", "/openapi.json")])
                    .persist_authorization(true),
            ),
        ))
}

#[cfg(test)]
mod tests {
    use super::*;

    const PATHS: [&str; 20] = [
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/logout",
        "/api/v1/auth/user-info",
        "/api/v1/auth/menus",
        "/api/v1/auth/change-password",
        "/api/v1/system/groups",
        "/api/v1/system/groups/children",
        "/api/v1/system/groups/{groupId}",
        "/api/v1/system/groups/{groupId}/status",
        "/api/v1/system/permissions",
        "/api/v1/system/permissions/children",
        "/api/v1/system/permissions/{permissionId}",
        "/api/v1/system/roles",
        "/api/v1/system/roles/{roleId}",
        "/api/v1/system/users",
        "/api/v1/system/users/{userId}",
        "/api/v1/system/users/{userId}/status",
        "/api/v1/system/users/{userId}/reset-password",
        "/api/v1/system/operation-logs",
    ];

    fn as_json() -> serde_json::Value {
        serde_json::to_value(document()).expect("OpenAPI document must serialize")
    }

    #[test]
    fn generated_document_contains_every_path() {
        let json = as_json();
        let paths = json["paths"].as_object().expect("paths object");

        for path in PATHS {
            assert!(paths.contains_key(path), "missing path {path}");
        }
        assert_eq!(paths.len(), PATHS.len(), "unexpected extra paths");
    }

    #[test]
    fn generated_document_contains_all_operations() {
        let json = as_json();
        let paths = json["paths"].as_object().expect("paths object");
        let operations = paths
            .values()
            .map(|item| {
                item.as_object()
                    .expect("path item")
                    .iter()
                    .filter(|(method, _)| {
                        matches!(method.as_str(), "get" | "post" | "put" | "patch" | "delete")
                    })
                    .count()
            })
            .sum::<usize>();

        assert_eq!(operations, 34, "expected 34 HTTP operations");
    }

    #[test]
    fn generated_document_contains_bearer_security_scheme() {
        let json = as_json();
        let scheme = &json["components"]["securitySchemes"]["bearer_auth"];

        assert_eq!(scheme["type"], "http");
        assert_eq!(scheme["scheme"], "bearer");
        assert_eq!(scheme["bearerFormat"], "JWT");

        // Protected operations declare the requirement explicitly.
        let user_info = &json["paths"]["/api/v1/auth/user-info"]["get"];
        assert_eq!(
            user_info["security"][0]["bearer_auth"],
            serde_json::json!([])
        );

        // The public login operation does not ask for a bearer token.
        let login = &json["paths"]["/api/v1/auth/login"]["post"];
        let login_security = login["security"].as_array().expect("login security");
        assert!(login_security
            .iter()
            .all(|requirement| requirement.get("bearer_auth").is_none()));
    }

    #[test]
    fn generated_document_registers_schemas() {
        let json = as_json();
        let schemas = json["components"]["schemas"]
            .as_object()
            .expect("components.schemas");

        for name in [
            "LoginReq",
            "LoginResp",
            "ChangePasswordReq",
            "UserInfo",
            "MenuInfo",
            "GroupBean",
            "AddChildGroupReq",
            "PermissionBean",
            "AddChildPermissionReq",
            "RoleBean",
            "AddRoleReq",
            "UserBean",
            "AddUserReq",
            "EditUserReq",
            "StatusReq",
            "OperationLogBean",
            "PageData_UserBean",
            "ApiResponse_UserInfo",
        ] {
            assert!(schemas.contains_key(name), "missing schema {name}");
        }

        // serde renames are reflected in the generated property names.
        let user = &schemas["UserBean"]["properties"];
        assert!(user.get("groupId").is_some());
        assert!(user.get("group_id").is_none());
        let permission = &schemas["PermissionBean"]["properties"];
        assert!(permission.get("type").is_some());
        assert!(permission.get("translations").is_some());

        // Translation maps are exposed as string-valued objects on the
        // permission response and both write payloads.
        assert_eq!(
            permission["translations"]["additionalProperties"]["type"],
            "string"
        );
        for schema in ["AddChildPermissionReq", "EditPermissionReq"] {
            assert!(
                schemas[schema]["properties"].get("translations").is_some(),
                "{schema} is missing translations"
            );
        }
    }

    #[test]
    fn generated_document_links_request_and_response_schemas() {
        let json = as_json();
        let users = &json["paths"]["/api/v1/system/users"];

        assert_eq!(
            users["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/AddUserReq"
        );
        assert_eq!(
            users["post"]["responses"]["200"]["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/ApiResponse_String"
        );
        assert_eq!(
            users["get"]["responses"]["200"]["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/ApiResponse_PageData_UserBean"
        );

        // Query parameters keep the serde camelCase names.
        let params = users["get"]["parameters"]
            .as_array()
            .expect("user list parameters");
        assert!(params
            .iter()
            .any(|param| param["name"] == "groupId" && param["in"] == "query"));
        assert!(params
            .iter()
            .any(|param| param["name"] == "keyword" && param["in"] == "query"));

        // Path parameters use the axum placeholder names.
        let status_params = json["paths"]["/api/v1/system/users/{userId}/status"]["patch"]
            ["parameters"]
            .as_array()
            .expect("status parameters");
        assert!(status_params
            .iter()
            .any(|param| param["name"] == "userId" && param["in"] == "path"));
    }

    #[test]
    fn router_builds_without_route_conflicts() {
        // `Router::route` panics on overlapping paths, so this asserts that the
        // document handler and the Swagger UI mount do not clash.
        let _: Router = router();
    }
}
