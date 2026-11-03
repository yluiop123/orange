> [English](./DATABASE.md) | 简体中文

# 数据库设计

各引擎的 schema 完全一致，只有方言不同。各引擎的 DDL 与种子数据如下：

| 引擎 | 目录 |
| --- | --- |
| PostgreSQL | [`database/postgres`](../database/postgres) |
| MySQL | [`database/mysql`](../database/mysql) |
| MariaDB | [`database/mariadb`](../database/mariadb) |
| SQLite | [`database/sqlite`](../database/sqlite) |
| openGauss | [`database/opengauss`](../database/opengauss) |
| OceanBase | [`database/oceanbase`](../database/oceanbase) |
| GoldenDB | [`database/goldendb`](../database/goldendb) |

每个目录都包含 `ddl.sql`、`dml.sql`，以及一个给出确切加载命令的 README。

## 1. ER 模型

```text
sys_group (tree)
  id (PK, business code)
  parent_id -> sys_group.id

sys_permission (tree)
  id (PK, business code)
  parent_id -> sys_permission.id

sys_role
  id (PK)

sys_user
  id (PK, UUID)
  group_id -> sys_group.id

sys_role_permission   (role_id, permission_id)  both FK, CASCADE
sys_user_permission   (user_id, permission_id)  both FK, CASCADE
sys_user_role         (user_id, role_id)        both FK, CASCADE

sys_revoked_token     (jti PK)
sys_login_attempt     (attempt_key PK)
sys_operation_log     (id PK)
```

这三张关联表是仅有的多对多关系。用户的权限是角色权限与直接权限的并集；关联表本身不存储生效权限。

## 2. 表

### `sys_group`

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `id` | varchar | 主键；纯数字；根节点 2 位；子节点 = 父节点 + 2 位 |
| `name` | varchar | 显示名称 |
| `status` | varchar | `'1'` 启用，`'0'` 禁用，默认 `'1'` |
| `parent_id` | varchar | 外键指向 `sys_group.id`，`ON DELETE RESTRICT` |
| `create_time`、`update_time` | timestamp with time zone | 默认为当前时间 |
| `created_by`、`updated_by` | varchar | 审计 |
| `version` | int | 乐观锁，默认 0 |

索引：`(parent_id, id)`。

### `sys_permission`

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `id` | varchar | 主键；纯数字；根节点 4 位；子节点 = 父节点 + 2 位 |
| `name` | varchar | 显示名称 |
| `path` | varchar | `NOT NULL`，非空白 |
| `action` | varchar | `menu`/`directory` 为 `NULL`；`action` 为非空白 |
| `type` | varchar | `NOT NULL`；`menu` / `action` / `directory` |
| `status` | varchar | `'1'` / `'0'` |
| `parent_id` | varchar | 外键，`ON DELETE RESTRICT` |
| 审计列 | | 同上 |

索引：

- `(parent_id, id)`。
- 唯一性标识：`(type, path, action)`，条件为 `action IS NOT NULL`。
- 唯一性标识：`(type, path)`，条件为 `action IS NULL`。

这两个部分索引用于绕开把 `NULL` 视为互不相同的 SQL 引擎。MySQL 系引擎改用存储生成列 `action_key = COALESCE(action, '')` 加单个唯一键；语义完全一致。

### `sys_role`

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `id` | varchar | 主键；应用层规则 `[A-Za-z0-9_-]{2,32}` |
| `name` | varchar | API 层为 2–50 |
| `status` | varchar | `'1'` / `'0'` |
| 审计列 | | 同上 |

### `sys_user`

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `id` | varchar | 主键；生成的 UUID |
| `name` | varchar | 显示名称 |
| `username` | varchar | `NOT NULL`，唯一 |
| `email`、`phone` | varchar | 存储层可为空 |
| `password` | varchar | BCrypt 哈希 |
| `group_id` | varchar | 外键指向 `sys_group.id` |
| `status` | varchar | `'1'` / `'0'` |
| `token_version` | int | 默认 0；自增即可吊销令牌 |
| `must_change_password` | boolean | 默认 false |
| `version` | int | 乐观锁 |
| 审计列 | | 同上 |

索引：`(group_id)`。

### 关联表

| 表 | 主键 | 外键 |
| --- | --- | --- |
| `sys_role_permission` | `(role_id, permission_id)` | 两者均 `ON DELETE CASCADE` |
| `sys_user_permission` | `(user_id, permission_id)` | 两者均 `ON DELETE CASCADE` |
| `sys_user_role` | `(user_id, role_id)` | 两者均 `ON DELETE CASCADE` |

