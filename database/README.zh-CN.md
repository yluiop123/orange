[English](README.md) | 简体中文

# 数据库

一套逻辑模型，11 张表，全部以 `sys_` 为前缀。每个方言目录只有两个文件：
`ddl.sql`（建表、主外键、索引、CHECK）和 `dml.sql`（种子数据）。应用从不建表或
迁移 schema。

以下字段定义以 PostgreSQL 基线为准；其他方言保持相同列，差异见
[方言差异](#方言差异)。

## 方言

| 目录 | 引擎 | 状态 |
| --- | --- | --- |
| [postgres/](postgres/) | PostgreSQL 16 | 基线 schema |
| [mysql/](mysql/) | MySQL 8.0.16+ | 移植 |
| [mariadb/](mariadb/) | MariaDB 11 | 移植 |
| [sqlite/](sqlite/) | SQLite 3 | 移植 |
| [opengauss/](opengauss/) | openGauss 5/6 | 仅静态 SQL |
| [oceanbase/](oceanbase/) | OceanBase 4（MySQL 模式） | 仅静态 SQL |
| [goldendb/](goldendb/) | GoldenDB 6 | 仅静态 SQL |

CI 不运行任何数据库方言；非基线方言只能算静态审阅。

## 初始化

1. 按引擎建库（SQLite 是文件，不需要服务）。
2. 执行 `ddl.sql`。
3. 执行 `dml.sql`。

SQLite 必须在**同一个连接**里依次执行两个脚本并开启外键，因为 SQLite 的外键是
连接级设置且默认关闭。后端不建表：Spring 使用 `ddl-auto: none`，NestJS 设置
`synchronize: false`，其余实现只读现有 schema。

## 表总览

| 表名 | 说明 |
| --- | --- |
| [`sys_group`](#sys_group--组织机构表) | 组织机构树 |
| [`sys_permission`](#sys_permission--菜单目录与动作权限) | 菜单、目录与动作权限 |
| [`sys_permission_i18n`](#sys_permission_i18n--权限名称国际化) | 权限名称国际化 |
| [`sys_role`](#sys_role--角色表) | 角色 |
| [`sys_role_permission`](#sys_role_permission--角色权限授权) | 角色-权限授权 |
| [`sys_user`](#sys_user--用户表) | 用户 |
| [`sys_user_permission`](#sys_user_permission--用户直属授权) | 用户直属授权 |
| [`sys_user_role`](#sys_user_role--用户角色关系) | 用户-角色关系 |
| [`sys_revoked_token`](#sys_revoked_token--已吊销-token) | 已吊销的 JWT |
| [`sys_login_attempt`](#sys_login_attempt--登录失败计数) | 登录失败计数 |
| [`sys_operation_log`](#sys_operation_log--操作日志) | 只读操作日志 |

## sys_group — 组织机构表

组织树。业务编码 `id` 既是主键，也是树位置。

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | 组织编码；主键 |
| `name` | `varchar` | NULL | 组织名称 |
| `status` | `varchar` | NOT NULL，默认 `'1'` | `1` 启用，`0` 禁用 |
| `parent_id` | `varchar` | NULL | 父组织编码；根节点为 `NULL` |
| `create_time` | `timestamptz` | NULL，默认 `now()` | 创建时间 |
| `update_time` | `timestamptz` | NULL，默认 `now()` | 更新时间 |
| `created_by` | `varchar` | NULL | 创建人 |
| `updated_by` | `varchar` | NULL | 更新人 |
| `version` | `int4` | NOT NULL，默认 `0` | 乐观锁版本 |

**主键与校验**

- 主键：`id`。
- 外键：`parent_id` → `sys_group.id`，`ON DELETE RESTRICT`。
- 检查：`status IN ('0', '1')`。
- 检查：`id` 必须是数字；根节点长度为 2，子节点满足
  `length(id) = length(parent_id) + 2` 且以 `parent_id` 开头。
- 索引：`(parent_id, id)`。

## sys_permission — 菜单、目录与动作权限

权限树。权限身份是 `(type, path, action)`。

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | 权限编码；主键 |
| `name` | `varchar` | NULL | 默认显示名称 |
| `path` | `varchar` | NOT NULL | 页面路径或接口路径；不能为空 |
| `action` | `varchar` | NULL | `action` 行的动作名；`menu`/`directory` 行为 `NULL` |
| `type` | `varchar` | NOT NULL | `menu`、`directory` 或 `action` |
| `status` | `varchar` | NOT NULL，默认 `'1'` | `1` 启用，`0` 禁用 |
| `parent_id` | `varchar` | NULL | 父权限编码；根节点为 `NULL` |
| `create_time` | `timestamptz` | NULL，默认 `now()` | 创建时间 |
| `update_time` | `timestamptz` | NULL，默认 `now()` | 更新时间 |
| `created_by` | `varchar` | NULL | 创建人 |
| `updated_by` | `varchar` | NULL | 更新人 |
| `version` | `int4` | NOT NULL，默认 `0` | 乐观锁版本 |

**主键与校验**

- 主键：`id`。
- 外键：`parent_id` → `sys_permission.id`，`ON DELETE RESTRICT`。
- 检查：`status IN ('0', '1')`。
- 检查：`type IN ('menu', 'action', 'directory')`。
- 检查：`btrim(path) <> ''`。
- 检查：`action` 行必须是非空动作名；`menu` / `directory` 行必须为 `NULL`。
- 检查：`id` 必须是数字；根节点长度为 4，子节点满足
  `length(id) = length(parent_id) + 2` 且以 `parent_id` 开头。
- 唯一：`action IS NOT NULL` 时 `(type, path, action)` 唯一；
  `action IS NULL` 时 `(type, path)` 唯一（PostgreSQL 用两个部分唯一索引）。
- 索引：`(parent_id, id)`。

## sys_permission_i18n — 权限名称国际化

每个权限、每种语言一行。后端按 `Locale` 依次尝试精确语言、主语言和默认名称。

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `permission_id` | `varchar` | NOT NULL | 权限编码 |
| `locale` | `varchar(16)` | NOT NULL | 语言标签，如 `zh-CN`、`en` |
| `name` | `varchar(255)` | NOT NULL | 本地化显示名称 |

**主键与校验**

- 主键：`(permission_id, locale)`。
- 外键：`permission_id` → `sys_permission.id`，`ON DELETE CASCADE`。
- 无其他检查；默认名称仍保存在 `sys_permission.name`。

## sys_role — 角色表

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | 角色编码；主键 |
| `name` | `varchar` | NULL | 角色名称 |
| `status` | `varchar` | NOT NULL，默认 `'1'` | `1` 启用，`0` 禁用 |
| `create_time` | `timestamptz` | NULL，默认 `now()` | 创建时间 |
| `update_time` | `timestamptz` | NULL，默认 `now()` | 更新时间 |
| `created_by` | `varchar` | NULL | 创建人 |
| `updated_by` | `varchar` | NULL | 更新人 |
| `version` | `int4` | NOT NULL，默认 `0` | 乐观锁版本 |

**主键与校验**

- 主键：`id`。
- 检查：`status IN ('0', '1')`。

## sys_role_permission — 角色权限授权

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `role_id` | `varchar` | NOT NULL | 角色编码 |
| `permission_id` | `varchar` | NOT NULL | 权限编码 |

**主键与校验**

- 主键：`(role_id, permission_id)`——同一对角色/权限只能授权一次。
- 外键：`role_id` → `sys_role.id`，`ON DELETE CASCADE`。
- 外键：`permission_id` → `sys_permission.id`，`ON DELETE CASCADE`。

## sys_user — 用户表

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `id` | `varchar(255)` | NOT NULL | 用户 id；主键 |
| `name` | `varchar(255)` | NULL | 显示名称 |
| `username` | `varchar(255)` | NOT NULL | 登录名；唯一 |
| `email` | `varchar(255)` | NULL | 邮箱 |
| `group_id` | `varchar` | NULL | 所属组织编码 |
| `phone` | `varchar(255)` | NULL | 电话 |
| `status` | `varchar(255)` | NOT NULL，默认 `'1'` | `1` 启用，`0` 禁用 |
| `token_version` | `int4` | NOT NULL，默认 `0` | 递增后旧 token 失效 |
| `must_change_password` | `bool` | NOT NULL，默认 `false` | 下次登录是否强制改密 |
| `version` | `int4` | NOT NULL，默认 `0` | 乐观锁版本 |
| `password` | `varchar` | NULL | bcrypt 哈希（`{bcrypt}$2a$...` 或 `{bcrypt}$2b$...`） |
| `create_time` | `timestamptz` | NULL，默认 `now()` | 创建时间 |
| `update_time` | `timestamptz` | NULL，默认 `now()` | 更新时间 |
| `created_by` | `varchar` | NULL | 创建人 |
| `updated_by` | `varchar` | NULL | 更新人 |

**主键与校验**

- 主键：`id`。
- 唯一：`username`。
- 外键：`group_id` → `sys_group.id`（默认 `NO ACTION`）。
- 检查：`status IN ('0', '1')`。
- 索引：`group_id`。

## sys_user_permission — 用户直属授权

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `user_id` | `varchar` | NOT NULL | 用户 id |
| `permission_id` | `varchar` | NOT NULL | 权限编码 |

**主键与校验**

- 主键：`(user_id, permission_id)`——同一对用户/权限只能授权一次。
- 外键：`user_id` → `sys_user.id`，`ON DELETE CASCADE`。
- 外键：`permission_id` → `sys_permission.id`，`ON DELETE CASCADE`。

## sys_user_role — 用户角色关系

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `user_id` | `varchar` | NOT NULL | 用户 id |
| `role_id` | `varchar` | NOT NULL | 角色编码 |

**主键与校验**

- 主键：`(user_id, role_id)`——同一对用户/角色只能分配一次。
- 外键：`user_id` → `sys_user.id`，`ON DELETE CASCADE`。
- 外键：`role_id` → `sys_role.id`，`ON DELETE CASCADE`。

## sys_revoked_token — 已吊销 token

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `jti` | `varchar` | NOT NULL | JWT id；主键 |
| `token_type` | `varchar` | NOT NULL | `access` 或 `refresh` |
| `expires_at` | `timestamptz` | NOT NULL | 原 token 过期时间 |
| `create_time` | `timestamptz` | NOT NULL，默认 `now()` | 吊销时间 |

**主键与校验**

- 主键：`jti`。
- 无外键；可按 `expires_at` 清理过期记录。
- 索引：`expires_at`。

## sys_login_attempt — 登录失败计数

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `attempt_key` | `varchar` | NOT NULL | `ip:<地址>` 或 `user:<用户名>`；主键 |
| `failures` | `int4` | NOT NULL，默认 `0` | 当前窗口内的失败次数 |
| `window_start` | `timestamptz` | NOT NULL | 统计窗口开始时间 |
| `locked_until` | `timestamptz` | NULL | 锁定截止时间；未锁定为 `NULL` |
| `update_time` | `timestamptz` | NOT NULL，默认 `now()` | 更新时间 |

**主键与校验**

- 主键：`attempt_key`。
- 无外键。
- 索引：`locked_until`。

## sys_operation_log — 操作日志

| 字段 | 类型 | 可空 / 默认 | 含义 |
| --- | --- | --- | --- |
| `id` | `bigserial` | NOT NULL | 自增 id；主键 |
| `trace_id` | `varchar(64)` | NULL | 请求链路 id |
| `username` | `varchar` | NULL | 操作人；匿名请求为 `NULL` |
| `method` | `varchar` | NOT NULL | HTTP 方法 |
| `path` | `varchar` | NOT NULL | 请求路径 |
| `query_string` | `varchar(512)` | NULL | 查询参数，已截断 |
| `request_body` | `text` | NULL | 已脱敏并截断的请求体 |
| `status` | `int4` | NOT NULL | HTTP 状态码 |
| `duration_ms` | `bigint` | NOT NULL | 耗时（毫秒） |
| `ip` | `varchar` | NULL | 客户端 IP |
| `create_time` | `timestamptz` | NOT NULL，默认 `now()` | 创建时间 |

**主键与校验**

- 主键：`id`。
- 无外键；接口层只读。
- 索引：`create_time`、`trace_id`、`username`。

## 权限身份与种子数据

权限身份是 `(type, path, action)`：

- PostgreSQL 用两个部分唯一索引保证（有 `action` / 无 `action` 各一个）。
- MySQL 与 MariaDB 改用生成列 `action_key`。
- `menu` 与 `directory` 行的 `action` 为 `NULL`；`action` 行必须是非空动作名。

`dml.sql` 会写入权限树、`sys_permission_i18n` 中各语言名称、三个角色（`super`、
`admin`、`user`）、演示用户和角色授权。演示账号的密码与用户名相同。

[database/permissions.json](permissions.json) 是权限事实源。修改后要手工同步七个
方言 `dml.sql` 的种子区块，并同步 React/Vue 的 Mock 目录。

## 方言差异

| 关注点 | PostgreSQL | MySQL / MariaDB | SQLite |
| --- | --- | --- | --- |
| 权限唯一性 | 两个部分唯一索引 | 生成列 `action_key` + 唯一键 | 部分/唯一索引 |
| 时间类型 | `timestamptz` | `datetime` | ISO-8601 文本 |
| 日志自增 id | `bigserial` | `bigint auto_increment` | `integer primary key autoincrement` |
| 外键 | 始终生效 | InnoDB 生效 | 连接级，需要显式开启 |
| 布尔值 | `bool` | `tinyint(1)` | 整数 `0/1` |

另外三个方言沿用同一模型，但没有运行时验证。

## 延伸阅读

- [后端切库说明](../backend/README.zh-CN.md#切库)
- [仓库 README](../README.zh-CN.md)
