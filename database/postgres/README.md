# PostgreSQL schema and seed

The reference schema for every other database dialect in `database/`.

| File | Purpose |
| --- | --- |
| `ddl.sql` | Schema: 10 tables, foreign keys, checks, partial unique indexes |
| `dml.sql` | Seed data: organizations, permissions, roles, users, grants |

Tables: `sys_group`, `sys_permission`, `sys_role`, `sys_user`,
`sys_role_permission`, `sys_user_permission`, `sys_user_role`,
`sys_revoked_token`, `sys_login_attempt`, `sys_operation_log`.

## Create the database

```sh
createdb orange
psql -d orange -v ON_ERROR_STOP=1 -f database/postgres/ddl.sql
psql -d orange -v ON_ERROR_STOP=1 -f database/postgres/dml.sql
```

Or, against an existing database:

```sh
psql -U postgres -d orange -f ddl.sql
psql -U postgres -d orange -f dml.sql
```

Re-running `ddl.sql` on an existing database fails because `CREATE TABLE` is
not `IF NOT EXISTS`. Drop the database or the tables first.

## Seed contents

- 7 organizations (`00` root plus children and grandchildren).
- 48 permissions, ordered by business code.
- 3 roles: `super`, `admin`, `user`.
- 67 role grants: `super` has all 48, `admin` has 18, `user` has 1.
- 26 users, including the three demo accounts.

Demo passwords are stored as BCrypt hashes. The seed users are:

| Username | Password | Role |
| --- | --- | --- |
| `super` | `super` | `super` |
| `admin` | `admin` | `admin` |
| `user` | `user` | `user` |

Change or delete these before exposing the database.

The permission catalog lives in `frontend/react/src/config/permissions.json`.
`pnpm db:seed:check` (run from `frontend/react`) verifies that the catalog and
the generated block in `dml.sql` are in sync.

## Invariants

- Organization code: digits; root 2 digits; child = parent + 2 digits.
- Permission code: digits; root 4 digits; child = parent + 2 digits.
- Permission `type` is `menu`, `action` or `directory`.
- `action` is required only for `action`; `menu`/`directory` must have `action IS NULL`.
- Permission `path` is `NOT NULL` and non-blank.
- Permission identity is unique: `(type, path, action)` with `NULL` action treated
  as one value, via two partial unique indexes.
- `username` is unique.
- Parent foreign keys use `ON DELETE RESTRICT`; join tables use `ON DELETE CASCADE`.

Runtime access is described in `docs/DATABASE.md`. Other engines are ports of
this file; see `database/mysql`, `mariadb`, `sqlite`, `opengauss`, `oceanbase`
and `goldendb`.
