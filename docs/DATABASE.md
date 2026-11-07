> English | [简体中文](./DATABASE.zh-CN.md)

# Database Design

The schema is identical across engines. Only the dialect differs. Per-engine DDL and seed:

| Engine | Directory |
| --- | --- |
| PostgreSQL | [`database/postgres`](../database/postgres) |
| MySQL | [`database/mysql`](../database/mysql) |
| MariaDB | [`database/mariadb`](../database/mariadb) |
| SQLite | [`database/sqlite`](../database/sqlite) |
| openGauss | [`database/opengauss`](../database/opengauss) |
| OceanBase | [`database/oceanbase`](../database/oceanbase) |
| GoldenDB | [`database/goldendb`](../database/goldendb) |

Each directory contains `ddl.sql`, `dml.sql` and a README with the exact load command.

## 1. ER model

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

The three join tables are the only many-to-many relations. A user's permissions are the union of role permissions and direct permissions; the join tables do not store effective permissions.

## 2. Tables

### `sys_group`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | varchar | PK; digits; root 2 digits; child = parent + 2 digits |
| `name` | varchar | display name |
| `status` | varchar | `'1'` enabled, `'0'` disabled, default `'1'` |
| `parent_id` | varchar | FK to `sys_group.id`, `ON DELETE RESTRICT` |
| `create_time`, `update_time` | timestamp with time zone | defaults to now |
| `created_by`, `updated_by` | varchar | audit |
| `version` | int | optimistic lock, default 0 |

Index: `(parent_id, id)`.

### `sys_permission`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | varchar | PK; digits; root 4 digits; child = parent + 2 digits |
| `name` | varchar | display name |
| `path` | varchar | `NOT NULL`, non-blank |
| `action` | varchar | `NULL` for `menu`/`directory`; non-blank for `action` |
| `type` | varchar | `NOT NULL`; `menu` / `action` / `directory` |
| `status` | varchar | `'1'` / `'0'` |
| `parent_id` | varchar | FK, `ON DELETE RESTRICT` |
| audit columns | | same as above |

Indexes:

- `(parent_id, id)`.
- Unique identity: `(type, path, action)` where `action IS NOT NULL`.
- Unique identity: `(type, path)` where `action IS NULL`.

The two partial indexes work around SQL engines that treat `NULL` as distinct. MySQL-family engines use a stored generated `action_key = COALESCE(action, '')` and a single unique key instead; the semantics are identical.

### `sys_role`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | varchar | PK; application rule `[A-Za-z0-9_-]{2,32}` |
| `name` | varchar | 2–50 in the API |
| `status` | varchar | `'1'` / `'0'` |
| audit columns | | same |

### `sys_user`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | varchar | PK; generated UUID |
| `name` | varchar | display name |
| `username` | varchar | `NOT NULL`, unique |
| `email`, `phone` | varchar | optional at rest |
| `password` | varchar | BCrypt hash |
| `group_id` | varchar | FK to `sys_group.id` |
| `status` | varchar | `'1'` / `'0'` |
| `token_version` | int | default 0; increment to revoke tokens |
| `must_change_password` | boolean | default false |
| `version` | int | optimistic lock |
| audit columns | | same |

Index: `(group_id)`.

### Join tables

| Table | PK | FKs |
| --- | --- | --- |
| `sys_role_permission` | `(role_id, permission_id)` | both `ON DELETE CASCADE` |
| `sys_user_permission` | `(user_id, permission_id)` | both `ON DELETE CASCADE` |
| `sys_user_role` | `(user_id, role_id)` | both `ON DELETE CASCADE` |

### Auth and audit tables

| Table | PK / index | Notes |
| --- | --- | --- |
| `sys_revoked_token` | PK `jti`; index `expires_at` | `token_type` is `access` or `refresh` |
| `sys_login_attempt` | PK `attempt_key`; index `locked_until` | key is `ip:<addr>` or `user:<name>` |
| `sys_operation_log` | PK `id`; indexes on `create_time`, `trace_id`, `username` | `request_body` is redacted and truncated |

## 3. Invariants

These are enforced by the database, not only by the API:

1. **Code shape** — digits only; root length 2 (groups) or 4 (permissions); child length = parent + 2; child starts with the parent code.
2. **Parent exists** — `ON DELETE RESTRICT` keeps a referenced parent alive.
3. **Status** — only `'0'` or `'1'`.
4. **Permission type** — only `menu`, `action`, `directory`.
5. **Permission action shape** — `action` requires a non-blank action; `menu`/`directory` require `action IS NULL`.
6. **Permission path** — non-blank.
7. **Permission identity** — `(type, path, action)` is unique, with `NULL` action treated as one value.
8. **Username** — unique.
9. **Join rows** — composite primary keys prevent duplicate grants; deleting a user/role/permission cascades its grants.

Every backend must also enforce the reference rules that need queries: no users in a deleted group subtree, no role/user references in a deleted permission subtree, no users in a deleted role, no enabled descendants when disabling a parent, and at least one enabled `super`.

## 4. Seed

`dml.sql` loads:

- 7 organizations (`00` root, 6 children/grandchildren).
- 48 permissions (the catalog in `database/permissions.json`; React/Vue copies are generated).
- Roles `super`, `admin`, `user`.
- Grants: `super` has all 48; `admin` has the system-management subset; `user` has the demo subset.
- Users: `super`, `admin`, `user` with BCrypt hashes for the demo passwords.

`npm run permissions:check` (at the repository root) verifies the generated frontend copies and `database/postgres/dml.sql` against the canonical catalog.

The seed inserts organizations child-first. PostgreSQL accepts this inside one multi-row statement; MySQL-family engines need `FOREIGN_KEY_CHECKS=0` and SQLite needs `PRAGMA foreign_keys=OFF` around the inserts. Each engine's `dml.sql` handles this.

## 5. Dialect matrix

| Feature | PostgreSQL | MySQL / MariaDB / OceanBase / GoldenDB | SQLite | openGauss |
| --- | --- | --- | --- | --- |
| Schema prefix | `public.` | none | none | `public.` |
| Timestamp | `timestamptz` | `datetime(6)` | `TEXT` ISO-8601 | `timestamptz` |
| Auto id | `bigserial` | `bigint auto_increment` | `INTEGER PRIMARY KEY AUTOINCREMENT` | `bigserial` |
| Boolean | `bool` | `tinyint(1)` | `INTEGER` | `bool` |
| Digits check | regex `~` | `REGEXP` | `NOT GLOB '*[^0-9]*'` | regex `~` |
| Trim | `btrim` | `TRIM` | `TRIM` | `btrim` |
| Partial unique index | supported | not supported → generated `action_key` | supported | supported (verify on target version) |
| `ON DELETE RESTRICT` | supported | supported | supported with `PRAGMA foreign_keys=ON` | supported |

The MySQL-family and SQLite files are verified locally. openGauss, OceanBase and GoldenDB are compatibility targets and must be smoke-tested on the target version before production use.

## 6. Changing the schema

There is no migration tool. The rules are:

1. Edit `database/postgres/ddl.sql` and `dml.sql` first.
2. Port the same change to every other engine.
3. Document the manual sync SQL for existing databases in `PROJECT_ISSUES.md`.
4. Run at least the PostgreSQL integration tests and the SQLite/MySQL load checks.

Accepted trade-off: no Flyway/Liquibase. The schema is small and the project is a demo; a migration tool would add a second source of truth.
