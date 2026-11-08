English | [简体中文](README.zh-CN.md)

# Database

One logical model, eleven tables, all prefixed `sys_`. Dialect directories contain
exactly two files: `ddl.sql` (tables, keys, indexes, checks) and `dml.sql` (seed
data). The application never creates or migrates the schema.

The field definitions below follow the PostgreSQL reference. Other dialects keep
the same columns; see [Dialect differences](#dialect-differences).

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

## Table overview

| Table | Purpose |
| --- | --- |
| [`sys_group`](#sys_group--organizations) | Organizations and their tree |
| [`sys_permission`](#sys_permission--menus-directories-and-actions) | Menus, directories and action permissions |
| [`sys_permission_i18n`](#sys_permission_i18n--localized-permission-names) | Localized permission names |
| [`sys_role`](#sys_role--roles) | Roles |
| [`sys_role_permission`](#sys_role_permission--role-to-permission-grants) | Role-to-permission grants |
| [`sys_user`](#sys_user--users) | Users |
| [`sys_user_permission`](#sys_user_permission--direct-user-grants) | Direct user grants |
| [`sys_user_role`](#sys_user_role--user-to-role-assignments) | User-to-role assignments |
| [`sys_revoked_token`](#sys_revoked_token--revoked-jwt-ids) | Revoked JWT ids |
| [`sys_login_attempt`](#sys_login_attempt--login-lockout-counters) | Login lockout counters |
| [`sys_operation_log`](#sys_operation_log--audit-log) | Read-only audit log |

## sys_group — organizations

Organization tree. The business code `id` is both the primary key and the tree
position.

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | Organization code; primary key |
| `name` | `varchar` | NULL | Organization name |
| `status` | `varchar` | NOT NULL, default `'1'` | `1` enabled, `0` disabled |
| `parent_id` | `varchar` | NULL | Parent organization code; `NULL` for a root |
| `create_time` | `timestamptz` | NULL, default `now()` | Created at |
| `update_time` | `timestamptz` | NULL, default `now()` | Last updated at |
| `created_by` | `varchar` | NULL | Creator |
| `updated_by` | `varchar` | NULL | Last updater |
| `version` | `int4` | NOT NULL, default `0` | Optimistic-lock version |

**Keys and checks**

- Primary key: `id`.
- Foreign key: `parent_id` → `sys_group.id`, `ON DELETE RESTRICT`.
- Check: `status IN ('0', '1')`.
- Check: `id` is numeric; a root has length 2, a child has
  `length(id) = length(parent_id) + 2` and starts with `parent_id`.
- Index: `(parent_id, id)`.

## sys_permission — menus, directories and actions

Permission tree. A permission is identified by `(type, path, action)`.

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | Permission code; primary key |
| `name` | `varchar` | NULL | Default display name |
| `path` | `varchar` | NOT NULL | Page path or API path; non-blank |
| `action` | `varchar` | NULL | Action name for `action` rows; `NULL` for menu/directory |
| `type` | `varchar` | NOT NULL | `menu`, `directory` or `action` |
| `status` | `varchar` | NOT NULL, default `'1'` | `1` enabled, `0` disabled |
| `parent_id` | `varchar` | NULL | Parent permission code; `NULL` for a root |
| `create_time` | `timestamptz` | NULL, default `now()` | Created at |
| `update_time` | `timestamptz` | NULL, default `now()` | Last updated at |
| `created_by` | `varchar` | NULL | Creator |
| `updated_by` | `varchar` | NULL | Last updater |
| `version` | `int4` | NOT NULL, default `0` | Optimistic-lock version |

**Keys and checks**

- Primary key: `id`.
- Foreign key: `parent_id` → `sys_permission.id`, `ON DELETE RESTRICT`.
- Check: `status IN ('0', '1')`.
- Check: `type IN ('menu', 'action', 'directory')`.
- Check: `btrim(path) <> ''`.
- Check: `action` is non-empty for `action` rows and `NULL` for `menu` /
  `directory` rows.
- Check: `id` is numeric; a root has length 4, a child has
  `length(id) = length(parent_id) + 2` and starts with `parent_id`.
- Unique: `(type, path, action)` where `action IS NOT NULL`; `(type, path)` where
  `action IS NULL` (two partial unique indexes in PostgreSQL).
- Index: `(parent_id, id)`.

## sys_permission_i18n — localized permission names

One row per permission and locale. The backend resolves the `Locale` header
through exact locale, language and default-name fallbacks.

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `permission_id` | `varchar` | NOT NULL | Permission code |
| `locale` | `varchar(16)` | NOT NULL | Locale tag, e.g. `zh-CN` or `en` |
| `name` | `varchar(255)` | NOT NULL | Localized display name |

**Keys and checks**

- Primary key: `(permission_id, locale)`.
- Foreign key: `permission_id` → `sys_permission.id`, `ON DELETE CASCADE`.
- No other checks; the default name remains in `sys_permission.name`.

## sys_role — roles

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `id` | `varchar` | NOT NULL | Role code; primary key |
| `name` | `varchar` | NULL | Role name |
| `status` | `varchar` | NOT NULL, default `'1'` | `1` enabled, `0` disabled |
| `create_time` | `timestamptz` | NULL, default `now()` | Created at |
| `update_time` | `timestamptz` | NULL, default `now()` | Last updated at |
| `created_by` | `varchar` | NULL | Creator |
| `updated_by` | `varchar` | NULL | Last updater |
| `version` | `int4` | NOT NULL, default `0` | Optimistic-lock version |

**Keys and checks**

- Primary key: `id`.
- Check: `status IN ('0', '1')`.

## sys_role_permission — role-to-permission grants

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `role_id` | `varchar` | NOT NULL | Role code |
| `permission_id` | `varchar` | NOT NULL | Permission code |

**Keys and checks**

- Primary key: `(role_id, permission_id)` — one grant per pair.
- Foreign key: `role_id` → `sys_role.id`, `ON DELETE CASCADE`.
- Foreign key: `permission_id` → `sys_permission.id`, `ON DELETE CASCADE`.

## sys_user — users

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `id` | `varchar(255)` | NOT NULL | User id; primary key |
| `name` | `varchar(255)` | NULL | Display name |
| `username` | `varchar(255)` | NOT NULL | Login name; unique |
| `email` | `varchar(255)` | NULL | Email address |
| `group_id` | `varchar` | NULL | Organization code |
| `phone` | `varchar(255)` | NULL | Phone number |
| `status` | `varchar(255)` | NOT NULL, default `'1'` | `1` enabled, `0` disabled |
| `token_version` | `int4` | NOT NULL, default `0` | Incrementing it invalidates old tokens |
| `must_change_password` | `bool` | NOT NULL, default `false` | Force a password change on next login |
| `version` | `int4` | NOT NULL, default `0` | Optimistic-lock version |
| `password` | `varchar` | NULL | bcrypt hash (`{bcrypt}$2a$...` or `{bcrypt}$2b$...`) |
| `create_time` | `timestamptz` | NULL, default `now()` | Created at |
| `update_time` | `timestamptz` | NULL, default `now()` | Last updated at |
| `created_by` | `varchar` | NULL | Creator |
| `updated_by` | `varchar` | NULL | Last updater |

**Keys and checks**

- Primary key: `id`.
- Unique: `username`.
- Foreign key: `group_id` → `sys_group.id` (default `NO ACTION`).
- Check: `status IN ('0', '1')`.
- Index: `group_id`.

## sys_user_permission — direct user grants

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `user_id` | `varchar` | NOT NULL | User id |
| `permission_id` | `varchar` | NOT NULL | Permission code |

**Keys and checks**

- Primary key: `(user_id, permission_id)` — one direct grant per pair.
- Foreign key: `user_id` → `sys_user.id`, `ON DELETE CASCADE`.
- Foreign key: `permission_id` → `sys_permission.id`, `ON DELETE CASCADE`.

## sys_user_role — user-to-role assignments

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `user_id` | `varchar` | NOT NULL | User id |
| `role_id` | `varchar` | NOT NULL | Role code |

**Keys and checks**

- Primary key: `(user_id, role_id)` — one assignment per pair.
- Foreign key: `user_id` → `sys_user.id`, `ON DELETE CASCADE`.
- Foreign key: `role_id` → `sys_role.id`, `ON DELETE CASCADE`.

## sys_revoked_token — revoked JWT ids

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `jti` | `varchar` | NOT NULL | JWT id; primary key |
| `token_type` | `varchar` | NOT NULL | `access` or `refresh` |
| `expires_at` | `timestamptz` | NOT NULL | Original token expiry |
| `create_time` | `timestamptz` | NOT NULL, default `now()` | Revocation time |

**Keys and checks**

- Primary key: `jti`.
- No foreign keys; expired rows can be purged by `expires_at`.
- Index: `expires_at`.

## sys_login_attempt — login lockout counters

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `attempt_key` | `varchar` | NOT NULL | `ip:<addr>` or `user:<name>`; primary key |
| `failures` | `int4` | NOT NULL, default `0` | Failed attempts in the current window |
| `window_start` | `timestamptz` | NOT NULL | Start of the counting window |
| `locked_until` | `timestamptz` | NULL | Lock expiry; `NULL` when not locked |
| `update_time` | `timestamptz` | NOT NULL, default `now()` | Last update |

**Keys and checks**

- Primary key: `attempt_key`.
- No foreign keys.
- Index: `locked_until`.

## sys_operation_log — audit log

| Field | Type | Null / default | Meaning |
| --- | --- | --- | --- |
| `id` | `bigserial` | NOT NULL | Auto-increment id; primary key |
| `trace_id` | `varchar(64)` | NULL | Request trace id |
| `username` | `varchar` | NULL | Operator; `NULL` for anonymous requests |
| `method` | `varchar` | NOT NULL | HTTP method |
| `path` | `varchar` | NOT NULL | Request path |
| `query_string` | `varchar(512)` | NULL | Query string, truncated |
| `request_body` | `text` | NULL | Masked and truncated body |
| `status` | `int4` | NOT NULL | HTTP status |
| `duration_ms` | `bigint` | NOT NULL | Duration in milliseconds |
| `ip` | `varchar` | NULL | Client IP |
| `create_time` | `timestamptz` | NOT NULL, default `now()` | Created at |

**Keys and checks**

- Primary key: `id`.
- No foreign keys; the log is read-only through the API.
- Indexes: `create_time`, `trace_id`, `username`.

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
