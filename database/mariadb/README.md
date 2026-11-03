# MariaDB schema

MariaDB 11 port of `database/postgres`. `ddl.sql` creates the ten `sys_*` tables; `dml.sql`
loads the same seed data as the PostgreSQL file.

- Target: **MariaDB 10.2 or newer** (CHECK constraints are enforced from 10.2).
- Verified on: `mariadb:11` → `11.8.9`.
- Storage engine: InnoDB (required for foreign keys and transactions).
- Charset/collation: `utf8mb4` / `utf8mb4_general_ci` (`utf8mb4_0900_ai_ci` is a MySQL 8
  collation that MariaDB does not ship).

## Create the database

```sql
CREATE DATABASE orange
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

Shell equivalent:

```sh
mariadb -uroot -p -e "CREATE DATABASE orange CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
```

## Load ddl, then dml

```sh
mariadb --default-character-set=utf8mb4 -uroot -p orange < database/mariadb/ddl.sql
mariadb --default-character-set=utf8mb4 -uroot -p orange < database/mariadb/dml.sql
```

Or from inside the client:

```sql
USE orange;
SOURCE database/mariadb/ddl.sql;
SOURCE database/mariadb/dml.sql;
```

`--default-character-set=utf8mb4` matters: the comments and the seed data are Chinese, and
a latin1 client connection would store mojibake.

`dml.sql` starts with `SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS = 0;` and ends with
`SET FOREIGN_KEY_CHECKS = 1;`. The seed intentionally inserts `sys_group` children before
the root row (`0001` before `00`), exactly like the PostgreSQL file. Do not reorder rows and
do not split the file: the whole load has to happen inside the foreign-key-off window. All
referenced rows do exist afterwards, so the data is consistent even though MariaDB does not
re-validate existing rows when `FOREIGN_KEY_CHECKS` is turned back on.

Seed sizes after a clean load:

| Table | Rows |
| --- | --- |
| `sys_group` | 7 |
| `sys_permission` | 48 |
| `sys_role` | 3 |
| `sys_user` | 26 |
| `sys_role_permission` | 67 (super 48, admin 18, user 1) |
| `sys_user_permission` | 1 |
| `sys_user_role` | 5 |

## Dialect differences from PostgreSQL

| PostgreSQL | MariaDB |
| --- | --- |
| `public.` schema prefix | dropped; the database itself is the namespace |
| unbounded `varchar` | explicit lengths (`id`/`parent_id`/FK ids 64, `name` 255, `path` 500, `action` 100, `type` 32, `status` 8, `phone` 32, `jti` 64, `token_type` 16, `attempt_key` 255, `trace_id` 64, `query_string` 512, `ip` 64, `method` 16) |
| `timestamptz` | `datetime(6)`; defaults `CURRENT_TIMESTAMP(6)` |
| `bigserial` | `bigint NOT NULL AUTO_INCREMENT` |
| `bool` | `tinyint(1)`, `false` → `0` |
| `int4` | `int` |
| `btrim(x)` | `TRIM(x)` |
| `x ~ 'regex'` | `x REGEXP 'regex'` |
| `left(x, n)` | `LEFT(x, n)` |
| `now()` | `CURRENT_TIMESTAMP(6)` |
| `COMMENT ON TABLE/COLUMN` | inline `COMMENT '...'` on the table and on every column |
| partial unique indexes | generated column + ordinary unique key (see below) |
| `text` | `text` (unchanged) |

MariaDB-specific notes:

- `utf8mb4_general_ci` is used everywhere instead of `utf8mb4_0900_ai_ci`.
- Violations report `ERROR 4025 (23000): CONSTRAINT ... failed` instead of MySQL's
  `ERROR 3819`.
- `REGEXP` in MariaDB 10.2+ is PCRE-based; the pattern here only matches digits, so it
  behaves like PostgreSQL's `~`.
- `TRIM()`, `LEFT()` and `LENGTH()` are byte/character aware as in MySQL; all identifiers
  used in the CHECKs are ASCII digits.

`ON DELETE RESTRICT` / `CASCADE` and `NO ACTION` map directly; InnoDB additionally
auto-creates an index for each foreign key whose columns are not the leftmost columns of an
existing index (`sys_role_permission.permission_id`, `sys_user_permission.permission_id`,
`sys_user_role.role_id`). Those indexes are engine requirements, not schema additions.

Three tables that have no table comment in PostgreSQL (`sys_revoked_token`,
`sys_login_attempt`, `sys_operation_log`) got a short descriptive table comment here; every
column comment from the PostgreSQL file is preserved verbatim.

## Permission uniqueness without partial indexes

PostgreSQL enforces two partial unique indexes:

```sql
-- (type, path, action) WHERE action IS NOT NULL
-- (type, path)         WHERE action IS NULL
```

MariaDB has no partial indexes. `sys_permission` stores the action in a generated column and
uses one ordinary unique key instead:

```sql
`action_key` varchar(100)
  GENERATED ALWAYS AS (COALESCE(`action`, '')) STORED COMMENT '权限身份用动作键；NULL 归一化为空串',
