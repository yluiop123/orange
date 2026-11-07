> [English](./API.md) | 简体中文

# API 契约

本文档与技术栈无关。它是 `backend/` 中每个后端都必须实现、`frontend/` 中每个前端都可以依赖的契约。

机器可读的源文件：[`contracts/openapi.json`](../contracts/openapi.json)。

## 1. 基础约定

| 项目 | 值 |
| --- | --- |
| 基础路径 | `/api/v1` |
| 认证 | `Authorization: Bearer <access-token>` |
| 刷新 | HttpOnly cookie `refresh_token`，路径 `/api/v1/auth` |
| 内容类型 | `application/json; charset=UTF-8` |
| 时间格式 | 带时区偏移的 ISO-8601，例如 `2026-11-03T08:00:00+08:00` |
| 语言头 | `Locale: zh` 或 `en`（可选；仅影响消息文案） |

CORS 必须允许前端源并携带凭据，因为 refresh cookie 是 HttpOnly 的。

## 2. 响应信封

每个响应（包括错误响应）都使用相同的结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1762137600000,
  "traceId": "9f8c1b2d3e4f5a6b"
}
```

`code` 是业务码；HTTP 状态是传输层状态。客户端将 `code != 200` 视为失败。

| code | HTTP | 含义 |
| --- | --- | --- |
| 200 | 200 | 成功 |
| 40001 | 400 | 请求格式错误 |
| 40002 | 400 | 校验失败 |
| 40101 | 401 | 未认证或令牌已过期 |
| 40301 | 403 | 无权限 |
| 40302 | 403 | 必须先修改初始密码 |
| 40401 | 404 | 资源不存在 |
| 40501 | 405 | 方法不允许 |
| 40901 | 409 | 冲突（重复数据或数据被引用） |
| 429 | 429 | 登录尝试过多；账号/IP 被临时锁定 |
| 50000 | 500 | 意外错误 |

`traceId` 还必须通过 `X-Trace-Id` 响应头返回。错误响应携带的 `traceId` 与服务端日志中的一致。

## 3. 认证

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 公开 | Body `{ "username": "...", "password": "..." }`。返回 `{ token, expiresIn, refreshExpiresIn }` 并设置 refresh cookie。 |
| POST | `/api/v1/auth/refresh` | refresh cookie | 轮换 refresh token，返回新的访问令牌。重放旧的 refresh token 会返回 401。 |
| POST | `/api/v1/auth/logout` | bearer | 撤销 refresh token（若存在）并递增 `token_version`，从而使该用户的所有会话失效。清除 refresh cookie。 |
| GET | `/api/v1/auth/user-info` | bearer | 返回当前用户、角色和权限。 |
| POST | `/api/v1/auth/change-password` | bearer | Body `{ "oldPassword": "...", "newPassword": "..." }`。撤销其他会话。 |
| GET | `/api/v1/auth/menus` | bearer | 返回已启用的菜单树。 |

每个后端都必须保留的规则：

- 访问令牌有效期短，由前端保存在内存中。
- refresh token 是 HttpOnly 的，每次刷新都会轮换，并且之前的 `jti` 会被撤销。
- `sys_user.token_version` 会被写入令牌。递增它会使用户所有现存令牌失效。
- `must_change_password = true` 时，除 `user-info`、`menus`、`change-password` 和 `logout` 之外的所有端点都返回 `40302`。
- 登录锁定：15 分钟内每个用户 5 次失败、每个 IP 20 次失败；两者均锁定 15 分钟。计数器存储在 `sys_login_attempt` 中。
- 密码使用 BCrypt 存储。新建或重置的密码是 12 位临时密码，并会设置 `must_change_password = true`。

### `user-info` 结构

```json
{
  "id": "uuid",
  "name": "Super Admin",
  "username": "super",
  "email": "super@example.com",
  "groupId": "00",
  "groupName": "总公司",
  "phone": "13800000000",
  "status": "1",
  "mustChangePassword": false,
  "roles": [{ "id": "super", "name": "Super" }],
  "userPermissions": [{ "type": "menu", "path": "/profile", "action": null }],
  "rolePermissions": [{ "role": "super", "type": "menu", "path": "/system/user", "action": null }]
}
```

前端通过把 `userPermissions` 与所选角色的 `rolePermissions` 合并来得到自己的视图。后端的权限集合始终是**所有已启用角色加直接权限**的并集，再减去已禁用的权限；切换角色永远不会降低后端的权限。

## 4. 分页与查询

分页的列表端点返回：

```json
{ "total": 42, "list": [], "page": 1, "size": 10, "totalPages": 5 }
```

树形端点（组织、权限）返回完整数组，由客户端分页。

查询参数对于可选筛选条件必须接受空字符串；`status=all` 表示不筛选。排序使用 `sort` + `direction`（`asc` / `desc`），并在服务端维护白名单。不支持的排序字段回退到 `createTime`。

已废弃的兼容参数（`filterField`、`filterValue`、`orderField`、`orderValue`）可能被 Java 后端接受，但不属于新实现的契约。

## 5. 系统管理

### 5.1 组织 — `/api/v1/system/groups`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/group` | 查询参数 `id`、`name`、`status`。文本筛选还会返回祖先节点，以保持树的形状。 |
| GET | `/{groupId}` | `menu#/system/group` | 详情 |
| PATCH | `/{groupId}` | `action#/system/group:edit` | Body `{ name, status? }`；编码不可修改 |
| PATCH | `/{groupId}/status` | `action#/system/group:edit` | Body `{ status }` |
| POST | `/children` | `action#/system/group:add` | Body `{ id, name, parentId? }` |
| DELETE | `/{groupId}` | `action#/system/group:delete` | 删除单个 |
| DELETE | `?ids=a,b` | `action#/system/group:delete` | 批量删除 |

