# 校验规则总览

> 更新日期：2026-11-03
> 结构约束以 `database/postgres/ddl.sql` 为准；请求规则以各 `*Req` DTO 为准；编码规则以 `TreeCodePolicy` / `tree-code-policy.ts` 为准。

## 1. 分层职责

| 层 | 位置 | 负责 | 不负责 |
| --- | --- | --- | --- |
| 数据库 | `database/postgres/ddl.sql` | 任何写入路径都不该破坏的结构约束：主键、唯一、外键、CHECK | 请求形状、错误文案、跨表业务判断 |
| 后端请求 | `domain/**/req/*.java` | 单字段形状：非空、长度、枚举、正则 | 跨字段组合、引用是否存在 |
| 后端业务 | `domain/**/policy/*`、`service/**/impl/*` | 跨字段规则、树结构、引用计数、状态守卫 | HTTP 绑定与文案展示 |
| 前端 | `pages/**` + `lib/tree-code-policy.ts` | 即时反馈、减少无效请求 | 数据完整性、授权 |
| 种子脚本 | `scripts/sync-permission-seed.mjs` | `permissions.json` 与 `dml.sql` 保持一致 | 规则校验（只做同步） |

一条规则如果同时出现在多层，说明它**必须永远成立**；只出现在一层，说明它只是**某个入口的便利**。

## 2. 数据库约束

### 2.1 组织 `sys_group`

| 约束 | 类型 | 内容 | 业务含义 |
| --- | --- | --- | --- |
| `sys_group_pkey` | PK | `id` | 组织编码即主键 |
| `ck_sys_group_code` | CHECK | `id ~ '^[0-9]+$'`；根节点 `length(id)=2`；子节点 `length(id)=length(parent_id)+2` 且 `left(id, length(parent_id)) = parent_id` | 编码即同级顺序（ADR 0003） |
| `ck_sys_group_status` | CHECK | `status IN ('0','1')` | 停用值为 `0` |
| `fk_sys_group_parent` | FK | `parent_id → sys_group(id)`，`ON DELETE RESTRICT` | 有子节点时不能删父节点 |
| `idx_sys_group_parent` | 索引 | `(parent_id, id)` | 按父节点取子节点 |

其他列：`status NOT NULL DEFAULT '1'`、`version NOT NULL DEFAULT 0`、`create_time/update_time DEFAULT now()`、`name/created_by/updated_by` 可空。

### 2.2 权限 `sys_permission`

| 约束 | 类型 | 内容 | 业务含义 |
| --- | --- | --- | --- |
| `sys_permission_pkey` | PK | `id` | 权限编码即主键 |
| `ck_sys_permission_code` | CHECK | 数字；根节点 4 位；子节点 = 父编码 + 2 位 | 编码即同级顺序 |
| `ck_sys_permission_status` | CHECK | `status IN ('0','1')` | 停用值为 `0` |
| `ck_sys_permission_type` | CHECK | `type IN ('menu','action','directory')` | 三种权限类型 |
| `ck_sys_permission_path` | CHECK | `btrim(path) <> ''` | 路径不能是空白 |
| `ck_sys_permission_action_shape` | CHECK | `type='action'` 时 `action` 非空；`menu/directory` 时 `action IS NULL` | `type + path + action` 身份模型 |
| `uq_sys_permission_identity_action` | UNIQUE | `(type, path, action) WHERE action IS NOT NULL` | 动作权限身份唯一 |
| `uq_sys_permission_identity_no_action` | UNIQUE | `(type, path) WHERE action IS NULL` | 菜单/目录身份唯一 |
| `fk_sys_permission_parent` | FK | `parent_id → sys_permission(id)`，`ON DELETE RESTRICT` | 有子节点时不能删父节点 |
| `idx_sys_permission_parent` | 索引 | `(parent_id, id)` | 按父节点取子节点 |

