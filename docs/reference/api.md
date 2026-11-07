# HTTP 接口参考

查某个端点的方法、路径、返回结构、授权要求或错误码时翻这一页：`contracts/openapi.json` 里 33 个 path 的全部 49 个 operation 都在下面，废弃接口逐条标注。

## 口径

- 契约文件：`contracts/openapi.json`（OpenAPI 3.1.0，`servers: /`）。解析结果：**33 path / 49 operation / 15 deprecated → 34 个规范 operation**。
- 契约顶层只声明 5 个 tag（用户管理、操作日志、组织管理、角色管理、权限管理）；operation 上另有 `login-controller` 与 `菜单` 两个 tag，本文按 operation 实际 tag 分节。
- 契约里没有 4xx/5xx 响应定义，错误码以各后端源码为准（见下）。行为叙述（为什么这样分层）见 [后端分层与错误](../backend/layering-and-errors.md)。

## 认证与令牌

- 认证方案：`bearerAuth`，`type: http`、`scheme: bearer`、`bearerFormat: JWT`；请求头 `Authorization: Bearer <access token>`。契约 `security` 全局要求 bearer，实现上 `login`、`refresh`、`logout` 三个端点匿名可访问（`SecurityConfig.PUBLIC_ENDPOINTS`）。
- 登录响应 `data`（`LoginResp`）：`token`（access token）、`expiresIn`（秒）、`refreshExpiresIn`（秒）。默认 `jwt.access-expire: 900`、`jwt.refresh-expire: 604800`（`application.yaml`）；契约示例值 1800 只是示例。
- refresh token 只走 Cookie：名称 `refresh_token`，`HttpOnly`、`Path=/api/v1/auth`、`SameSite` 与 `Secure` 由 `COOKIE_SAME_SITE` / `COOKIE_SECURE` 决定（`RefreshTokenCookie`）。JS 不读取该 Cookie。
- `POST /auth/refresh` 轮换：旧 refresh 的 `jti` 写入 `sys_revoked_token` 后作废；失败统一 HTTP 401 + `code: 40101` 并清 Cookie。
- `POST /auth/logout` 吊销 refresh 并递增 `sys_user.token_version`；`POST /auth/change-password` 成功后同样递增，旧 access/refresh 立即失效。
- 强制改密：用户 `must_change_password = true` 时，除 `user-info`、`menus`、`change-password`、`logout` 之外的请求返回 HTTP 403 + `code: 40302`（`JwtRequestFilter.ALLOWED_BEFORE_PASSWORD_CHANGE`）。

## 响应包体

所有端点返回同一外壳（`domain/common/Response.java`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | int | 业务状态码，成功为 `200` |
| `message` | string | 提示信息；`Response.ok(String)` 时等于该字符串（如 `操作成功`），`Response.ok(对象)` 时为空串 |
| `data` | 任意 | 业务数据，失败时通常为 `null`；校验失败时是 `{字段: 消息}` |
| `timestamp` | int64 | 服务端毫秒时间戳 |
| `traceId` | string | 链路追踪 ID；被审计的写操作会把它写入 `sys_operation_log.trace_id` |

分页 `data` 结构（`PageData`）：`{total, list, page, size, totalPages}`。列表类端点（permissions、groups）不分页，`data` 直接是数组。

## 错误码

错误码在 6 个后端保持一致；Spring 枚举见 `ErrorCode.java`，Go 见 `internal/domain/errors.go`，Rust 见 `src/error.rs`。

| `code` | HTTP | 含义 | 触发点 |
| --- | --- | --- | --- |
| 40001 | 400 | 参数错误 | 请求体无法解析、缺少必填 query 参数、类型不匹配 |
| 40002 | 400 | 校验失败 | `@Valid` 字段校验失败（`data` 为字段到消息的映射）、业务校验（编码规则、状态迁移、排序方向非法等） |
| 40101 | 401 | 未登录 | 缺少/无效/过期 access token；refresh 失败 |
| 40301 | 403 | 无权限 | 缺少所需 Authority |
| 40302 | 403 | 请先修改初始密码 | `must_change_password = true` 时的非白名单请求 |
| 40401 | 404 | 数据不存在 | URL 未匹配到任何处理器（`NoResourceFoundException`）与详情查询的目标缺失 |
| 40501 | 405 | 方法不允许 | HTTP 方法不匹配 |
| 40901 | 409 | 数据冲突 | 唯一约束、乐观锁、删除受阻（“已存在/已被引用”） |
| 429 | 429 | 登录失败次数过多 | 登录限流，`LoginController` 直接使用数字 `429`，不在 `ErrorCode` 枚举内 |
| 50000 | 500 | 系统异常 | 未捕获异常 |

业务异常到错误码的映射靠消息关键字：含“不存在”→ `40401`；含“已存在/已被/不能删除/请先禁用子组织”→ `40901`；其余 → `40002`（`GlobalExceptionHandler.resolveBusinessError`）。

## 分页与过滤

