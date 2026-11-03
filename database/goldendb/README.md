# GoldenDB schema

GoldenDB port of `database/postgres`. `ddl.sql` creates the ten `sys_*` tables; `dml.sql`
loads the same seed data as the PostgreSQL file.

- Target: **GoldenDB 6.x**, MySQL 5.7-compatible grammar and wire protocol.
- Charset/collation: `utf8mb4` / `utf8mb4_general_ci` (MySQL 5.7 has no
  `utf8mb4_0900_*` collations).
- Storage engine: `ENGINE=InnoDB` (GoldenDB's MySQL-compatible storage layer).

> **Compatibility assumption:** no GoldenDB instance was available in this environment, so
> this file is **not** execution-verified. It is byte-for-byte the MySQL 8 file except for the
> collation and header comments. Two MySQL 5.7-era limits drive the risks below:
> `CHECK` constraints are parsed but not enforced by 5.7, and distributed deployments
> commonly reject or ignore foreign keys. The section "If a feature is rejected" gives the
> fallbacks; the rest of the schema (tables, columns, keys, indexes, comments, generated
> column) is straight MySQL-compatible DDL.

## Create the database

```sql
CREATE DATABASE orange
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

Shell equivalent (GoldenDB is reached through its proxy; the stock `mysql` client works):

```sh
mysql -h127.0.0.1 -P3306 -uroot -p \
  -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
```

## Load ddl, then dml

```sh
mysql --default-character-set=utf8mb4 -h127.0.0.1 -P3306 -uroot -p orange \
  < database/goldendb/ddl.sql
mysql --default-character-set=utf8mb4 -h127.0.0.1 -P3306 -uroot -p orange \
  < database/goldendb/dml.sql
```

`--default-character-set=utf8mb4` matters: the comments and the seed data are Chinese, and a
latin1 client connection would store mojibake.

`dml.sql` starts with `SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS = 0;` and ends with
`SET FOREIGN_KEY_CHECKS = 1;`. The seed intentionally inserts `sys_group` children before
the root row (`0001` before `00`), exactly like the PostgreSQL file. Do not reorder rows and
do not split the file: the whole load has to happen inside the foreign-key-off window. All
referenced rows do exist afterwards, so the data is consistent even though existing rows are
not re-validated when `FOREIGN_KEY_CHECKS` is turned back on.

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

| PostgreSQL | GoldenDB (MySQL 5.7 compatible) |
| --- | --- |
| `public.` schema prefix | dropped; the database itself is the namespace |
| unbounded `varchar` | explicit lengths (`id`/`parent_id`/FK ids 64, `name` 255, `path` 500, `action` 100, `type` 32, `status` 8, `phone` 32, `jti` 64, `token_type` 16, `attempt_key` 255, `trace_id` 64, `query_string` 512, `ip` 64, `method` 16) |
| `timestamptz` | `datetime(6)`; defaults `CURRENT_TIMESTAMP(6)` |
| `bigserial` | `bigint NOT NULL AUTO_INCREMENT` |
| `bool` | `tinyint(1)`, `false` → `0` |
| `int4` | `int` |
| `btrim(x)` | `TRIM(x)` |
| `x ~ 'regex'` | `x REGEXP 'regex'` (5.7 has no `REGEXP_LIKE()`) |
| `left(x, n)` | `LEFT(x, n)` |
| `now()` | `CURRENT_TIMESTAMP(6)` |
| `COMMENT ON TABLE/COLUMN` | inline `COMMENT '...'` on the table and on every column |
| partial unique indexes | generated column + ordinary unique key (see below) |
| `text` | `text` (unchanged) |

GoldenDB-specific notes:

- `utf8mb4_general_ci` is used instead of MySQL 8's `utf8mb4_0900_ai_ci`.
- GoldenDB shards tables by a distribution key. This file declares no distribution clause, so
  let the DBA/proxy defaults apply; `sys_operation_log.id` is the primary key and the
  auto-increment column, which satisfies the usual "auto-increment column must be part of the
  primary/distribution key" rule. If your deployment requires an explicit shard key, add it
  during provisioning rather than editing the shared DDL.
- `ON DELETE RESTRICT` / `CASCADE` and `NO ACTION` are declared exactly as in PostgreSQL.
  See the fallback section if the deployment rejects foreign keys.
- Three tables that have no table comment in PostgreSQL (`sys_revoked_token`,
  `sys_login_attempt`, `sys_operation_log`) got a short descriptive table comment here; every
  column comment from the PostgreSQL file is preserved verbatim.

## Permission uniqueness without partial indexes

PostgreSQL enforces two partial unique indexes:

```sql
-- (type, path, action) WHERE action IS NOT NULL
-- (type, path)         WHERE action IS NULL
```

This schema has no partial indexes. `sys_permission` stores the action in a generated column
and uses one ordinary unique key instead:

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
- NULL never participates in a unique key, which is exactly why the generated column is
  needed instead of indexing `action` directly.

`action_key` is derived and must stay out of `INSERT`/`UPDATE` column lists. The application
still normalizes whitespace-only actions to `NULL`.

Generated columns and indexes on them exist in MySQL 5.7, so this clause is normally
accepted. If the deployment rejects it, see fallback 3.

## If a feature is rejected

1. **Foreign keys rejected or ignored.** Distributed GoldenDB deployments often do not
   enforce foreign keys. Keep the indexes and let the application enforce referential
   integrity, or strip only the FK clauses:

   ```sh
   sed -E 's/^(\s*CONSTRAINT `fk_[^`]+` FOREIGN KEY .*)$/-- \1/' \
     database/goldendb/ddl.sql > /tmp/goldendb-ddl.sql
   ```

   The `ON DELETE CASCADE` behaviour then has to be done in the service layer. The seed's
   `SET FOREIGN_KEY_CHECKS` lines are harmless no-ops in that case.

2. **CHECK constraints parsed but not enforced.** MySQL 5.7 accepts `CHECK` in
   `CREATE TABLE` and ignores it. Verify with the probe below. If violations are accepted,
   `TreeCodePolicy`, `PermissionShapePolicy` and `StatusReq` are the only guards; add
   `BEFORE INSERT` / `BEFORE UPDATE` triggers raising `SIGNAL SQLSTATE '45000'` if the
   database must reject bad rows too.

3. **Generated column or its unique index rejected.** Keep the identity rule with one of:

   ```sql
   -- a) plain column maintained by the application / loader
   ALTER TABLE sys_permission
     ADD COLUMN `action_key` varchar(100) NOT NULL DEFAULT '' COMMENT '权限身份用动作键';
   UPDATE sys_permission SET action_key = COALESCE(`action`, '');
   CREATE UNIQUE INDEX uq_sys_permission_identity
     ON sys_permission (`type`, `path`, `action_key`);

   -- b) or maintain it with triggers
   DELIMITER //
   CREATE TRIGGER trg_sys_permission_action_key_bi
     BEFORE INSERT ON sys_permission FOR EACH ROW
     BEGIN
       SET NEW.action_key = COALESCE(NEW.`action`, '');
     END//
   CREATE TRIGGER trg_sys_permission_action_key_bu
     BEFORE UPDATE ON sys_permission FOR EACH ROW
   BEGIN
     SET NEW.action_key = COALESCE(NEW.`action`, '');
   END//
   DELIMITER ;
   ```

   Either way the unique key must exist; without it two menus can share a path.

## Caveats and known differences

1. **Case sensitivity.** `utf8mb4_general_ci` is case-insensitive, while PostgreSQL's default
   collation compares `varchar` case-sensitively. `Admin`/`admin` collide on
   `sys_user.unique_username`, and `/Component`/`/component` collide on
   `uq_sys_permission_identity`. For strict parity add `COLLATE utf8mb4_bin` to
   `sys_user.username`, `sys_permission.path`, `sys_group.id` and `sys_role.id`.
2. **Time zones.** `timestamptz` records an instant; `datetime(6)` records a wall-clock value
   with no offset. Store UTC and pin the session (`SET time_zone = '+00:00'`, JDBC
   `connectionTimeZone=UTC`).
3. **Length limits.** PostgreSQL's unbounded `varchar` became bounded columns above; longer
   values fail instead of being stored. `path` is 500 so that
   `(type, path, action_key)` stays inside the index key limit
   (`4 * (32 + 500 + 100) = 2528` bytes plus length bytes).
4. **`update_time`** has `DEFAULT CURRENT_TIMESTAMP(6)` but no `ON UPDATE` clause, matching
   the PostgreSQL file where the application writes the new value with the row.
5. **CHECK + NULL.** Like PostgreSQL, a CHECK expression that evaluates to `NULL` passes.
   The constraints are written so the relevant branches are explicit `IS NULL` / `IS NOT
   NULL` tests.
6. **`duration_ms`/`status`** stay unvalidated, exactly as in PostgreSQL.
7. **`action_key` is an extra column.** It does not exist in the PostgreSQL schema, so
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
```

CHECK-enforcement probe (every statement must fail; run inside a transaction and roll back):

```sql
START TRANSACTION;
INSERT INTO sys_role (id,`name`,status) VALUES ('tmp1','x','2');                 -- expect failure
INSERT INTO sys_permission (id,`name`,`path`,`action`,`type`,status,parent_id)
  VALUES ('0008','blank path','   ',NULL,'menu','1',NULL);                       -- expect failure
INSERT INTO sys_permission (id,`name`,`path`,`action`,`type`,status,parent_id)
  VALUES ('0009','dup menu','/component',NULL,'menu','1',NULL);                  -- expect failure
ROLLBACK;
```

Identity probe (must fail on duplicate and succeed on a new action for an existing path):

```sql
START TRANSACTION;
INSERT INTO sys_permission (id,`name`,`path`,`action`,`type`,status,parent_id)
  VALUES ('00050003','dup action','/system/user','add','action','1','000500');     -- expect failure
INSERT INTO sys_permission (id,`name`,`path`,`action`,`type`,status,parent_id)
  VALUES ('00050003','view action','/system/user','view','action','1','000500');   -- expect success
ROLLBACK;
```

If the CHECK probe statements succeed, the constraints are not enforced; see fallback 2.