其他列：`path NOT NULL`、`type NOT NULL`、`status NOT NULL DEFAULT '1'`；`name/action` 可空。空白 `action` 在服务层归一化为 `NULL`，数据库只存一种「没有动作」的表示。

### 2.3 角色 `sys_role`

| 约束 | 类型 | 内容 |
| --- | --- | --- |
| `sys_role_pkey` | PK | `id` |
| `ck_sys_role_status` | CHECK | `status IN ('0','1')` |

其他列：`name` 可空、`status NOT NULL DEFAULT '1'`、`version NOT NULL DEFAULT 0`。

角色编码没有数据库格式约束：真正规则在 `AddRoleReq`（`^[A-Za-z0-9_-]{2,32}$`），且允许省略后由后端生成 UUID。

### 2.4 用户 `sys_user`

| 约束 | 类型 | 内容 | 业务含义 |
| --- | --- | --- | --- |
| `sys_user_pkey` | PK | `id` | 后端生成 UUID |
| `unique_username` | UNIQUE | `username` | 登录名唯一（区分大小写） |
| `ck_sys_user_status` | CHECK | `status IN ('0','1')` | 停用值为 `0` |
| `fk_sys_user_group` | FK | `group_id → sys_group(id)`（默认 `NO ACTION`） | 组织必须存在 |
| `idx_sys_user_group` | 索引 | `(group_id)` | 按组织筛选 |

其他列：`username NOT NULL`、`status NOT NULL DEFAULT '1'`、`token_version NOT NULL DEFAULT 0`、`must_change_password NOT NULL DEFAULT false`、`version NOT NULL DEFAULT 0`；`name/email/phone/password` 可空。

### 2.5 关系表

| 表 | 主键 | 外键 |
| --- | --- | --- |
| `sys_role_permission` | `(role_id, permission_id)` | 两个方向都 `ON DELETE CASCADE` |
| `sys_user_permission` | `(user_id, permission_id)` | 两个方向都 `ON DELETE CASCADE` |
| `sys_user_role` | `(user_id, role_id)` | 两个方向都 `ON DELETE CASCADE` |

### 2.6 令牌、登录尝试、操作日志

| 表 | 约束 | 现状 |
| --- | --- | --- |
| `sys_revoked_token` | PK `jti`；索引 `expires_at` | `token_type` 只有注释（`access` / `refresh`），没有 CHECK |
| `sys_login_attempt` | PK `attempt_key`；索引 `locked_until` | `attempt_key` 只有注释（`ip:` / `user:` 前缀），没有格式 CHECK |
| `sys_operation_log` | PK `id`；索引 `create_time`、`trace_id`、`username` | `status`、`duration_ms` 没有范围 CHECK；`request_body` 为 `text` |

## 3. 数据库没有约束的地方

这些是数据库刻意不做的，或目前只在应用层保证的；列出来的目的是知道「直连 SQL 或并发写入会绕过什么」。

| 对象 | 数据库允许 | 现在由谁保证 |
| --- | --- | --- |
| 权限 `name` | `NULL`、空串 | 新增时 `@NotBlank`；编辑时 `@Size(2,50)` |
| 组织 `name` | `NULL`、空串 | `@NotBlank`（新增/编辑） |
| 角色 `name` | `NULL`、空串 | 新增 `@NotBlank + @Size(2,50)`；编辑只有 `@Size(2,50)` |
| 组织/权限编码最大深度 | 无上限，每层 +2 位 | `TreeCodePolicy` 同样没有上限 |
| 用户邮箱/手机号格式 | 任意字符串 | DTO `@Email` / `^1[3-9]\d{9}$` |
| 操作日志 `status` / `duration_ms` | 任意整数 | `OperationLogPolicy` 不校验，取响应值 |
| `token_type` | 任意字符串 | 写入方约定 |
| `failures` | 负数 | `LoginAttemptService` 只递增 |

## 4. 后端请求校验

### 4.1 通用

