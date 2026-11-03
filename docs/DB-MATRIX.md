# Backend × Database Matrix

Goal: every backend runs the same API against PostgreSQL, MySQL, MariaDB and SQLite. openGauss, OceanBase and GoldenDB are connection-compatibility targets; they are only "passed" when a real instance was used.

## Endpoints per stack

Each stack gets its own database, so parallel smoke tests do not collide.

| Stack | PostgreSQL | MySQL | MariaDB | SQLite |
| --- | --- | --- | --- | --- |
| Spring Boot | `postgres://postgres:postgres@localhost:55432/orange_spring` | `mysql://root:root@localhost:53306/orange_spring` | `mysql://root:root@localhost:53307/orange_spring` | `D:\User\Cache\Temp\opencode\orange-spring.db` |
| Go | `.../orange_go` | `.../orange_go` | `.../orange_go` | `orange-go.db` |
| NestJS | `.../orange_nest` | `.../orange_nest` | `.../orange_nest` | `orange-nest.db` |
| C# | `.../orange_csharp` | `.../orange_csharp` | `.../orange_csharp` | `orange-csharp.db` |
| FastAPI | `.../orange_fastapi` | `.../orange_fastapi` | `.../orange_fastapi` | `orange-fastapi.db` |
| Rust | `.../orange_rust` | `.../orange_rust` | `.../orange_rust` | `D:\User\Cache\Temp\opencode\orange-rust.db` |

Ports: PostgreSQL 55432, MySQL 53306, MariaDB 53307.

Schema and seed:

- PostgreSQL: `database/postgres/ddl.sql`, `dml.sql`
- MySQL: `database/mysql/...`
- MariaDB: `database/mariadb/...`
- SQLite: `database/sqlite/...`

The databases are already loaded. Do not drop or reload them unless the smoke test needs a clean state; prefer creating/deleting only your own rows.

## Rules

1. One connection switch: `DB_DRIVER` (`postgres` / `mysql` / `mariadb` / `sqlite`) plus `DATABASE_URL`, or discrete `DB_*` variables. Document the precedence in the stack README.
2. No Postgres-only SQL in shared paths. Replace `strpos` with `LIKE`/`instr`, make `ON CONFLICT` dialect-aware, and avoid `RETURNING` where the driver cannot support it.
3. Keep the response envelope, auth, RBAC and tree rules identical across engines.
4. Smoke each engine: `super/super` login, `user-info`, `menus`, users list, one create/delete. Report pass/fail per engine.
5. If an engine cannot be supported without a rewrite, stop and report the concrete blocker. Do not mark it passed.
6. Never edit another stack.

## Status

Fill this table with the real result. "Static" means the connection profile exists but no instance was used.

| Stack | PostgreSQL | MySQL | MariaDB | SQLite | openGauss | OceanBase | GoldenDB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spring Boot | passed | passed | passed | passed | static | static | static |
| Go | passed | passed | passed | passed | static | static | static |
| NestJS | passed | passed | passed | passed | static | static | static |
| C# | passed | passed | passed | passed | static | static | static |
| Rust | passed | passed | passed | passed | static | static | static |
| FastAPI | passed | passed | passed | passed | static | static | static |
