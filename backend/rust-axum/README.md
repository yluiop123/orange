English | [简体中文](README.zh-CN.md)

# Orange · Rust + Axum backend

Implements the shared API contract with Rust + Axum, following the Spring Boot
reference for behaviour. One process connects to one database selected by
`DB_DRIVER` / `DATABASE_URL`. Shared backend conventions are in
[../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Rust | edition 2021, `rust-version = 1.75` | `Cargo.toml` |
| Web | axum 0.8, tokio 1, tower-http 0.6 | `Cargo.toml` |
| Database | sqlx 0.8 with postgres / mysql / sqlite features | `Cargo.toml` |
| Auth | `jsonwebtoken` 9, `bcrypt` 0.15 | `Cargo.toml` |
| Serialization | serde 1, serde_json 1, chrono 0.4 | `Cargo.toml` |
| Other | uuid 1, rand 0.8, regex 1, dotenvy 0.15, tracing | `Cargo.toml` |
| API documentation | utoipa 5 + utoipa-swagger-ui 9 | `src/swagger.rs` |

`Cargo.lock` is committed. All tests are inline in `src`; there are no
`[dev-dependencies]`.

## Requirements and commands

| Purpose | Command |
| --- | --- |
| Install | no separate step; `cargo build` fetches crates from `Cargo.lock` |
| Start | `cargo run` |
| Test | `cargo test` |
| Build | `cargo build` |

On Windows without the MSVC linker, install the
`stable-x86_64-pc-windows-gnu` toolchain and put MSYS2 `gcc` on `PATH`; CI uses
the default Linux toolchain. `.env` is loaded by `dotenvy::dotenv()`.

## Directory structure and layering

```text
src/main.rs          startup, listener, daily audit cleanup
src/config.rs        environment variables and configuration
src/db.rs            driver resolution, dialect helpers, repository dispatch
src/state.rs         Db and Arc<Config>
src/error.rs         business codes and error envelope
src/response.rs      response envelope and trace id
src/middleware.rs    TraceId, authentication, optional authentication
src/operation_log.rs audit policy and middleware
src/swagger.rs       generated /openapi.json and /swagger UI
src/auth/            JWT, bcrypt, lockout, cookies
src/domain/          entities, DTOs, tree and permission policy, validation
src/repository/      SQLx queries per driver
src/service/         business rules and guards
src/routes/          Axum handlers and routes
```

## API, auth and database access

- Axum handlers bind parameters, declare the Authority and call services; the
  central response helper writes the envelope and `src/error.rs` maps errors.
- JWT uses `jsonwebtoken`: RS256 when both RSA keys are set, otherwise HS256 with
  `JWT_SECRET`. Refresh tokens rotate in an HttpOnly cookie.
- sqlx queries have one generated copy per driver; dialect differences are
  concentrated in `src/db.rs`. SQLite timestamps are ISO-8601 text and filtering
  uses `datetime(...)`.
- The `version` column is incremented but not compared, so concurrent edits are
  last-write-wins (same as the Go and Python ports).

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `8083` | `src/config.rs`: `APP_PORT` → `PORT` → 8083 | Set `APP_PORT` in `.env` |
| Listen address | `0.0.0.0` | `src/main.rs` | Edit `src/main.rs` |
| API prefix | `/api/v1` | `src/routes/` | — |
| Swagger | `/swagger`, `/openapi.json` | `src/swagger.rs` | — |
| CORS | React/NestJS dev origins | `CORS_ORIGINS` | Edit `.env` |
| Local config | `.env` | this stack's root | Copy `.env.example` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DB_DRIVER` or URL scheme |
| Connection URL | `DATABASE_URL` | `.env.example`, `src/config.rs` |
| Discrete values | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `src/config.rs` |
| SQLite file | `DB_FILE` | `src/config.rs` |
| Dialect helpers | `src/db.rs` | queries per driver |

## Switching database

| Target | Dependency / driver | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | sqlx `postgres` (already in `Cargo.toml`) | `DB_DRIVER=postgres`, `DATABASE_URL=postgres://...` | `database/postgres/ddl.sql` then `dml.sql` | Reference |
| MySQL | sqlx `mysql` | `DB_DRIVER=mysql`, `mysql://...` | `database/mysql/ddl.sql` then `dml.sql` | — |
| MariaDB | sqlx `mysql` (MySQL URL form) | `DB_DRIVER=mariadb`, MariaDB URL/port | `database/mariadb/ddl.sql` then `dml.sql` | MariaDB speaks the MySQL protocol |
| SQLite | sqlx `sqlite` | `DB_DRIVER=sqlite`, `DB_FILE=./orange.db` | `database/sqlite/ddl.sql` then `dml.sql` | Timestamps are text |

Steps: create the database if needed, load `ddl.sql` then `dml.sql`, set the
driver and URL or discrete values, restart, then verify with the seed accounts.
`DATABASE_URL` wins over the discrete values; `DB_DRIVER` wins over the URL
scheme.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `.env` (gitignored), loaded by `dotenvy`; process environment wins |
| Test | `cargo test`; tests are inline and need no database |
| Production | process environment; use the RSA pair or a strong `JWT_SECRET` |

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