- 分页端点把查询参数整体绑定为一个对象（契约里是单个 `in: query` 的 `req`，实现为 query 参数展开）。
- 默认 `page=1`、`size=10`；`size` 上限 100，`page` 上限 10000（`QueryUserReq`、`QueryOperationLogReq`）。
- 用户列表：`keyword` 前缀匹配 `name`/`username`/`email`/`phone`；`status` 取 `0`/`1`/`all`；`groupId` 前缀匹配。`sort` 允许 `id,name,username,email,status,createTime,updateTime`，默认 `createTime desc`。
- 角色列表：`id`、`name`、`status` 前缀匹配；`sort` 允许 `id,name,status,createTime,updateTime`，默认 `createTime desc`。
- 旧排序/过滤字段 `filterField`、`filterValue`、`orderField`、`orderValue` 已标 deprecated，仅用于兼容，改用 `keyword`/`sort`/`direction`。
- 权限与组织列表用 `id`/`name`（权限另有 `path`/`type`）前缀过滤；命中文本过滤时会一并返回祖先节点，前端才能保持树的层级；结果按 `id` 升序。

## 端点清单

“授权”列的字符串即所需 Authority（Spring `@PreAuthorize` 的实际取值），“登录即可”表示只校验 JWT、不校验 Authority。

### 认证与菜单（tag：login-controller、菜单）

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 登录；下发 refresh Cookie | `LoginResp` | 公开 | — |
| POST | `/api/v1/auth/refresh` | 用 refresh Cookie 换新 access token 并轮换 | `LoginResp` | 公开 | — |
| POST | `/api/v1/auth/logout` | 吊销 refresh、递增 `token_version`、清 Cookie | `String`（`"ok"`） | 公开 | — |
| GET | `/api/v1/auth/user-info` | 当前用户、角色、角色权限、直属权限 | `UserInfo` | 登录即可 | — |
| POST | `/api/v1/auth/change-password` | 改密；旧 token 全部失效 | `String`（提示语） | 登录即可 | — |
| GET | `/api/v1/auth/menus` | 全部启用的菜单与目录树 | `List<MenuInfo>` | 登录即可 | — |

### 用户管理

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/system/users` | 分页查询用户 | `PageData<UserBean>` | `menu#/system/user` | — |
| GET | `/api/v1/system/users/{userId}` | 用户详情（角色 + 直属权限 id） | `UserBean` | `menu#/system/user` | — |
| POST | `/api/v1/system/users` | 新增用户，`data` 为一次性初始密码 | `String` | `action#/system/user:add` | — |
| PATCH | `/api/v1/system/users/{userId}` | 编辑用户（用户名不可改） | `String` | `action#/system/user:edit` | — |
| PATCH | `/api/v1/system/users/{userId}/status` | 启用/禁用，body `{"status":"0"\|"1"}` | `String` | `action#/system/user:edit` | — |
| POST | `/api/v1/system/users/{userId}/reset-password` | 重置密码，`data` 为临时密码 | `String` | `action#/system/user:edit` | — |
| DELETE | `/api/v1/system/users/{userId}` | 删除单个用户 | `String` | `action#/system/user:delete` | — |
| DELETE | `/api/v1/system/users` | 批量删除，`?ids=` 逗号分隔 | `String` | `action#/system/user:delete` | — |
| GET | `/api/v1/system/users/detail/{userId}` | 查询用户详情（旧） | `UserBean` | `menu#/system/user` | 是 |
| POST | `/api/v1/system/users/add` | 新增用户（旧） | `String` | `action#/system/user:add` | 是 |
| POST | `/api/v1/system/users/edit` | 编辑用户（旧），body 需带 `id` | `String` | `action#/system/user:edit` | 是 |
| POST | `/api/v1/system/users/reset/{userId}` | 重置密码（旧） | `String` | `action#/system/user:edit` | 是 |

### 角色管理

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/system/roles` | 分页查询角色 | `PageData<RoleBean>` | `menu#/system/role` | — |
| GET | `/api/v1/system/roles/{roleId}` | 角色详情（`permissions` 为权限 id 数组） | `RoleBean` | `menu#/system/role` | — |
| POST | `/api/v1/system/roles` | 新增角色，`id` 缺省时生成 UUID，`data` 为角色 id | `String` | `action#/system/role:add` | — |
| PATCH | `/api/v1/system/roles/{roleId}` | 编辑角色 | `String` | `action#/system/role:edit` | — |
| DELETE | `/api/v1/system/roles` | 批量删除，`?ids=` 逗号分隔 | `String` | `action#/system/role:delete` | — |
| DELETE | `/api/v1/system/roles/{roleId}` | 删除单个角色 | `String` | `action#/system/role:delete` | — |
| GET | `/api/v1/system/roles/detail/{roleId}` | 查询角色详情（旧） | `RoleBean` | `menu#/system/role` | 是 |
| POST | `/api/v1/system/roles/add` | 新增角色（旧） | `String` | `action#/system/role:add` | 是 |
| POST | `/api/v1/system/roles/edit` | 编辑角色（旧） | `String` | `action#/system/role:edit` | 是 |

