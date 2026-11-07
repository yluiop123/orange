# 数据模型参考

查 `sys_*` 表的字段、约束、索引与种子数据时读这一页；建表基线是 PostgreSQL，方言差异见 [数据库方言](./db-dialects.md)。

## 口径

- 结构依据 `database/postgres/ddl.sql`，种子依据 `database/postgres/dml.sql`。
- 共 10 张表，全部 `sys_` 前缀，外键不跨 schema。
- 除 `sys_operation_log` 用 `bigserial` 自增主键外，主键都是 varchar 业务编码。

## 通用列

`sys_group`、`sys_permission`、`sys_role`、`sys_user` 共享下列列：

| 列 | 类型 | 可空 | 默认 | 语义 |
| --- | --- | --- | --- | --- |
| `create_time` | `timestamptz` | 是 | `now()` | 创建时间 |
| `update_time` | `timestamptz` | 是 | `now()` | 更新时间 |
| `created_by` | `varchar` | 是 | — | 创建人 |
| `updated_by` | `varchar` | 是 | — | 更新人 |
| `version` | `int4` | 否 | `0` | 乐观锁版本 |

这四张表的 `status` 都是 `varchar NOT NULL DEFAULT '1'` 且带 `CHECK (status IN ('0','1'))`：`'1'` 启用，`'0'` 禁用。

## 表总览

| 表 | 主键 | 外键 | 二级索引 |
| --- | --- | --- | --- |
| `sys_group` | `id` | `parent_id` → `sys_group.id`，`ON DELETE RESTRICT` | `idx_sys_group_parent(parent_id, id)` |
| `sys_permission` | `id` | `parent_id` → `sys_permission.id`，`ON DELETE RESTRICT` | `idx_sys_permission_parent(parent_id, id)` + 两个部分唯一索引 |
| `sys_role` | `id` | 无 | 无 |
| `sys_role_permission` | `(role_id, permission_id)` | 两列均 `ON DELETE CASCADE` | 无 |
| `sys_user` | `id` | `group_id` → `sys_group.id`（未声明删除动作） | `idx_sys_user_group(group_id)`；`unique_username(username)` |
| `sys_user_permission` | `(user_id, permission_id)` | 两列均 `ON DELETE CASCADE` | 无 |
| `sys_user_role` | `(user_id, role_id)` | 两列均 `ON DELETE CASCADE` | 无 |
| `sys_revoked_token` | `jti` | 无 | `idx_sys_revoked_token_expires(expires_at)` |
| `sys_login_attempt` | `attempt_key` | 无 | `idx_sys_login_attempt_locked(locked_until)` |
| `sys_operation_log` | `id`（`bigserial`） | 无 | `idx_sys_operation_log_time`、`_trace`、`_username` |

## sys_group

组织表。业务列如下，审计列与 `version` 见「通用列」。

| 列 | 类型 | 可空 | 默认 | 约束 |
| --- | --- | --- | --- | --- |
| `id` | `varchar` | 否 | — | 主键 |
| `name` | `varchar` | 是 | — | — |
| `status` | `varchar` | 否 | `'1'` | `ck_sys_group_status` |
| `parent_id` | `varchar` | 是 | — | `fk_sys_group_parent` |

`ck_sys_group_code`：`id` 必须纯数字；根节点长度 2；子节点长度 = 父 `id` 长度 + 2，且以父 `id` 为前缀。

## sys_permission

权限表，权限模型的主表。业务列如下，审计列与 `version` 见「通用列」。

| 列 | 类型 | 可空 | 默认 | 约束 |
| --- | --- | --- | --- | --- |
| `id` | `varchar` | 否 | — | 主键；`ck_sys_permission_code` |
| `name` | `varchar` | 是 | — | — |
| `path` | `varchar` | 否 | — | `ck_sys_permission_path`：`btrim(path) <> ''` |
| `action` | `varchar` | 是 | — | `ck_sys_permission_action_shape` |
| `type` | `varchar` | 否 | — | `ck_sys_permission_type`：`menu` / `action` / `directory` |
| `status` | `varchar` | 否 | `'1'` | `ck_sys_permission_status` |
| `parent_id` | `varchar` | 是 | — | `fk_sys_permission_parent` |

约束与索引：

- `ck_sys_permission_code`：`id` 纯数字；根节点长度 4；子节点长度 = 父 `id` 长度 + 2 且以父 `id` 为前缀。
- `ck_sys_permission_action_shape`：`type = 'action'` 时 `action` 非 NULL 且非空白；`type` 为 `menu` 或 `directory` 时 `action` 必须为 NULL。
- `uq_sys_permission_identity_action(type, path, action) WHERE action IS NOT NULL`。
- `uq_sys_permission_identity_no_action(type, path) WHERE action IS NULL`。

字段语义与编码规则见 [权限模型](./permission-model.md)。

## sys_role

角色表。业务列如下，审计列与 `version` 见「通用列」。

| 列 | 类型 | 可空 | 默认 | 约束 |
| --- | --- | --- | --- | --- |
| `id` | `varchar` | 否 | — | 主键 |
| `name` | `varchar` | 是 | — | — |
| `status` | `varchar` | 否 | `'1'` | `ck_sys_role_status` |

## 关系表

三张关系表都只有两列，无审计列，主键即两列组合，外键 `ON DELETE CASCADE`。

| 表 | 列 | 语义 |
| --- | --- | --- |
| `sys_role_permission` | `role_id`、`permission_id` | 角色授予的权限 |
| `sys_user_role` | `user_id`、`role_id` | 用户拥有的角色 |
| `sys_user_permission` | `user_id`、`permission_id` | 用户直属的权限 |

## sys_user

用户表。

