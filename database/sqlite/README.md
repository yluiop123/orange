# SQLite schema and seed

SQLite port of `database/postgres/`. It contains the same 10 tables, columns,
keys, foreign keys, indexes, check constraints, defaults and seed rows.

| File | Purpose |
| --- | --- |
| `ddl.sql` | Schema: 10 tables, foreign keys, checks, indexes |
| `dml.sql` | Seed data (same rows, same order as the Postgres seed) |

Tables: `sys_group`, `sys_permission`, `sys_role`, `sys_user`,
`sys_role_permission`, `sys_user_permission`, `sys_user_role`,
`sys_revoked_token`, `sys_login_attempt`, `sys_operation_log`.

## Create the database

Run the DDL first, then the seed, against the same database file. They can be
separate connections: each script sets the PRAGMAs it needs.

```sh
# sqlite3 CLI
sqlite3 app.db < database/sqlite/ddl.sql
sqlite3 app.db < database/sqlite/dml.sql

# sqlite3 CLI, from inside a session
sqlite> .read database/sqlite/ddl.sql
sqlite> .read database/sqlite/dml.sql
```

If the CLI is not installed:

```python
# seed.py
import pathlib, sqlite3

con = sqlite3.connect("app.db")
con.executescript(pathlib.Path("database/sqlite/ddl.sql").read_text(encoding="utf-8"))
con.executescript(pathlib.Path("database/sqlite/dml.sql").read_text(encoding="utf-8"))
con.close()
```

Re-running `ddl.sql` on an existing database fails (`CREATE TABLE` is not
`IF NOT EXISTS`), matching the Postgres script. Delete the file or drop the
tables first.

## Foreign keys must be enabled on every connection

SQLite enforces foreign keys **per connection**, and the default is OFF.
`ddl.sql` starts with

```sql
PRAGMA foreign_keys = ON;
```

but that only affects the connection that ran the script. Every application
connection must run it too, before any write:

```python
con = sqlite3.connect("app.db")
con.execute("PRAGMA foreign_keys = ON")
```

Notes:

* The pragma is a no-op inside a transaction. Set it before `BEGIN`, not after.
  In Python's default `sqlite3` mode, an `INSERT`/`UPDATE`/`DELETE` leaves an
  implicit transaction open, so `PRAGMA foreign_keys = ON` after it is silently
  ignored — run the pragma right after `connect()` (or `commit()` first).
* Without it, `ON DELETE CASCADE` / `ON DELETE RESTRICT` and all foreign key
  rejection silently do nothing. Postgres always enforces them.
* Verify a loaded database with `PRAGMA foreign_key_check;` — it returns zero
  rows when every foreign key resolves. `dml.sql` runs it after the seed.

## Seed and foreign keys

The Postgres seed inserts `sys_group` child rows (`0001`, `0002`, ...) before
their parent `00`, so `dml.sql` brackets the inserts with:

```sql
PRAGMA foreign_keys = OFF;
-- inserts, unchanged order
PRAGMA foreign_key_check;
PRAGMA foreign_keys = ON;
```

Keep them in one script and do not wrap the toggles in a transaction, or the
`OFF` will be ignored. Because the seed ends with every reference satisfied,
re-enabling the pragma is safe; SQLite does not retroactively validate rows, so
the explicit `foreign_key_check` is what proves the data is consistent.

## Dialect differences from the Postgres schema

| Postgres | SQLite |
| --- | --- |
| `public.sys_*` | `sys_*` — no schemas, tables live in `main` |
| `varchar`, `varchar(n)` | `TEXT`; the length intent is kept in the column comment |
| `timestamptz DEFAULT now()` | `TEXT DEFAULT CURRENT_TIMESTAMP`, stored as ISO-8601 UTC |
| `bigserial` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `bool DEFAULT false` | `INTEGER NOT NULL DEFAULT 0 CHECK (col IN (0,1))` |
| `int4`, `bigint` | `INTEGER` (64-bit) |
| `text` | `TEXT` |
| `id ~ '^[0-9]+$'` | `id NOT GLOB '*[^0-9]*'` |
| `left(s, n)` | `substr(s, 1, n)` |
| `btrim(x)` | `TRIM(x)` |
| `COMMENT ON ...` | `--` comments in the file (no catalog metadata) |
| partial unique index | supported, identical syntax |

