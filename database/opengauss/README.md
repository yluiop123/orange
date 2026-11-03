# openGauss schema and seed

Port of [`database/postgres`](../postgres) to openGauss.

- `ddl.sql` — 10 tables, primary keys, foreign keys, indexes, CHECK constraints,
  defaults and `COMMENT ON` statements.
- `dml.sql` — the same seed data as `database/postgres/dml.sql`.

The PostgreSQL files remain the source of truth. This port keeps them as the
reference and changes as little as possible: **no table, column, key, foreign
key, index, check, default or comment was rewritten.** The only additions are a
file header and `SET client_encoding = 'UTF8';` (both files contain Chinese
text), plus two explanatory comments above the partial unique indexes. See
[Differences from `database/postgres`](#differences-from-databasepostgres).

## Version assumption

Written for **openGauss 5.x and 6.x**, row-store (`astore`), single-node or
primary/standby, not partitioned. Feature claims were checked against the
openGauss 6.0.0 SQL Reference:

- [Data types — numeric](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/numeric-types.html)
- [Data types — character](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/character-types.html)
- [Data types — date/time](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/date-time-types.html)
- [Data types — boolean](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/boolean-types.html)
- [CREATE TABLE](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/create-table.html)
- [CREATE INDEX](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/create-index.html)
- [Character processing functions and operators](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/character-processing-functions-and-operators.html)
- [Mode matching operators](https://docs.opengauss.org/en/docs/6.0.0/docs/BriefTutorial/mode-matching-operators.html)
- [COMMENT](https://docs.opengauss.org/en/docs/6.0.0/docs/SQLReference/comment.html)

openGauss's SQL engine descends from PostgreSQL 9.2, so it does not accept every
newer PostgreSQL construct. Everything used here is documented openGauss syntax,
not "newer PostgreSQL syntax that happens to parse".

## Create the database and load

The loader needs `CREATE` on schema `public` plus `CREATE ANY SEQUENCE` (the
`bigserial` column creates an owned sequence; openGauss documents this
privilege requirement for serial columns).

```bash
# 1. Create an empty UTF-8 database.
#    DBCOMPATIBILITY='PG' is recommended for closest parity with PostgreSQL;
#    the script also loads in the default 'A' mode (see notes below).
gsql -d postgres -p 5432 -U omm \
  -c "CREATE DATABASE app_db WITH ENCODING='UTF8' DBCOMPATIBILITY='PG';"

# 2. Load schema, then seed. Stop on the first error.
gsql -d app_db -p 5432 -U omm -v ON_ERROR_STOP=1 -f database/opengauss/ddl.sql
gsql -d app_db -p 5432 -U omm -v ON_ERROR_STOP=1 -f database/opengauss/dml.sql
```

Notes:

- If `template1` is not UTF-8, create with `TEMPLATE template0` as well.
- Both scripts set `client_encoding` to `UTF8` themselves, so the Chinese
  comments and seed text are decoded correctly. The files are UTF-8 without BOM.
- `ddl.sql` contains no `DROP`; re-running it fails on the first existing table,
  exactly like the PostgreSQL script. `dml.sql` uses plain `INSERT`s, so
  re-running it raises duplicate-key errors.
- The seed itself does not touch `sys_operation_log`,
  `sys_revoked_token` or `sys_login_attempt`.

Sanity check after loading:

```sql
\dt public.*
SELECT count(*) FROM public.sys_group;            -- 7
SELECT count(*) FROM public.sys_permission;       -- 48
SELECT count(*) FROM public.sys_role;             -- 3
SELECT count(*) FROM public.sys_role_permission;  -- 67
SELECT count(*) FROM public.sys_user;             -- 26
SELECT count(*) FROM public.sys_user_permission;  -- 1
SELECT count(*) FROM public.sys_user_role;        -- 5
```

## Compatibility matrix

| Construct in `database/postgres` | openGauss support | What this port does |
| --- | --- | --- |
| `timestamptz` | Supported; documented alias of `TIMESTAMP WITH TIME ZONE` | Kept verbatim |
| `bigserial` | Supported "sequence integer" (`8` bytes); creates an owned sequence and `nextval()` default. Requires `CREATE ANY SEQUENCE` | Kept verbatim (`sys_operation_log.id`) |
| `bool` | Supported; `bool` is the internal name of `BOOLEAN` (the `BOOLEAN` keyword maps to it) | Kept verbatim |
| `int4` | Supported; documented alias of `INTEGER` | Kept verbatim |
| `bigint` | Supported; also called `INT8` | Kept verbatim |
| `varchar` without length | Supported; openGauss grammar documents "varchar to no limit" (only `char` defaults to `char(1)`) | Kept verbatim |
| `varchar(n)` | Supported, max 10 MB. `n` counts characters in PG-compatible mode, bytes in other modes | Kept verbatim; all seed values fit either way |
| `text` | Supported (up to 1 GB − 1) | Kept verbatim |
| `now()` | Supported | Kept verbatim |
| `btrim(x)` | Supported (`btrim(string text [, characters text])`) | Kept verbatim in `ck_sys_permission_path` and `ck_sys_permission_action_shape` |
| `left(str, n)` | Supported (`left(str text, n int)`) | Kept verbatim in the code-prefix check |
| `length(str)` | Supported; counts characters (bytes via `lengthb`) | Kept verbatim; ids are ASCII digits so characters = bytes |
| `~` POSIX regex | Supported (`~`, `~*`, `!~`, `!~*`; case-sensitive `~` matches anywhere unless anchored) | Kept verbatim in the two code checks |
| Partial unique index `CREATE UNIQUE INDEX ... WHERE ...` | Supported on row-store tables. Docs: "**WHERE** with **UNIQUE** can be used to enforce uniqueness over a subset of a table." Not supported on partitioned tables, and not on column-store tables | Kept verbatim — both permission-identity indexes |
| Index predicate `action IS NOT NULL` / `action IS NULL` | Supported; predicates may reference any column of the table, but no subqueries/aggregates | Kept verbatim |
| Self-referencing FK, `ON DELETE RESTRICT` | Supported | Kept verbatim (`sys_group`, `sys_permission`) |
| FK `ON DELETE CASCADE` | Supported | Kept verbatim (relation tables) |
| `UNIQUE (username)` table constraint | Supported | Kept verbatim |
| CHECK constraints calling immutable built-ins | Supported (functions in checks/indexes must be immutable; `btrim`, `left`, `length`, `~` are) | Kept verbatim |
| `COMMENT ON TABLE` / `COMMENT ON COLUMN` | Supported | Kept verbatim, including quoted columns |
| Quoted lowercase identifiers (`"name"`, `"path"`, `"action"`, `"type"`, `"password"`) | Supported; quoting preserves case, and all quoted names here are already lowercase | Kept verbatim |
| `public.` schema qualifier | Supported; `public` exists in a new database | Kept verbatim |
| Multi-row `INSERT ... VALUES (...), (...)` | Supported | Kept verbatim |
| `--` comments, `SET client_encoding` | Supported | Header/encoding statement added |

No construct in the source needed a replacement, so no generated/computed
columns were introduced.

## Differences from `database/postgres`

### File-level (the only ones)

1. **Header block** in both files (target version, load command, notes).
2. **`SET client_encoding = 'UTF8';`** at the top of both files. Without it,
   Chinese text is misinterpreted when client and server encodings differ.
3. **Two comments** above `uq_sys_permission_identity_action` /
   `uq_sys_permission_identity_no_action` recording that partial indexes are
   supported and therefore kept as-is.

Nothing else. A normalized, line-by-line comparison of `database/opengauss/ddl.sql`
against `database/postgres/ddl.sql` differs only by those two comment lines; the
body of `dml.sql` is byte-for-byte identical.

### Environment-level (not visible in the files)

- **Compatibility mode.** Default `sql_compatibility` is `A` (Oracle). The
  script is written to load in either `A` or `PG`; `PG` is recommended when you
  want PostgreSQL semantics (notably string comparison/empty-string handling and
  `varchar(n)` counting characters rather than bytes). The CHECK constraints do
  not rely on empty-string behaviour: `path` is `NOT NULL`, and an `action` of
  `''` for `type = 'action'` is rejected by the `NOT NULL` / non-empty test in
  either mode.
- **Sequence.** `bigserial` behaves as in PostgreSQL: an owned sequence with a
  `nextval()` default, starting at 1. openGauss names it from table and column
  (PostgreSQL convention: `sys_operation_log_id_seq`); the exact generated name
  should be confirmed on the instance if your deployment copies sequence names.
- **Storage.** Tables use openGauss's default row-store engine. Partial indexes
  and their `WHERE action IS NULL` predicate are only valid there. If your
  instance sets `enable_default_ustore_table = on`, the tables are created as
  ustore tables (UB-tree indexes); unique and partial indexes are still
  documented as supported there, but confirm validation item 2.
- **Ownership/grants.** Objects are owned by the loading role. The PostgreSQL
  script has no `GRANT`s either; add them for your application role.
- **Index build order.** The seed is small, so indexes are created before the
  data, same as the PostgreSQL script. For large data loads openGauss advises
  loading first and creating indexes afterwards.

## Static verification performed

openGauss was not available in this environment, so nothing here was executed
against a live instance. The following checks were done instead.

1. **Feature-by-feature review** of every type, function, operator, DDL clause
   and index option against the openGauss 6.0.0 pages listed above. Results are
   the matrix above; nothing was assumed silently.
2. **Unsupported-syntax sweep.** All of the following are absent (they are
   PostgreSQL-only, newer than the 9.2 lineage, or simply unused):

   ```bash
   grep -nEi 'on conflict|returning|generated .* as|\bfilter \(|lateral|jsonb|uuid|citext|create extension|\bexclude\b|deferrable|\bidentity\b|include \(|nulls not distinct|create schema|set search_path|do \$\$|\bdeclare\b|partition by|array\[|::' \
     database/opengauss/*.sql
   ```

   No matches. (Word boundaries are needed around `identity`/`exclude`/`declare`
   so the index names `uq_sys_permission_identity_*` do not trigger false
   positives.) No `ALTER`, `GRANT`, `DROP`, `TRUNCATE`, `DO` blocks, arrays,
   domains, enum types, exclusion constraints, deferrable constraints, identity
   columns, or partitioned tables.
3. **Fidelity diff.** After normalizing line endings, the DDL body and the DML
   body were compared to the PostgreSQL originals (see above). Only the two
   explanatory comments differ.
4. **Constraint review.** Every CHECK uses only immutable built-ins, references
   only its own row, and is logically identical to the PostgreSQL original,
   including the code length/prefix rule
   (`parent_id IS NULL AND length(id) = …` / prefix equality) and the action
   shape rule (`action` non-empty iff `type = 'action'`).
5. **Index review.** Both identity indexes are `UNIQUE` with complementary
   predicates (`action IS NOT NULL` / `action IS NULL`), so they jointly cover
   every row exactly once; `action`'s NULLability cannot create duplicate holes.
6. **Dependency review.** Tables are created parent-before-child, and each seed
   `INSERT` that references another table runs after that table is populated.
   The only intra-statement forward reference is in `sys_group`, where children
   reference `'00'` which appears later in the same multi-row `INSERT`; this is
   the PostgreSQL seed's original ordering and relies on FK checks firing at end
   of statement, as in PostgreSQL.

## Needs validation on a real openGauss instance

These are the items a live run should confirm. They are expected to pass; they
are listed because they could not be executed here.

1. `bigserial` under the loading role: `ddl.sql` completes, the sequence is
   owned by the column, and an `INSERT INTO public.sys_operation_log (...)`
   without `id` gets a generated value.
2. Partial unique index enforcement:
   - duplicate `(type, path)` with `action IS NULL` → unique violation;
   - duplicate `(type, path, action)` with non-null `action` → unique violation;
   - same `path`, different `action` → allowed;
   - same `(type, path)` once with `NULL` and once with a non-null `action` →
     allowed.
3. CHECK evaluation: `id 'ABC'`, `id '1'` (wrong length), `path ''` / `'   '`,
   a `menu` row with non-null `action`, and an `action` row with `NULL` or empty
   `action` are all rejected.
4. `left()` / `length()` / `btrim()` inside CHECK constraints parse and evaluate
   as expected on your exact 5.x/6.x build.
5. `timestamptz DEFAULT now()` fills `create_time` / `update_time`; `now()` is
   the transaction start time, as in PostgreSQL.
6. The `sys_group` seed insert succeeds despite children preceding `'00'` in the
   same statement (see dependency review). If a build rejects it, move the
   `('00','总公司','1',NULL)` row to the front of that one `INSERT` — the
   resulting data is identical.
7. `COMMENT ON COLUMN` attaches to the quoted columns `"name"`, `"path"`,
   `"action"`, `"type"`, `"password"` (check `pg_description`).
8. Encoding round trip: `SELECT "name" FROM public.sys_group` and the table
   comments render as Chinese, not mojibake (needs UTF-8 database and client).
9. `gsql -v ON_ERROR_STOP=1 -f` behaves as expected in your version (otherwise
   `\set ON_ERROR_STOP on` inside the files).
10. Behaviour under the default `A` compatibility mode if you do not create the
    database with `DBCOMPATIBILITY='PG'` — particularly `varchar(n)` byte vs
    character counting and empty-string comparisons. Recreate with `'PG'` if you
    need exact PostgreSQL semantics.