### 权限管理

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/system/permissions` | 权限平铺列表（文本过滤时补祖先） | `List<PermissionBean>` | `menu#/system/permission` | — |
| GET | `/api/v1/system/permissions/{permissionId}` | 权限详情 | `PermissionBean` | `menu#/system/permission` | — |
| POST | `/api/v1/system/permissions/children` | 新增子权限，body `AddChildPermissionReq` | `PermissionBean` | `action#/system/permission:add` | — |
| PATCH | `/api/v1/system/permissions/{permissionId}` | 编辑权限 | `String` | `action#/system/permission:edit` | — |
| DELETE | `/api/v1/system/permissions` | 批量删除，`?ids=` 逗号分隔 | `String` | `action#/system/permission:delete` | — |
| DELETE | `/api/v1/system/permissions/{permissionId}` | 删除单个权限 | `String` | `action#/system/permission:delete` | — |
| POST | `/api/v1/system/permissions` | 查询权限列表（旧），参数在 body | `List<PermissionBean>` | `menu#/system/permission` | 是 |
| GET | `/api/v1/system/permissions/detail/{permissionId}` | 查询权限详情（旧） | `PermissionBean` | `menu#/system/permission` | 是 |
| POST | `/api/v1/system/permissions/addChild` | 添加子权限（旧） | `PermissionBean` | `action#/system/permission:add` | 是 |
| POST | `/api/v1/system/permissions/edit` | 编辑权限（旧） | `String` | `action#/system/permission:edit` | 是 |

### 组织管理

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/system/groups` | 组织平铺列表（文本过滤时补祖先） | `List<GroupBean>` | `menu#/system/group` | — |
| GET | `/api/v1/system/groups/{groupId}` | 组织详情 | `GroupBean` | `menu#/system/group` | — |
| POST | `/api/v1/system/groups/children` | 新增子组织，body `AddChildGroupReq` | `GroupBean` | `action#/system/group:add` | — |
| PATCH | `/api/v1/system/groups/{groupId}` | 编辑组织，body 必须含 `name` | `String` | `action#/system/group:edit` | — |
| PATCH | `/api/v1/system/groups/{groupId}/status` | 启用/禁用，body `{"status":"0"\|"1"}` | `String` | `action#/system/group:edit` | — |
| DELETE | `/api/v1/system/groups` | 批量删除，`?ids=` 逗号分隔 | `String` | `action#/system/group:delete` | — |
| DELETE | `/api/v1/system/groups/{groupId}` | 删除单个组织 | `String` | `action#/system/group:delete` | — |
| POST | `/api/v1/system/groups` | 查询组织列表（旧），参数在 body | `List<GroupBean>` | `menu#/system/group` | 是 |
| GET | `/api/v1/system/groups/detail/{groupId}` | 查询组织详情（旧） | `GroupBean` | `menu#/system/group` | 是 |
| POST | `/api/v1/system/groups/edit` | 编辑组织（旧） | `String` | `action#/system/group:edit` | 是 |
| POST | `/api/v1/system/groups/addChild` | 添加子组织（旧） | `GroupBean` | `action#/system/group:add` | 是 |

### 操作日志

| 方法 | 路径 | 用途 | 返回 `data` | 授权 | 废弃 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/system/operation-logs` | 分页查询写操作审计 | `PageData<OperationLogBean>` | `menu#/system/operation-log` | — |

## 菜单树返回结构

`GET /api/v1/auth/menus` 的 `data` 是 `MenuInfo[]`，节点字段：`id`（权限 id）、`path`（页面路径）、`type`（`menu` 或 `directory`）、`name`（菜单名）、`children`（同结构数组，叶子为空数组）。只包含 `status = '1'` 的菜单与目录，按 `id` 升序拼装；父节点被禁用或不存在时整枝不进结果。可见性由前端按当前角色过滤，规则见 [权限模型](./permission-model.md)。

## 契约与实现的已知出入

- 契约顶层 `tags` 只列 5 个，`login-controller` 与 `菜单` 只出现在 operation 上。
- `LoginResp.expiresIn` 契约示例 1800，实际默认 900 秒（`jwt.access-expire`），以配置为准。
- `429` 只出现在登录限流路径，未进 `ErrorCode` 枚举；`40002` 的 `data` 是字段映射，其他错误码的 `data` 为 `null`。
- 旧接口（`/detail/{id}`、`/add`、`/edit`、`/addChild`、`/reset/{id}`、`POST /permissions`、`POST /groups`）在契约里标 `deprecated`。**只有 Spring 参考实现仍挂载**这些路由（兼容旧前端）；Go/NestJS/.NET/Rust/FastAPI 五个后端没有这些路由。新实现不要暴露它们。

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json, backend/springboot/src/main/java/com/orange/{domain/common/ErrorCode.java,controller/**,security/**}, backend/go-gin-gorm/internal/domain/errors.go, backend/rust-axum/src/error.rs, backend/springboot/src/main/resources/application.yaml