| DTO | 规则 |
| --- | --- |
| `StatusReq` | `status` 非空且 `^(0\|1)$` |
| `LoginReq` | `username` 非空且 `^[A-Za-z0-9_]{4,50}$`；`password` 非空 |
| `ChangePasswordReq` | `oldPassword` 非空；`newPassword` 非空、8–64 位、同时含字母和数字 |
| 各 `Delete*Req` | `ids` 非空（不校验元素是否为空串） |
| `QueryOperationLogReq` | `page ≥ 1`；`size` 1–100；`status` 空串或 3 位数字；`from/to` ISO 8601 |

### 4.2 组织

| DTO | 字段 | 规则 |
| --- | --- | --- |
| `AddChildGroupReq` | `id` | 非空，`^[0-9]{2,}$` |
| | `name` | 非空 |
| | `parentId` | 可选 |
| `EditGroupReq` | `id` | `^[A-Za-z0-9]{2,}$` |
| | `name` | 非空 |
| | `status` | 可选，`^[01]$` |
| `QueryGroupReq` | `id` | `^[A-Za-z0-9]+$` |
| | `name` | 无 |
| | `status` | `^(0\|1\|all)$` |

### 4.3 权限

| DTO | 字段 | 规则 |
| --- | --- | --- |
| `AddChildPermissionReq` | `id` | 非空，`^[0-9]{2,}$` |
| | `name` | 非空 |
| | `path` | 非空 |
| | `type` | 非空，`menu\|action\|directory` |
| | `action` | 可选（由 `PermissionShapePolicy` 二次校验） |
| | `parentId` | 可选 |
| `EditPermissionReq` | `id` | 无注解，service 要求非空 |
| | `name` | `@Size(2,50)` |
| | `path` | `@Size(max=200)`；service 拒绝空白 |
| | `status` | 可选，`^(0\|1)$` |
| | `type` | 可选，`menu\|action\|directory` |
| `QueryPermissionReq` | `status` | `^(0\|1\|all)$` |
| | `type` | `^(menu\|directory\|action\|all)$` |

### 4.4 角色

| DTO | 字段 | 规则 |
| --- | --- | --- |
| `AddRoleReq` | `id` | 可选，`^[A-Za-z0-9_-]{2,32}$`；为空时后端生成 UUID |
| | `name` | 非空，2–50 |
| | `permissions` | 可选 |
| `EditRoleReq` | `id` | 无注解，service 要求非空 |
| | `name` | `@Size(2,50)` |
| | `status` | 可选，`^(0\|1)$` |
| `QueryRoleReq` | `id/name/status` | 无 |
| | `direction` | 空串或 `asc\|desc` |
| | `page/size` | 1–10000 / 1–100 |

### 4.5 用户

| DTO | 字段 | 规则 |
| --- | --- | --- |
| `AddUserReq` | `name` | 非空，2–50 |
| | `username` | 非空，4–50，`^[A-Za-z0-9_]+$` |
| | `email` | 非空，`@Email` |
| | `groupId` | 非空 |
| | `phone` | 非空，`^1[3-9]\d{9}$` |
| | `status` | 可选，`^(0\|1)$` |
| | `roles/permissions` | 可选 |
| `EditUserReq` | `name` | `@Size(2,50)` |
| | `username` | `@Size(4,50)` + `^[A-Za-z0-9_]{4,50}$`（重复约束） |
| | `email` | `@Email` |
| | `phone` | `^1[3-9]\d{9}$` |
| | `status` | 可选，`^(0\|1)$` |
| `QueryUserReq` | `status` | 空串或 `0\|1\|all` |
| | `direction` | 空串或 `asc\|desc` |
| | `sort` | 无注解，service 用白名单兜底 |
| | `page/size` | 1–10000 / 1–100 |

## 5. 后端业务规则

