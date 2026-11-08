[English](README.md) | 简体中文

# 数据库

一套逻辑模型，11 张表，全部以 `sys_` 为前缀。每个方言目录只有两个文件：
`ddl.sql`（建表、主外键、索引、CHECK）和 `dml.sql`（种子数据）。应用从不建表或
迁移 schema。

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

## 表结构

| 表名 | 说明 | 主要字段 | 主键 | 关联关系 |
| --- | --- | --- | --- | --- |
| `sys_group` | 组织机构 | `id`、`name`、`status`、`parent_id`、审计字段、`version` | `id` | `parent_id` 自关联；被 `sys_user.group_id` 引用 |
| `sys_permission` | 菜单、目录与动作权限 | `id`、`name`、`path`、`action`、`type`、`status`、`parent_id`、审计字段、`version` | `id` | `parent_id` 自关联；被角色/用户授权和 i18n 引用 |
| `sys_permission_i18n` | 权限名称国际化 | `permission_id`、`locale`、`name` | `(permission_id, locale)` | `permission_id` → `sys_permission.id`（`ON DELETE CASCADE`） |
| `sys_role` | 角色 | `id`、`name`、`status`、审计字段、`version` | `id` | 被 `sys_role_permission` 和 `sys_user_role` 引用 |
| `sys_role_permission` | 角色-权限授权 | `role_id`、`permission_id` | `(role_id, permission_id)` | → `sys_role.id`、`sys_permission.id`（`CASCADE`） |
| `sys_user` | 用户 | `id`、`name`、`username`、`email`、`group_id`、`phone`、`status`、`token_version`、`must_change_password`、`password`、审计字段、`version` | `id` | `group_id` → `sys_group.id`；被用户授权和用户角色引用 |
| `sys_user_permission` | 用户直属授权 | `user_id`、`permission_id` | `(user_id, permission_id)` | → `sys_user.id`、`sys_permission.id`（`CASCADE`） |
| `sys_user_role` | 用户-角色关系 | `user_id`、`role_id` | `(user_id, role_id)` | → `sys_user.id`、`sys_role.id`（`CASCADE`） |
| `sys_revoked_token` | 已吊销的 JWT | `jti`、`token_type`、`expires_at`、`create_time` | `jti` | 无外键；按 `expires_at` 建索引 |
| `sys_login_attempt` | 登录失败计数 | `attempt_key`、`failures`、`window_start`、`locked_until`、`update_time` | `attempt_key` | 无外键；`attempt_key` 形如 `ip:...` 或 `user:...` |
| `sys_operation_log` | 只读操作日志 | `id`、`trace_id`、`username`、`method`、`path`、`query_string`、`request_body`、`status`、`duration_ms`、`ip`、`create_time` | `id` | 无外键；按时间、trace、用户名建索引 |

所有业务编码都是数字字符串：组织根节点 2 位，权限根节点 4 位；每个子节点在父编码后
追加 2 位。编码既是主键也是树位置。

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
