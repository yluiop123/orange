# HTTP 接口参考

本页是 [`contracts/openapi.json`](../../contracts/openapi.json) 的人工查阅版，供对接后端的前端开发者与新增或修改端点的后端开发者按需查表。

契约规模：**33 个 path、49 个 operation、15 个 deprecated → 34 个规范 operation**。Base path 为 `/api/v1`。

## 认证

认证方式为 HTTP Bearer JWT（`components.securitySchemes.bearerAuth`），请求头 `Authorization: Bearer <access token>`。除 `login`、`refresh`、`logout` 外，所有端点都要求 access token（Spring `SecurityConfig.PUBLIC_ENDPOINTS`）。

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 用户名密码登录，返回 access token 并下发 refresh cookie | 否 |
| POST | `/api/v1/auth/refresh` | 用 refresh cookie 换新 access token | 否 |
| POST | `/api/v1/auth/logout` | 吊销当前 refresh token 并清 cookie | 否 |
| POST | `/api/v1/auth/change-password` | 修改当前用户密码 | 否 |
| GET | `/api/v1/auth/user-info` | 当前用户、角色与权限 | 否 |
| GET | `/api/v1/auth/menus` | 查询菜单树 | 否 |

- `login`：请求体 `LoginReq`，成功时 `data` 为 `LoginResp`。refresh token 只通过 HttpOnly Cookie `refresh_token` 下发（Path `/api/v1/auth`，`Secure`/`SameSite` 可配置），前端 JS 读不到；有效期以响应字段 `expiresIn`、`refreshExpiresIn` 为准，Spring 默认 900 秒与 604800 秒（`application.yaml` 的 `JWT_ACCESS_EXPIRE`、`JWT_REFRESH_EXPIRE`）。凭据错误返回 HTTP 401 / 40101，且不区分用户名不存在与密码错误。
- `refresh`：无请求体，只读 `refresh_token` cookie；成功后轮换 refresh token（旧 jti 写入吊销表）并重设 cookie。cookie 缺失、已吊销或校验失败时返回 HTTP 401 / 40101 并清除 cookie。
- `logout`：吊销 refresh token 的 jti，并递增该用户的 token 版本，使其全部旧 token 失效；`data` 为 `"ok"`。
- `change-password`：请求体 `ChangePasswordReq`；成功后清 refresh cookie，旧 token 失效，需重新登录。用户带 `mustChangePassword` 时，除 `change-password`、`user-info`、`menus` 外的请求一律返回 40302（`JwtRequestFilter`）。
- `user-info`：`data` 为 `UserInfo`，含 `roles`、`rolePermissions`、`userPermissions` 与 `mustChangePassword`。三个权限集合的合并规则见 [权限模型](./permission-model.md)。
- `menus`：`data` 为 `MenuInfo[]` 菜单树，结构见下节；完整登录、刷新、登出时序见 [认证生命周期](../explanation/auth-lifecycle.md)。

### 菜单树结构

`MenuInfo` 字段：`id`（业务编码）、`path`（页面路径）、`type`（`menu` 或 `directory`）、`name`、`children`（同结构数组，叶子为空数组）。

构建规则（`MenuServiceImpl`）：只取 `status=1` 且 `type ∈ {menu, directory}` 的权限；按 `id` 升序排列；`parentId` 为空的节点作为根；父节点被禁用或不存在的分支整体丢弃，不提升为根。接口返回的是全量启用菜单，前端再按当前角色权限过滤菜单可见性。

## 按 tag 的规范端点

以下只列 34 个规范 operation 中的系统管理部分；`login-controller`（5 个）与 `菜单`（1 个）已在上节列出。