| 规则 | 位置 | 失败信息 |
| --- | --- | --- |
| 组织编码：非空、数字、根 2 位、子 = 父 + 2 位 | `TreeCodePolicy.GROUP` | `组织编码…` |
| 权限编码：非空、数字、根 4 位、子 = 父 + 2 位 | `TreeCodePolicy.PERMISSION` | `权限编码…` |
| 编码唯一 | 两个 `addChild` | `…编码已存在` |
| 父节点必须存在 | 两个 `addChild` | `父组织不存在` / `父权限不存在` |
| 动作权限不能有子节点 | `PermissionServiceImpl.addChild` | `动作权限不能添加子节点` |
| 权限形状：`action` 必填、`menu/directory` 禁止 `action` | `PermissionShapePolicy` | 对应提示 |
| 空白 `action` 归一化为 `NULL` | `PermissionServiceImpl` + `ck_sys_permission_action_shape` | — |
| 权限路径不能为空白 | `PermissionServiceImpl.requirePath` + `ck_sys_permission_path` | `权限路径不能为空` |
| 权限 `(type, path, action)` 唯一（排除自身） | `assertUniquePermission` + 两个部分唯一索引 | `权限已存在`（409） |
| 组织/权限禁用前必须没有启用的后代 | `assertNoEnabledDescendants` | `请先禁用子组织/子权限` |
| 删除组织：子树内不能有用户 | `GroupServiceImpl` | `组织或其子组织下有用户，不能删除` |
| 删除权限：子树不能被子角色/用户引用 | `PermissionServiceImpl` | `权限已被…引用，不能删除` |
| 删除角色：不能有用户引用 | `RoleServiceImpl` | `角色…已被用户引用，不能删除` |
| 删除顺序：最深节点优先 | `TreeIndex.deleteOrder` | — |
| 删除组织/权限：有一个 ID 不存在即整体失败 | `GroupServiceImpl` / `PermissionServiceImpl` | `…不存在` |
| 删除角色/用户：缺失 ID 被静默忽略 | `RoleServiceImpl` / `UserServiceImpl` | 仅在全部缺失时报 `…不存在` |
| 组织/权限/角色/用户编辑：`id` 必填且存在 | 各 `edit*` | `…ID 不能为空` / `…不存在` |
| 用户名校验后不可修改 | `UserServiceImpl.editUser` | `用户名创建后不可修改` |
| 用户所属组织必须存在 | `addUser` / `editUser` | `组织不存在` |
| 不能禁用/删除当前登录用户 | `assertNotSelf` | `不能…当前登录用户` |
| 至少保留一个启用的 `super` | `assertNotLastSuper` | `系统至少需要保留一个启用的超级管理员…` |
| 只有 `super` 能重置 `super` 的密码 | `resetUser` | `无权重置超级管理员密码` |
| 新密码不能与原密码相同 | `changePassword` | `新密码不能与原密码相同` |
| 授予 `super` 角色只能由 `super` 操作 | `GrantGuard` | `只有超级管理员可以授予 super 角色` |
| 直属权限只能是授予者已有权限 | `GrantGuard` | `不能授予当前账号没有的权限` |
| 排序字段白名单；未知字段回退 `createTime` | `queryUsers` / `queryRoles` | 不报错 |
| 旧版 `filterField` 只允许白名单字段 | `queryUsers` | `不支持的过滤字段` |
| 方向只允许 `asc/desc` | `queryUsers` / `queryRoles` | `排序方向只能是 asc 或 desc` |
| 登录锁定：单用户 5 次、单 IP 20 次、窗口/锁定时长 15 分钟 | `LoginAttemptService` | 401 |
| 新增/重置密码生成 12 位临时密码，并置 `must_change_password` | `UserServiceImpl` | — |
| 重置密码递增 `token_version` 并清空登录失败计数 | `resetUser` | — |

### 5.1 操作日志写入规则

