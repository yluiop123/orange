# OceanBase schema

OceanBase (MySQL mode) port of `database/postgres`. `ddl.sql` creates the ten `sys_*`
tables; `dml.sql` loads the same seed data as the PostgreSQL file.

- Target: **OceanBase 4.x, MySQL mode** (MySQL 5.7/8.0 wire protocol).
- Charset/collation: `utf8mb4` / `utf8mb4_general_ci`. OceanBase does not guarantee the
  MySQL 8 `utf8mb4_0900_*` collations, so the more portable `general_ci` is used.
- Storage engine: `ENGINE=InnoDB` is accepted by OceanBase for MySQL compatibility and maps
  to its native engine.

> **Compatibility assumption:** this port was written against the OceanBase MySQL-mode
> grammar; no OceanBase instance was available in this environment, so unlike the MySQL and
> MariaDB files it is **not** execution-verified here. It is byte-for-byte the MySQL 8 file
> except for the collation and header comments. The section "If a feature is rejected"
> lists the fallbacks for the two features OceanBase is most likely to restrict: CHECK
> enforcement and indexed generated columns.

## Create the database

Connect with the tenant-qualified user (`user@tenant#cluster`), then:

```sql
CREATE DATABASE orange
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

Shell equivalent (`obclient` is OceanBase's `mysql` client; the stock `mysql` client also
works):

```sh
obclient -h127.0.0.1 -P2881 -uroot@tenant#cluster -p \
  -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
```

## Load ddl, then dml

```sh
obclient --default-character-set=utf8mb4 -h127.0.0.1 -P2881 -uroot@tenant#cluster -p orange \
  < database/oceanbase/ddl.sql
obclient --default-character-set=utf8mb4 -h127.0.0.1 -P2881 -uroot@tenant#cluster -p orange \
  < database/oceanbase/dml.sql
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

| PostgreSQL | OceanBase (MySQL mode) |
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

`ON DELETE RESTRICT` / `CASCADE` and `NO ACTION` map directly. OceanBase creates the
supporting index for a foreign key automatically when the referencing columns are not the
leftmost columns of an existing index.

Three tables that have no table comment in PostgreSQL (`sys_revoked_token`,
`sys_login_attempt`, `sys_operation_log`) got a short descriptive table comment here; every
column comment from the PostgreSQL file is preserved verbatim.

## Permission uniqueness without partial indexes

PostgreSQL enforces two partial unique indexes:

```sql
-- (type, path, action) WHERE action IS NOT NULL
-- (type, path)         WHERE action IS NULL
```

OceanBase's MySQL mode has no partial indexes. `sys_permission` stores the action in a
generated column and uses one ordinary unique key instead:

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
still normalizes whitespace-only actions to `NULL`; the CHECK constraints keep both shapes
honest.

## If a feature is rejected

OceanBase's MySQL mode is broad but version-dependent. If the server refuses a clause, apply
the matching fallback and re-run the load.

1. **`ENGINE=InnoDB` rejected.** OceanBase has its own storage engine. Strip the clause:

   ```sh
   sed 's/ ENGINE=InnoDB//' database/oceanbase/ddl.sql > /tmp/oceanbase-ddl.sql
   ```

2. **CHECK constraints parsed but not enforced.** Verify with the probe at the bottom of this
   file. If violations are accepted, the database layer is not guarding the tree/status/action
   rules; the application-side policies (`TreeCodePolicy`, `PermissionShapePolicy`,
   `StatusReq`) are then the only guard. To keep the database honest, add `BEFORE INSERT` /
   `BEFORE UPDATE` triggers that raise `SIGNAL SQLSTATE '45000'` for the same predicates.

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
5. **Auto-increment.** `sys_operation_log.id` is `AUTO_INCREMENT`; in partitioned
   deployments the auto-increment column must be part of the primary key, which it is here.
6. **CHECK + NULL.** Like PostgreSQL, a CHECK expression that evaluates to `NULL` passes.
   The constraints are written so the relevant branches are explicit `IS NULL` / `IS NOT
   NULL` tests.
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