### 用户管理（8）

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/users` | 分页查询用户，支持关键词、状态、组织过滤 | 否 |
| POST | `/api/v1/system/users` | 新增用户，`data` 返回初始密码 | 否 |
| DELETE | `/api/v1/system/users` | 批量删除，query 参数 `ids` 逗号分隔 | 否 |
| GET | `/api/v1/system/users/{userId}` | 用户详情 | 否 |
| PATCH | `/api/v1/system/users/{userId}` | 编辑用户 | 否 |
| DELETE | `/api/v1/system/users/{userId}` | 删除单个用户 | 否 |
| PATCH | `/api/v1/system/users/{userId}/status` | 启用或禁用用户 | 否 |
| POST | `/api/v1/system/users/{userId}/reset-password` | 重置密码，`data` 返回临时密码 | 否 |

### 角色管理（6）

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/roles` | 分页查询角色 | 否 |
| POST | `/api/v1/system/roles` | 新增角色 | 否 |
| DELETE | `/api/v1/system/roles` | 批量删除，`ids` 逗号分隔 | 否 |
| GET | `/api/v1/system/roles/{roleId}` | 角色详情 | 否 |
| PATCH | `/api/v1/system/roles/{roleId}` | 编辑角色，含权限列表 | 否 |
| DELETE | `/api/v1/system/roles/{roleId}` | 删除单个角色 | 否 |

### 权限管理（6）

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/permissions` | 查询权限列表，按 id/name/path/status/type 过滤，不分页 | 否 |
| POST | `/api/v1/system/permissions/children` | 在指定父权限下添加子权限 | 否 |
| GET | `/api/v1/system/permissions/{permissionId}` | 权限详情 | 否 |
| PATCH | `/api/v1/system/permissions/{permissionId}` | 编辑权限 | 否 |
| DELETE | `/api/v1/system/permissions/{permissionId}` | 删除单个权限 | 否 |
| DELETE | `/api/v1/system/permissions` | 批量删除，`ids` 逗号分隔 | 否 |

### 组织管理（7）

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/groups` | 查询组织列表，按 id/name/status 过滤，不分页 | 否 |
| POST | `/api/v1/system/groups/children` | 在指定父组织下添加子组织 | 否 |
| GET | `/api/v1/system/groups/{groupId}` | 组织详情 | 否 |
| PATCH | `/api/v1/system/groups/{groupId}` | 编辑组织 | 否 |
| PATCH | `/api/v1/system/groups/{groupId}/status` | 启用或禁用组织 | 否 |
| DELETE | `/api/v1/system/groups/{groupId}` | 删除单个组织 | 否 |
| DELETE | `/api/v1/system/groups` | 批量删除，`ids` 逗号分隔 | 否 |

### 操作日志（1）