| 规则 | 位置 |
| --- | --- |
| 只记录非 `GET` / `OPTIONS`，且路径为 `/api/v1/system/*` 或 `/api/v1/auth/change-password` | `OperationLogPolicy.shouldRecord` |
| 登录、刷新、改密、重置密码不记录请求体 | `OperationLogPolicy.isSensitivePath` |
| 请求体脱敏 `password` / `token` / `secret` 字段，截断到 4000 字符 | `OperationLogPolicy.sanitizeBody` |
| 查询串截断到 500 字符 | `OperationLogPolicy.queryString` |
| 客户端 IP 取 `X-Forwarded-For` 第一跳，否则 `remoteAddr` | `OperationLogPolicy.clientIp` |
| 默认保留 90 天，每天 03:30 清理 | `OperationLogCleanupTask` |

## 6. 前端表单规则

| 表单 | 字段 | 规则 | 与后端差异 |
| --- | --- | --- | --- |
| 用户新增 | `username` | 最少 4 位 | 后端还有 50 上限和字符集 |
| | `name` | 最少 2 位 | 后端还有 50 上限 |
| | `email` | 邮箱格式 | 一致 |
| | `phone` | `^1[3-9]\d{9}$` | 一致 |
| | `groupId` | 必填 | 一致 |
| 用户编辑 | `groupId` | 可为空 | 后端空值会报「组织不存在」 |
| | `username` | 最少 4 位、禁用 | 一致 |
| 角色新增/编辑 | `id` | `^[a-zA-Z0-9]{2,}$` | 后端允许 `_`、`-`，上限 32 |
| | `name` | 最少 2 位 | 后端上限 50 |
| 组织新增 | `id` | `buildTreeCodeSchema("group")` | 与 `TreeCodePolicy` 对齐 |
| | `name` | 最少 2 位 | 后端只要求非空 |
| 权限新增/编辑 | `id` | `buildTreeCodeSchema("permission")` | 与后端对齐 |
| | `name` | 最少 2 位 | 后端新增非空、编辑 2–50 |
| | `path` | `^[a-zA-Z0-9/]{2,}$` | 后端只要求非空白，编辑上限 200 |
| 修改密码 | `newPassword` | 最少 8 位、两次一致 | 后端还有 64 上限和字母+数字 |

## 7. 三层对照（关键字段）

### `sys_group.id`

| 层 | 规则 |
| --- | --- |
| DB | 数字；根 2 位；子 = 父 + 2 位 |
| 新增 DTO | `^[0-9]{2,}$` + `TreeCodePolicy` |
| 编辑 DTO | `^[A-Za-z0-9]{2,}$`（与 DB 不一致，但编辑不修改编码） |
| 查询 DTO | `^$\|^[A-Za-z0-9]+$`（允许空串） |
| 前端 | `checkTreeCode("group")` |

### `sys_permission.id`

| 层 | 规则 |
| --- | --- |
| DB | 数字；根 4 位；子 = 父 + 2 位 |
| 新增 DTO | `^[0-9]{2,}$` + `TreeCodePolicy` |
| 编辑 DTO | 无格式约束（编码不可变） |
| 前端 | `checkTreeCode("permission")` |

### `sys_permission.path`

| 层 | 规则 |
| --- | --- |
| DB | `NOT NULL`，且 `btrim(path) <> ''` |
| 新增 DTO | 非空 |
| 编辑 DTO | `@Size(max=200)`；service 对空白值报「权限路径不能为空」 |
| 前端 | `^[a-zA-Z0-9/]{2,}$` |

### `sys_user.username`

| 层 | 规则 |
| --- | --- |
| DB | `NOT NULL` + 唯一（区分大小写） |
| 新增 DTO | 4–50，`^[A-Za-z0-9_]+$` |
| 编辑 DTO | 4–50，`^[A-Za-z0-9_]{4,50}$`，且不可修改 |
| 登录 DTO | `^[A-Za-z0-9_]{4,50}$` |
| 前端 | 最少 4 位 |

## 8. 已知不一致与缺口

### 8.1 已确认的行为问题

当前没有已确认的功能性问题。

组织列表空串筛选导致 400 的问题已修复：`QueryGroupReq.id/status` 与 `QueryPermissionReq.status/type` 都增加了 `^$` 分支，回归测试见 `SecurityIntegrationTest#emptyQueryFiltersAreAccepted`。