...
CREATE UNIQUE INDEX `uq_sys_permission_identity`
  ON `sys_permission` (`type`, `path`, `action_key`);
```

Semantics are identical:

- `type='action'`: `action` is `NOT NULL` (enforced by `ck_sys_permission_action_shape`), so
  `action_key = action` and the key covers `(type, path, action)`.
- `type IN ('menu','directory')`: `action` is `NULL`, so `action_key = ''` and the key covers
  `(type, path)` — one menu/directory per path.
- NULL never participates in a unique key in either engine, which is exactly why the
  generated column is needed instead of indexing `action` directly.

`action_key` is derived and must stay out of `INSERT`/`UPDATE` column lists. The application
still normalizes whitespace-only actions to `NULL`; the CHECK constraints keep both shapes
honest.

MariaDB can index `VIRTUAL` generated columns as well; `STORED` is used here so the column
behaves the same as in MySQL and can be copied/exported without recomputation.

## Caveats and known differences

1. **Case sensitivity.** `utf8mb4_general_ci` is case-insensitive, while PostgreSQL's
   default collation compares `varchar` case-sensitively. Consequences: `Admin` and `admin`
   collide on `sys_user.unique_username`, and `/Component` and `/component` collide on
   `uq_sys_permission_identity`. For strict parity add a binary collation to the identity
   columns, for example:

   ```sql
   ALTER TABLE sys_user
     MODIFY `username` varchar(255) COLLATE utf8mb4_bin NOT NULL COMMENT '用户名';
   ```

   The same treatment applies to `sys_permission.path`, `sys_group.id` and `sys_role.id`.
   This is intentionally not the default, because the table collation is a deployment
   choice.
2. **Time zones.** `timestamptz` records an instant; `datetime(6)` records a wall-clock value
   with no offset. Store UTC and pin the session (`SET time_zone = '+00:00'`, JDBC
   `connectionTimeZone=UTC`) so behaviour matches PostgreSQL. `CURRENT_TIMESTAMP(6)`
   evaluates in the session time zone.
3. **Length limits.** PostgreSQL's unbounded `varchar` became bounded columns above; values
   longer than the limit fail on MariaDB instead of being stored. `path` is 500 because
   `(type, path, action_key)` must fit InnoDB's 3072-byte index limit:
   `4 * (32 + 500 + 100) = 2528` bytes plus length bytes.
4. **Index key length.** This assumes InnoDB `DYNAMIC`/`COMPRESSED` row format, the default on
   current MariaDB. On servers forced to `COMPACT`/`REDUNDANT` (767-byte limit) the unique
   key on `(type, path, action_key)` cannot be created.
5. **`update_time`** has `DEFAULT CURRENT_TIMESTAMP(6)` but no `ON UPDATE` clause, matching
   the PostgreSQL file where the application writes the new value with the row.
6. **Time precision.** `datetime(6)` keeps microseconds; do not shorten it to `datetime` if
   ordering of log rows or token expiry matters.
7. **CHECK on `REGEXP`.** MariaDB 10.2 has no `REGEXP_LIKE()` function; `REGEXP` is the
   operator form and works in CHECK expressions (verified on 11.8).
8. **`action_key` is an extra column.** It does not exist in the PostgreSQL schema, so
   `SELECT *` consumers that map results by position, and schema-diff tooling, will see one
   more column. Map by column name, include it in no `INSERT`/`UPDATE` list, and exclude it
   from entity definitions.

## Verify a load

```sql
SELECT 'sys_group' AS t, COUNT(*) AS n FROM sys_group
UNION ALL SELECT 'sys_permission', COUNT(*) FROM sys_permission
UNION ALL SELECT 'sys_role', COUNT(*) FROM sys_role
UNION ALL SELECT 'sys_user', COUNT(*) FROM sys_user
UNION ALL SELECT 'sys_role_permission', COUNT(*) FROM sys_role_permission
UNION ALL SELECT 'sys_user_permission', COUNT(*) FROM sys_user_permission
UNION ALL SELECT 'sys_user_role', COUNT(*) FROM sys_user_role;

SELECT role_id, COUNT(*) FROM sys_role_permission GROUP BY role_id ORDER BY role_id;
-- expect admin 18, super 48, user 1

SELECT COUNT(*) AS orphan_permission_grants
FROM sys_role_permission rp
LEFT JOIN sys_permission p ON p.id = rp.permission_id
WHERE p.id IS NULL;
-- expect 0

SELECT COUNT(*) AS duplicate_identity FROM (
  SELECT type, path, COALESCE(action, '')
  FROM sys_permission
  GROUP BY type, path, COALESCE(action, '')
  HAVING COUNT(*) > 1
) d;
-- expect 0
```

The load was checked with `mariadb:11` (11.8.9): `ddl.sql` and `dml.sql` both apply cleanly,
the counts above match, and the unique/CHECK/FK behaviour was exercised (duplicate menu
identity, duplicate action identity, bad status, blank path, wrong action shape, bad tree
code, duplicate username, parent delete with children, cascade delete of grants).