规则：编码由数字组成；根节点为 2 位数字；子节点 = 父节点 + 2 位数字；编码不可修改；删除仍有用户的下级子树会被拒绝；禁用一个父节点要求其所有后代先被禁用（否则返回 `40901`）；整棵子树会被显式删除，且从最深节点开始。

### 5.2 权限 — `/api/v1/system/permissions`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/permission` | 查询参数 `id`、`name`、`path`、`status`、`type` |
| GET | `/{permissionId}` | `menu#/system/permission` | 详情 |
| PATCH | `/{permissionId}` | `action#/system/permission:edit` | Body `{ name?, path?, action?, status?, type? }` |
| POST | `/children` | `action#/system/permission:add` | Body `{ id, name, path, action?, type, parentId? }` |
| DELETE | `/{permissionId}` | `action#/system/permission:delete` | 删除单个 |
| DELETE | `?ids=a,b` | `action#/system/permission:delete` | 批量删除 |

规则：编码由数字组成；根节点为 4 位数字；子节点 = 父节点 + 2 位数字；`type` 为 `menu | action | directory`；`action` 仅在类型为 `action` 时必填；`path` 不能为空；`(type, path, action)` 唯一；`action` 节点不能有子节点；被角色或用户引用的子树不能删除。

### 5.3 角色 — `/api/v1/system/roles`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/role` | 查询参数 `id`、`name`、`status`、`sort`、`direction`、`page`、`size` |
| GET | `/{roleId}` | `menu#/system/role` | 详情 |
| POST | `/` | `action#/system/role:add` | Body `{ id?, name, permissions? }`；id 为空时自动生成 UUID |
| PATCH | `/{roleId}` | `action#/system/role:edit` | Body `{ name?, status?, permissions? }` |
| DELETE | `/{roleId}` | `action#/system/role:delete` | 删除单个 |
| DELETE | `?ids=a,b` | `action#/system/role:delete` | 批量删除 |

规则：id 为 `[A-Za-z0-9_-]{2,32}`；名称长度为 2–50；被用户引用的角色不能删除；只有 `super` 可以授予 `super`；直接权限必须是调用者已有权限的子集。

### 5.4 用户 — `/api/v1/system/users`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/user` | 查询参数 `keyword`、`status`、`groupId`、`sort`、`direction`、`page`、`size` |
| GET | `/{userId}` | `menu#/system/user` | 详情 |
| POST | `/` | `action#/system/user:add` | Body `{ name, username, email, groupId, phone, status?, roles?, permissions? }`。返回临时密码。 |
| PATCH | `/{userId}` | `action#/system/user:edit` | Body `{ name?, username?, email?, groupId?, phone?, status?, roles?, permissions? }`；用户名不可修改 |
| PATCH | `/{userId}/status` | `action#/system/user:edit` | Body `{ status }` |
| POST | `/{userId}/reset-password` | `action#/system/user:edit` | 返回新的临时密码 |
| DELETE | `/{userId}` | `action#/system/user:delete` | 删除单个 |
| DELETE | `?ids=a,b` | `action#/system/user:delete` | 批量删除 |

规则：用户名唯一，长度 4–50，字符集 `[A-Za-z0-9_]`；邮箱和中文手机号格式校验；组织必须存在；用户不能删除或禁用自己；必须至少保留一个已启用的 `super`；只有 `super` 可以重置 `super` 的密码。

### 5.5 操作日志 — `/api/v1/system/operation-logs`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/operation-log` | 查询参数 `username`、`path`、`status`、`from`、`to`、`page`、`size` |

只读。对 `/api/v1/system/*` 和 `/api/v1/auth/change-password` 的非 GET 请求会自动记录写入操作。GET/OPTIONS 不记录。敏感路径（`login`、`refresh`、`change-password`、`reset-password`）从不存储请求体。请求体会脱敏 `password`、`token`、`secret` 并截断到 4000 个字符；查询字符串截断到 500 个字符。默认保留 90 天。

## 6. 权限标识与权限串

权限是 `type + path + action`：

- `menu`：一个页面路径；菜单树的叶子节点。
- `directory`：覆盖路径以该目录路径开头的所有菜单。
- `action`：某个页面上的一个操作，例如 `/system/user` + `add`。

权限串是 `type#path` 或 `type#path:action`：

```text
menu#/system/user
action#/system/user:add
```

后端使用 `@PreAuthorize`/中间件校验这些字符串。菜单权限和目录权限只控制可见性；它们从不授予 API 访问权限。

## 7. 遗留端点

Java 后端仍然暴露已废弃的路由（`POST /api/v1/system/*/add`、`POST .../edit`、`POST .../addChild`、`GET .../detail/{id}`）。它们仅为兼容而存在。新实现应实现上面的规范路由；任何新前端都不得调用遗留路由。

## 8. 运维端点

`GET /healthz` 由 Go 后端实现，用于容器健康检查。它不在 `/api/v1` 之下，不属于业务契约，对其他技术栈是可选的。进程存活时它返回 `200`。