| 列 | 类型 | 可空 | 默认 | 约束 |
| --- | --- | --- | --- | --- |
| `id` | `varchar(255)` | 否 | — | 主键 |
| `name` | `varchar(255)` | 是 | — | — |
| `username` | `varchar(255)` | 否 | — | `unique_username` |
| `email` | `varchar(255)` | 是 | — | 无唯一约束 |
| `group_id` | `varchar` | 是 | — | `fk_sys_user_group` |
| `phone` | `varchar(255)` | 是 | — | — |
| `status` | `varchar(255)` | 否 | `'1'` | `ck_sys_user_status` |
| `token_version` | `int4` | 否 | `0` | 递增后旧 token 失效 |
| `must_change_password` | `bool` | 否 | `false` | 是否强制修改密码 |
| `password` | `varchar` | 是 | — | 种子中为 `{bcrypt}` 前缀哈希 |

`id` 不受业务编码规则约束（种子用 `100000001` 这类 9 位串）。

## 令牌与登录

`sys_revoked_token`：`jti`（主键）、`token_type`（`access` / `refresh`）、`expires_at`（否）、`create_time`（否，默认 `now()`）。索引 `idx_sys_revoked_token_expires` 用于按过期时间清理。

`sys_login_attempt`：`attempt_key`（主键，形如 `ip:xxx` 或 `user:xxx`）、`failures`（否，默认 `0`）、`window_start`（否）、`locked_until`（是）、`update_time`（否，默认 `now()`）。索引 `idx_sys_login_attempt_locked` 支持按锁定截止时间查询。

## sys_operation_log

写操作审计表，只追加。

| 列 | 类型 | 可空 | 默认 | 语义 |
| --- | --- | --- | --- | --- |
| `id` | `bigserial` | 否 | 自增 | 主键 |
| `trace_id` | `varchar(64)` | 是 | — | 链路追踪 ID |
| `username` | `varchar` | 是 | — | 操作人 |
| `method` | `varchar` | 否 | — | HTTP 方法 |
| `path` | `varchar` | 否 | — | 请求路径 |
| `query_string` | `varchar(512)` | 是 | — | 查询参数 |
| `request_body` | `text` | 是 | — | 请求体，已脱敏并截断 |
| `status` | `int4` | 否 | — | HTTP 状态码 |
| `duration_ms` | `bigint` | 否 | — | 耗时毫秒 |
| `ip` | `varchar` | 是 | — | 客户端 IP |
| `create_time` | `timestamptz` | 否 | `now()` | 写入时间 |

## 关键不变量

1. 业务编码即树位置：`parent_id` 必须是 `id` 的前缀，长度差固定（组织 2 位，权限 2 位，根分别为 2 位与 4 位）。改 `id` 等于改身份，不是改显示。
2. 同级顺序由业务编码决定：查询按 `id` 排序即得兄弟节点顺序，没有排序列。
3. `path` 是权限身份：同一 `type` 下 `path`（`action` 权限再加 `action`）唯一，靠两个部分唯一索引保证。
4. `status` 只有 `'0'` / `'1'`：`'0'` 表示禁用；权限被禁用后不授予授权、不进菜单树，角色被禁用后其权限不计入。
5. `version` 是乐观锁：`NOT NULL DEFAULT 0`，更新时递增；关系表与审计表没有该列。
6. `token_version` 递增后旧 token 失效，与 `version` 用途不同。
7. 审计字段只用于记录：`sys_operation_log` 无 `update_time` / `version`，写入后不修改。
8. 删除级联只在关系表上：删角色或权限会清掉关联行，删组织被 `RESTRICT` 阻止。

## 种子数据

`dml.sql` 写入 7 行组织、48 行权限、3 行角色、67 行角色-权限、26 行用户、1 行用户-权限、5 行用户-角色。

- 组织树：根 `00`（总公司），其下 `0001` 人事部、`0002` 后勤部、`0003` 研发部；`0003` 下再挂 `000301`、`000302`、`000303`。
- 权限：6 个根节点（`0000` 仪表盘为 `directory`，`0001` 组件、`0002` 图表、`0003` 三维、`0004` 地图、`0005` 系统管理为 `menu`）；12 个操作权限挂在 `000500` 用户管理、`000501` 角色管理、`000502` 权限管理、`000503` 组织管理之下（各 `add` / `delete` / `edit`）。
- 角色：`super` 超级管理员、`admin` 管理员、`user` 用户，均启用。`super` 被授予全部 48 个权限；`admin` 只被授予 `0005` 分支的 18 个；`user` 只有 `0000` 目录权限。
- 默认账号：`000000001` / `super`、`000000002` / `admin`、`000000003` / `user`，三者 `status` 为 `'1'`、组织为 `00`、带 `{bcrypt}` 哈希。`000000001` 同时拥有 `super`、`admin`、`user` 三个角色，另有直属权限 `0000`。
- 其余 23 个用户里只有 `100000023`（`user023`）`status` 为 `'1'` 且带密码哈希；另外 22 个 `status` 为 `'0'`、`password` 为 NULL。

## 方言差异

10 张表在各方言中同名，差异集中在类型、索引写法与少量辅助列：MySQL 的 `sys_operation_log.id` 为 `bigint NOT NULL AUTO_INCREMENT`，表选项为 `ENGINE=InnoDB` 与 `utf8mb4`；PostgreSQL 用 `bigserial`、`timestamptz`、`bool`。权限身份唯一性在 PostgreSQL 由两个部分唯一索引表达；MySQL 没有部分索引，改为生成列 `action_key`（`COALESCE(action, '')`）加唯一索引 `uq_sys_permission_identity(type, path, action_key)`。逐方言对照见 [数据库方言](./db-dialects.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: database/postgres/ddl.sql, database/postgres/dml.sql, database/mysql/ddl.sql, CONTEXT.md