| 方法 | 路径 | 用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/operation-logs` | 按操作人、路径、状态、时间范围分页查询 | 否 |

`OperationLogBean` 的字段（`traceId`、`method`、`path`、`queryString`、`requestBody`、`status`、`durationMs`、`ip`、`createTime`）与落库表 `sys_operation_log` 的对应关系见 [数据模型](./data-model.md)。

## 已废弃端点

15 个 operation 在契约里标了 `deprecated: true`，不在规范端点集内。Spring 参考实现仍以 `@Deprecated` 保留映射，用于兼容旧前端；其余五个后端（Go、NestJS、C#、Rust、FastAPI）没有这些路由。新代码不得调用。

| 方法 | 路径 | 旧用途 | deprecated |
| --- | --- | --- | --- |
| GET | `/api/v1/system/users/detail/{userId}` | 用户详情 | 是 |
| POST | `/api/v1/system/users/add` | 新增用户 | 是 |
| POST | `/api/v1/system/users/edit` | 编辑用户 | 是 |
| POST | `/api/v1/system/users/reset/{userId}` | 重置密码 | 是 |
| GET | `/api/v1/system/roles/detail/{roleId}` | 角色详情 | 是 |
| POST | `/api/v1/system/roles/add` | 新增角色 | 是 |
| POST | `/api/v1/system/roles/edit` | 编辑角色 | 是 |
| POST | `/api/v1/system/permissions` | 查询权限列表 | 是 |
| POST | `/api/v1/system/permissions/addChild` | 添加子权限 | 是 |
| POST | `/api/v1/system/permissions/edit` | 编辑权限 | 是 |
| GET | `/api/v1/system/permissions/detail/{permissionId}` | 权限详情 | 是 |
| POST | `/api/v1/system/groups` | 查询组织列表 | 是 |
| POST | `/api/v1/system/groups/addChild` | 添加子组织 | 是 |
| POST | `/api/v1/system/groups/edit` | 编辑组织 | 是 |
| GET | `/api/v1/system/groups/detail/{groupId}` | 组织详情 | 是 |

## 响应包体

所有端点返回同一外层结构；`data` 的类型由端点决定。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | integer | 业务码，200 为成功 |
| `message` | string | 提示信息；成功时可能为空字符串，不要作为判断依据 |
| `data` | any | 业务数据，错误时可能为空或为校验错误映射 |
| `timestamp` | integer | 服务器毫秒时间戳 |
| `traceId` | string | 链路追踪 ID，与日志中的 trace id 一致 |

成功响应 `code=200`。成功时的 `message` 不可依赖：对象或数组响应为空字符串，字符串响应可能等于 `data`，也可能是指定提示（新增用户、重置密码）；客户端以 `code` 判断成败。校验失败（40002）的 `data` 是 `{字段名: 提示}` 映射；错误响应同样带 `timestamp` 与 `traceId`。

## 错误码

六个后端共用同一套业务码，Spring 的 `ErrorCode` 枚举是主定义，其余实现为镜像：`backend/go-gin-gorm/internal/domain/errors.go`、`backend/node-nestjs/src/common/error-code.ts`、`backend/csharp/src/Orange.Api/Domain/ErrorCodes.cs`、`backend/python-fastapi/app/errors.py`、`backend/rust-axum/src/error.rs`。HTTP 状态由业务码决定，见下表。

| code | HTTP | 含义 | 典型触发 | 来源 |
| --- | --- | --- | --- | --- |
| 200 | 200 | 成功 | — | `ErrorCode.java:5` |
| 40001 | 400 | 参数错误 | 请求体无法解析、缺少必填 query、参数类型不匹配 | `ErrorCode.java:7` |
| 40002 | 400 | 校验失败 | 请求体字段校验不通过（长度、正则、必填） | `ErrorCode.java:8` |
| 40101 | 401 | 未登录 | 缺少、过期、已吊销或签名不符的 token；登录凭据错误 | `ErrorCode.java:9` |
| 40301 | 403 | 无权限 | 已登录但缺少端点要求的 Authority | `ErrorCode.java:11` |
| 40302 | 403 | 请先修改初始密码 | `mustChangePassword` 为真且访问非白名单端点 | `ErrorCode.java:10` |
| 40401 | 404 | 数据不存在 | 路径或请求体中的 id 查不到 | `ErrorCode.java:12` |
| 40501 | 405 | 方法不允许 | 路径存在但 HTTP 方法不匹配 | `ErrorCode.java:13` |
| 40901 | 409 | 数据冲突 | 业务编码重复、被引用不能删除、乐观锁冲突 | `ErrorCode.java:14` |
| 429 | 429 | 登录失败次数过多 | 同一用户或 IP 连续登录失败触发锁定 | `LoginController.java:152` |
| 50000 | 500 | 系统异常 | 未捕获异常 | `ErrorCode.java:16` |

`ErrorCode.java` 指 `backend/springboot/src/main/java/com/orange/domain/common/ErrorCode.java`。业务异常的消息到 code 的映射规则（`GlobalExceptionHandler`）：消息含“不存在”映射为 40401，含“已存在”“已被”“不能删除”“请先禁用子组织”映射为 40901，其余映射为 40002。

## 分页与查询参数

分页端点：用户列表、角色列表、操作日志。其余列表端点（权限、组织）返回全量数组。

| 参数 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | 1–10000 | 1 | 页码，从 1 开始 |
| `size` | 1–100 | 10 | 每页数量 |
| `sort` | 字段白名单 | `createTime` | 排序字段；不在白名单时退回默认排序 |
| `direction` | `asc` / `desc` | 显式 `sort` 时为 `asc`，否则 `desc` | 排序方向 |

- 用户列表 `sort` 白名单：`id`、`name`、`username`、`email`、`status`、`createTime`、`updateTime`；角色列表白名单：`id`、`name`、`status`、`createTime`、`updateTime`。
- 契约把查询对象整体建模为单个 `req` query 参数（如 `QueryUserReq`）；实际请求按字段平铺，例如 `?page=1&size=10&status=1`。
- 操作日志另支持 `username`、`path`、`status`（三位 HTTP 状态码）、`from`、`to`（ISO-8601 时间）。
- 旧参数已标 `deprecated`，仅为兼容保留：用户列表的 `filterField`、`filterValue`、`orderField`、`orderValue`，角色列表的 `orderField`、`orderValue`。新参数缺省时后端仍会回退读取 `orderField`/`orderValue`，新代码不要使用。
- 分页响应 `data`：`{total, list, page, size, totalPages}`。

## 请求字段要点

字段与约束以 `components.schemas` 为准；下表只列关键项。`components.schemas` 共 43 个 schema，未列出的请求体（`AddChildPermissionReq`、`AddChildGroupReq`、`EditRoleReq`、`QueryRoleReq`、`QueryGroupReq`、`QueryPermissionReq`、`QueryOperationLogReq` 等）按同一份 JSON 查阅。

### LoginReq / ChangePasswordReq / StatusReq

| Schema | 字段 | 约束 |
| --- | --- | --- |
| `LoginReq` | `username` | 必填，4–50 位，`^[A-Za-z0-9_]{4,50}$` |
| `LoginReq` | `password` | 必填，非空字符串 |
| `ChangePasswordReq` | `oldPassword` | 必填，非空字符串 |
| `ChangePasswordReq` | `newPassword` | 必填，8–64 位，至少含一个字母和一个数字 |
| `StatusReq` | `status` | 必填，`"0"`（禁用）或 `"1"`（启用） |

### QueryUserReq

| 字段 | 约束 | 说明 |
| --- | --- | --- |
| `keyword` | 可选 | 匹配姓名、用户名、邮箱或手机号 |
| `status` | 可选，`0` / `1` / `all` | 用户状态过滤 |
| `groupId` | 可选 | 组织业务编码 |
| `sort`、`direction` | 可选 | 见上节白名单与方向 |
| `page`、`size` | 可选 | 见上节范围与默认值 |
| `filterField`、`filterValue`、`orderField`、`orderValue` | deprecated | 旧版过滤与排序，仅兼容 |

### AddUserReq / EditUserReq

| 字段 | AddUserReq | EditUserReq | 约束 |
| --- | --- | --- | --- |
| `name` | 必填 | 可选 | 2–50 位 |
| `username` | 必填 | 可选 | 4–50 位，`^[A-Za-z0-9_]+$` |
| `email` | 必填 | 可选 | 邮箱地址（AddUserReq 标注 `format: email`） |
| `groupId` | 必填 | 可选 | 组织业务编码 |
| `phone` | 必填 | 可选 | `^1[3-9]\d{9}$` |
| `status` | 可选 | 可选 | `"0"` / `"1"` |
| `roles[]` | 可选 | 可选 | 角色 ID 数组 |
| `permissions[]` | 可选 | 可选 | 权限 ID 数组 |
| `id` | — | 可选 | 契约中存在，但请求路径的 `{userId}` 会覆盖它 |

`EditUserReq` 全部字段可选，未提交的字段保持不变；`PATCH .../status` 只提交 `status`。

### AddRoleReq

| 字段 | 约束 |
| --- | --- |
| `name` | 必填，2–50 位 |
| `id` | 可选，`^[A-Za-z0-9_-]{2,32}$`；省略时由后端生成 |
| `permissions[]` | 可选，权限 ID 数组 |

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、backend/springboot/src/main/java/com/orange/domain/common/ErrorCode.java、
> backend/springboot/src/main/java/com/orange/controller/login/LoginController.java、
> backend/springboot/src/main/java/com/orange/controller/system/UserController.java、
> backend/springboot/src/main/java/com/orange/service/system/impl/MenuServiceImpl.java、
> backend/springboot/src/main/java/com/orange/security/SecurityConfig.java、
> backend/springboot/src/main/resources/application.yaml、backend/go-gin-gorm/internal/domain/errors.go、
> backend/node-nestjs/src/common/error-code.ts、backend/csharp/src/Orange.Api/Domain/ErrorCodes.cs、
> backend/python-fastapi/app/errors.py、backend/rust-axum/src/error.rs