* `GLOB '*[^0-9]*'` matches ASCII `0-9` only, like Postgres' `[0-9]`; a
  full-width digit is rejected by both.
* `length()` counts characters (not bytes) in both engines, so the
  parent/child code length checks agree.
* `CHECK` passes when the expression is `NULL` in both engines, so `NULL`
  parents behave the same.
* `TRIM()` strips spaces only, same as `btrim()`'s default. A tab-only path is
  therefore accepted by both and a space-only path rejected by both.
* `CURRENT_TIMESTAMP` yields UTC `YYYY-MM-DD HH:MM:SS` (space separator,
  second precision), not Postgres' `2026-11-03 12:00:00.123456+00`. Write
  application timestamps as ISO-8601 with a trailing `Z` if you need the full
  format.
* `AUTOINCREMENT` adds SQLite's internal `sqlite_sequence` table (ignore it)
  and guarantees ids are not reused. `sys_operation_log_pkey` is folded into
  the column definition; declaring a table-level `PRIMARY KEY (id)` as well
  would be a second primary key, which SQLite rejects.

## Unique permission identity

Postgres and SQLite use the same two partial unique indexes, so the same rows
collide:

```sql
-- action permissions: identity is (type, path, action)
CREATE UNIQUE INDEX uq_sys_permission_identity_action
    ON sys_permission("type", "path", "action") WHERE "action" IS NOT NULL;

-- menu / directory permissions: identity is (type, path)
CREATE UNIQUE INDEX uq_sys_permission_identity_no_action
    ON sys_permission("type", "path") WHERE "action" IS NULL;
```

Consequences, identical in both engines:

* Two `action` rows with the same `(type, path, action)` are rejected; the same
  `(type, path)` with a different action is allowed.
* Two `menu` (or two `directory`) rows with the same `(type, path)` are
  rejected, because their `action` is `NULL` and `NULL` is not distinct inside
  a unique index in either engine.
* A `menu` and a `directory` may share a path — `type` is part of the key.
* `action` is `NULL` for `menu`/`directory` by `ck_sys_permission_action_shape`,
  so the two partial indexes together cover exactly one identity rule per row.

## What is not preserved

* **`varchar(n)` length limits are not enforced.** Postgres rejects a 256-char
  `sys_user.username`; SQLite `TEXT` accepts it. Re-adding it would require
  `CHECK (length(col) <= n)` or triggers, which the Postgres DDL does not
  express and this port deliberately does not add.
* **Timestamp values are not type-checked.** Any text can be stored in a
  `timestamptz` column; Postgres validates and normalizes the value (and
  rejects invalid dates/timezones).
* **Numeric ranges are not checked.** `int4` becomes a 64-bit `INTEGER`
  without a 32-bit range check, so values beyond `2147483647` are accepted.
* **No `COMMENT ON` metadata.** Table/column comments exist only as `--` lines
  in `ddl.sql`.
* **Foreign keys are off by default**, unlike Postgres. See the section above.
* SQLite evaluates `CURRENT_TIMESTAMP` once per statement, so every row of a
  multi-row insert shares it; Postgres' `now()` is the transaction start time.

## Validation performed

The port was checked with Python 3 and the stdlib `sqlite3` module:

* `ddl.sql` then `dml.sql` execute on a fresh in-memory database.
* Row counts: 7 `sys_group`, 48 `sys_permission`, 3 `sys_role`,
  26 `sys_user`, 67 `sys_role_permission`, 1 `sys_user_permission`,
  5 `sys_user_role`.
* Every seeded row and column list is identical to the Postgres seed
  (order preserved in the files and compared; set equality for rows).
* Schema diff against the Postgres DDL: same 10 tables, same column names and
  order, nullability, defaults, foreign keys (`ON DELETE` actions), index names
  and check-constraint names. The only difference is the folded
  `sys_operation_log_pkey` name noted above.
* Rejected as expected: duplicate `(type,path,action)` identity, duplicate
  `(type,path)` identity, blank path, `menu`/`directory` with a non-`NULL`
  action, `action` with a `NULL`/blank action, non-numeric group and permission
  codes, wrong code length/prefix, invalid `status`/`type`, `bool` value `2`,
  duplicate username/jti, unknown `group_id`, deleting a parent group that has
  children.
* Accepted as expected: valid child codes, tab-only path, `bool` value `1`,
  cascade delete of role permissions.
* `PRAGMA foreign_key_check` returns no rows after the seed.