### 认证与审计表

| 表 | 主键 / 索引 | 说明 |
| --- | --- | --- |
| `sys_revoked_token` | 主键 `jti`；索引 `expires_at` | `token_type` 为 `access` 或 `refresh` |
| `sys_login_attempt` | 主键 `attempt_key`；索引 `locked_until` | 键为 `ip:<addr>` 或 `user:<name>` |
| `sys_operation_log` | 主键 `id`；索引建在 `create_time`、`trace_id`、`username` 上 | `request_body` 已脱敏并截断 |

## 3. 不变量

以下规则由数据库强制执行，而不只是由 API 保证：

1. **编码格式** — 只能是数字；根节点长度为 2（组织）或 4（权限）；子节点长度 = 父节点 + 2；子节点以父节点编码开头。
2. **父节点存在** — `ON DELETE RESTRICT` 保证被引用的父节点仍然存在。
3. **状态** — 只能是 `'0'` 或 `'1'`。
4. **权限类型** — 只能是 `menu`、`action`、`directory`。
5. **权限 action 格式** — `action` 必须具备非空白的 action；`menu`/`directory` 要求 `action IS NULL`。
6. **权限路径** — 非空白。
7. **权限标识** — `(type, path, action)` 唯一，其中 action 为 `NULL` 时视为同一个值。
8. **用户名** — 唯一。
9. **关联行** — 复合主键防止重复授权；删除用户/角色/权限会级联删除其授权。

每个后端还必须强制执行那些需要查询才能判断的引用规则：已删除的组织子树中不能有用户；已删除的权限子树中不能有角色/用户引用；已删除的角色中不能有用户；禁用父节点时其下不能有已启用的后代；并且至少保留一个启用的 `super`。

## 4. 种子数据

`dml.sql` 会加载：

- 7 个组织（`00` 为根，6 个子节点/孙节点）。
- 48 个权限（即 `frontend/react/src/config/permissions.json` 中的目录清单）。
- 角色 `super`、`admin`、`user`。
- 授权：`super` 拥有全部 48 个；`admin` 拥有系统管理相关子集；`user` 拥有演示子集。
- 用户：`super`、`admin`、`user`，其密码为演示密码对应的 BCrypt 哈希。

`pnpm db:seed:check`（在 `frontend/react` 中）校验 `permissions.json` 与 `database/postgres/dml.sql` 是否保持同步。

种子数据按子节点优先的顺序插入组织。PostgreSQL 允许在同一条多行语句中这样插入；MySQL 系引擎需要在插入前后设置 `FOREIGN_KEY_CHECKS=0`，SQLite 则需要 `PRAGMA foreign_keys=OFF`。各引擎的 `dml.sql` 已处理这一点。

## 5. 方言矩阵

| 特性 | PostgreSQL | MySQL / MariaDB / OceanBase / GoldenDB | SQLite | openGauss |
| --- | --- | --- | --- | --- |
| Schema 前缀 | `public.` | 无 | 无 | `public.` |
| 时间戳 | `timestamptz` | `datetime(6)` | `TEXT` ISO-8601 | `timestamptz` |
| 自增 id | `bigserial` | `bigint auto_increment` | `INTEGER PRIMARY KEY AUTOINCREMENT` | `bigserial` |
| 布尔 | `bool` | `tinyint(1)` | `INTEGER` | `bool` |
| 数字校验 | 正则 `~` | `REGEXP` | `NOT GLOB '*[^0-9]*'` | 正则 `~` |
| 去空白 | `btrim` | `TRIM` | `TRIM` | `btrim` |
| 部分唯一索引 | 支持 | 不支持 → 生成列 `action_key` | 支持 | 支持（需在目标版本上核实） |
| `ON DELETE RESTRICT` | 支持 | 支持 | 需 `PRAGMA foreign_keys=ON` 才支持 | 支持 |

MySQL 系和 SQLite 的文件已在本地验证。openGauss、OceanBase 和 GoldenDB 是兼容性目标，生产使用前必须在目标版本上做冒烟测试。

## 6. 修改 schema

本项目没有迁移工具。规则如下：

1. 先修改 `database/postgres/ddl.sql` 和 `dml.sql`。
2. 把同样的改动移植到其他每个引擎。
3. 在 `PROJECT_ISSUES.md` 中记录现有数据库需要的手工同步 SQL。
4. 至少运行 PostgreSQL 集成测试，以及 SQLite/MySQL 的加载检查。

已接受的取舍：不使用 Flyway/Liquibase。schema 很小，且本项目是演示项目；引入迁移工具会带来第二个事实来源。
