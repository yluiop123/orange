English | [简体中文](README.zh-CN.md)

# Database

One logical model, eleven tables, all prefixed `sys_`. Dialect directories contain
exactly two files: `ddl.sql` (tables, keys, indexes, checks) and `dml.sql` (seed
data). The application never creates or migrates the schema.

## Dialects

| Directory | Engine | Status |
| --- | --- | --- |
| [postgres/](postgres/) | PostgreSQL 16 | Reference schema |
| [mysql/](mysql/) | MySQL 8.0.16+ | Port |
| [mariadb/](mariadb/) | MariaDB 11 | Port |
| [sqlite/](sqlite/) | SQLite 3 | Port |
| [opengauss/](opengauss/) | openGauss 5/6 | Static SQL only |
| [oceanbase/](oceanbase/) | OceanBase 4 (MySQL mode) | Static SQL only |
| [goldendb/](goldendb/) | GoldenDB 6 | Static SQL only |

No dialect is exercised by CI; treat the non-reference SQL as static review.

## Initialization

1. Create the database if the engine requires one (SQLite uses a file).
2. Run `ddl.sql`.
3. Run `dml.sql`.

For SQLite, run both scripts on **one connection** and enable foreign keys,
because SQLite foreign keys are per-connection and off by default. Backends do not
create tables: Spring uses `ddl-auto: none`, NestJS sets `synchronize: false`, and
the others only read the existing schema.

## Tables

| Table | Purpose | Main columns | Primary key | Relationships |
| --- | --- | --- | --- | --- |
| `sys_group` | Organizations | `id`, `name`, `status`, `parent_id`, audit columns, `version` | `id` | Self-referencing `parent_id`; referenced by `sys_user.group_id` |
| `sys_permission` | Menus, directories and actions | `id`, `name`, `path`, `action`, `type`, `status`, `parent_id`, audit columns, `version` | `id` | Self-referencing `parent_id`; referenced by role/user grants and i18n |
| `sys_permission_i18n` | Localized permission names | `permission_id`, `locale`, `name` | `(permission_id, locale)` | `permission_id` → `sys_permission.id` (`ON DELETE CASCADE`) |
| `sys_role` | Roles | `id`, `name`, `status`, audit columns, `version` | `id` | Referenced by `sys_role_permission` and `sys_user_role` |
| `sys_role_permission` | Role-to-permission grants | `role_id`, `permission_id` | `(role_id, permission_id)` | → `sys_role.id`, `sys_permission.id` (`CASCADE`) |
| `sys_user` | Users | `id`, `name`, `username`, `email`, `group_id`, `phone`, `status`, `token_version`, `must_change_password`, `password`, audit columns, `version` | `id` | `group_id` → `sys_group.id`; referenced by user grants and user-role rows |
| `sys_user_permission` | Direct user grants | `user_id`, `permission_id` | `(user_id, permission_id)` | → `sys_user.id`, `sys_permission.id` (`CASCADE`) |
| `sys_user_role` | User-to-role assignments | `user_id`, `role_id` | `(user_id, role_id)` | → `sys_user.id`, `sys_role.id` (`CASCADE`) |
| `sys_revoked_token` | Revoked JWT ids | `jti`, `token_type`, `expires_at`, `create_time` | `jti` | No foreign keys; indexed by `expires_at` |
| `sys_login_attempt` | Login lockout counters | `attempt_key`, `failures`, `window_start`, `locked_until`, `update_time` | `attempt_key` | No foreign keys; `attempt_key` is `ip:...` or `user:...` |
| `sys_operation_log` | Read-only audit log | `id`, `trace_id`, `username`, `method`, `path`, `query_string`, `request_body`, `status`, `duration_ms`, `ip`, `create_time` | `id` | No foreign keys; indexed by time, trace and username |

All business codes are numeric strings: organization roots are 2 digits and
permission roots are 4 digits; every child appends 2 digits to its parent code.
The code is both the primary key and the tree position.

## Permission identity and seed data

A permission is identified by `(type, path, action)`:

- PostgreSQL enforces it with two partial unique indexes (`action` present /
  absent).
- MySQL and MariaDB use a generated `action_key` column instead.
- `menu` and `directory` rows have `action = NULL`; `action` rows have a
  non-empty action.

`dml.sql` seeds the permission tree, the per-locale names in
`sys_permission_i18n`, the three roles (`super`, `admin`, `user`), the demo users
and the role grants. The demo password equals the username.

[database/permissions.json](permissions.json) is the permission source of truth.
When it changes, update the seed blocks in all seven dialect `dml.sql` files by
hand and keep the React/Vue mock catalogs in sync.

## Dialect differences

| Concern | PostgreSQL | MySQL / MariaDB | SQLite |
| --- | --- | --- | --- |
| Permission uniqueness | Two partial unique indexes | Generated `action_key` column + unique key | Partial/unique indexes |
| Timestamps | `timestamptz` | `datetime` | ISO-8601 text |
| Auto-increment log id | `bigserial` | `bigint auto_increment` | `integer primary key autoincrement` |
| Foreign keys | Always enforced | InnoDB enforced | Per-connection; enable explicitly |
| Boolean values | `bool` | `tinyint(1)` | Integer `0/1` |

The other three dialects follow the reference model but are not runtime-tested.

## Further reading

- [Backend database switching](../backend/README.md#switching-database)
- [Repository README](../README.md)