### 8.2 前后端正则漂移

| 字段 | 前端 | 后端 |
| --- | --- | --- |
| 角色编码 | `^[a-zA-Z0-9]{2,}$` | `^[A-Za-z0-9_-]{2,32}$` |
| 用户姓名 | 最少 2 位 | 2–50 |
| 用户名 | 最少 4 位 | 4–50 + 字符集 |
| 权限路径 | `^[a-zA-Z0-9/]{2,}$` | 非空白，最长 200 |
| 新密码 | 最少 8 位 | 8–64 + 字母和数字 |

前端比后端宽松时，用户会先看到「成功」再被后端拒绝；前端比后端严格时，某些合法值无法录入。两边应共享同一份规则，或明确「前端只做最大公约数」。

### 8.3 结构性缺口

| 问题 | 影响 |
| --- | --- |
| 编码深度无上限 | 每层增加 2 位，可写出很长的编码；索引和展示都会变差 |
| `sys_role.id` 无数据库格式约束 | 直连 SQL 可写入任意编码；应用层规则不覆盖导入/修复脚本 |
| `sys_user.status` 为 `varchar(255)`，其他表为 `varchar` | 仅类型不一致，无功能影响 |
| `token_type`、`attempt_key` 只有注释 | 直连 SQL 可写入无法解析的值 |
| `sys_operation_log.status/duration_ms` 无范围 CHECK | 异常值会进入审计数据 |
| 用户名唯一区分大小写 | `Admin` 与 `admin` 可同时存在，登录时按原样匹配 |
| `@NotEmpty` 不校验列表元素 | `ids: [""]` 会通过 DTO，再由 service 报「不存在」 |
| 删除语义不一致 | 组织/权限删除要求所有 ID 存在；角色/用户删除会静默忽略缺失 ID |

## 9. 建议的收敛顺序

1. 把前端与后端的共享规则抽成一份可对照的清单：编码、状态、类型、排序方向、密码。至少让文案与边界值一致。
2. 给审计表补最小范围 CHECK（`status`、`duration_ms`），给 `token_type` 补枚举 CHECK。
3. 明确编码最大深度（例如 6 层），同时更新 `TreeCodePolicy`、`tree-code-policy.ts` 和两个 CHECK。

已完成的收敛：

- 组织/权限查询允许空串筛选，组织列表初始加载不再返回 400。
- 权限 `(type, path, action)` 唯一性已下沉到数据库，用两个部分唯一索引覆盖「有 action」和「无 action」两种形状。
- 权限 `type`、`path` 改为 `NOT NULL`，空白路径由数据库拒绝。
- 空白 `action` 统一归一化为 `NULL`，数据库只存一种「没有动作」的表示。
- 删除了状态/类型 CHECK 里永远不会命中的 `IS NULL` 分支。SQL 的 CHECK 在表达式为 `NULL` 时视为通过，显式写 `IS NULL` 只会误导读者。

决策背景见 `docs/adr/0004-validation-layering.md`。

## 10. 相关测试与脚本

| 对象 | 位置 |
| --- | --- |
| 编码规则（后端） | `springboot/src/test/java/com/orange/domain/system/tree/TreeCodePolicyTest.java` |
| 树索引/删除顺序 | `springboot/src/test/java/com/orange/domain/system/tree/TreeIndexTest.java` |
| 有效权限 | `springboot/src/test/java/com/orange/domain/system/permission/EffectivePermissionsTest.java` |
| 编码规则（前端） | `vite-shadcn/src/lib/tree-code-policy.test.ts` |
| 权限种子同步 | `scripts/sync-permission-seed.mjs`（`pnpm db:seed:check`） |
| 接口与授权 | `springboot/src/test/java/com/orange/security/SecurityIntegrationTest.java` |
| 数据库约束（重复身份、空白路径、action 形状） | `SecurityIntegrationTest#databaseEnforcesPermissionIdentityAndShape` |
