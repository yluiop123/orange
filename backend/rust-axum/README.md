# ORANGE backend — Rust + Axum
A port of `backend/springboot` to **Rust 2021 / Axum 0.8 / Tokio / SQLx**.
It serves the canonical API from [`docs/API.md`](../../docs/API.md) under
`/api/v1` on port **8083** and uses the existing `database/{postgres,mysql,mariadb,sqlite}`
schema and seed (no migrations of its own).

> **Build status — compiled, tested and smoke-tested on all four engines.**
> `cargo check`, `cargo build` and `cargo test` pass (40 unit tests) with the
> `stable-x86_64-pc-windows-gnu` toolchain and the MSYS2 UCRT64 `gcc` linker.
> Live smoke tests passed on PostgreSQL 16, MySQL 8, MariaDB and SQLite:
> `super/super` login, `user-info`, `menus`, users list (plain and keyword
> filtered), role list sorted by name, permission and group lists, group/user/
> role create and delete, and the operation-log list (write + contains filter).
> `scripts/smoke-databases.ps1` reproduces the matrix.
> Windows users without Visual Studio Build Tools should use the GNU toolchain:
>
> ```bash
> rustup toolchain install stable-x86_64-pc-windows-gnu
> cargo +stable-x86_64-pc-windows-gnu build
> ```

## What is implemented

| Area | Behaviour |
| --- | --- |
| Envelope | `{ code, message, data, timestamp, traceId }` on every response, including errors |
| Trace | accepts `X-Trace-Id` (also `X-Request-Id`), generates 16 hex chars otherwise, echoes `X-Trace-Id` |
| Auth | HS256 access token + HttpOnly rotating refresh cookie `refresh_token` (`Path=/api/v1/auth`) |
| Invalidation | `jti` revocation in `sys_revoked_token`, `token_version` in every token, logout bumps it |
| Forced password change | `must_change_password` returns `40302` except for `user-info`, `menus`, `change-password`, `logout` |
| Lockout | 5 failures/user, 20/IP, 15-minute window and lock, persisted in `sys_login_attempt` |
| Passwords | BCrypt (cost 10); accepts the seed's `{bcrypt}$2a$...` prefix; 12-char temporary passwords |
| RBAC | authorities `type#path[:action]`; enabled roles ∪ direct grants − disabled permissions |
| Menus | only enabled `menu`/`directory` nodes, ordered by code, disabled branches are not promoted |
| Tree rules | code shape, immutable codes, parent existence, disable guard, deepest-first delete, reference guards |
| Uniqueness | permission `(type, path, action)` with `NULL` action as one value; role id and username checks |
| Operation log | non-GET writes to `/api/v1/system/*` and `/auth/change-password`; redaction + truncation |
| CORS | configured origins, credentials allowed |

### Business codes

`200`, `40001`, `40002`, `40101`, `40301`, `40302`, `40401`, `40501`,
`40901`, `429` (lockout), `50000` — mapped to the HTTP statuses in
`docs/API.md`. The `429` lockout response follows the Java reference, which
uses business code `429`.

## Prerequisites

- Rust 1.75+ (edition 2021). Only `cargo` is required.
- One of: PostgreSQL 13+, MySQL 8/MariaDB 10.6+, or SQLite 3.24+
  (SQLite is linked in via `libsqlite3-sys` `bundled`; no system library).
- A reachable database and a JWT secret.

## Database setup

The schema and seed are the shared ones from `database/`. Load the engine you
want to run against, then point `DATABASE_URL` at it.

```bash
# PostgreSQL
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql

# MySQL / MariaDB
mysql -u root -proot orange < database/mysql/ddl.sql
mysql -u root -proot orange < database/mysql/dml.sql

# SQLite
sqlite3 orange.db < database/sqlite/ddl.sql
sqlite3 orange.db < database/sqlite/dml.sql
```

The seed stores BCrypt hashes with Spring's `{bcrypt}` id prefix; the Rust
password verifier strips that prefix, so the same seed works unchanged.

`migrations/` is intentionally absent: `database/` is the single source of
truth, as required by `docs/PORTING.md`.

## Configuration

All configuration comes from the environment. Copy `.env.example` to `.env`
(the app loads `.env` with `dotenvy`) or export the variables.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/orange` | SQLx connection string |
| `DB_DRIVER` | inferred from the URL scheme | `postgres`, `mysql`, `mariadb` or `sqlite`; wins over the scheme |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | engine defaults | Discrete connection values, used only when `DATABASE_URL` is unset |
| `DB_FILE` | `DB_NAME` | SQLite file path, used only when `DATABASE_URL` is unset |
| `JWT_SECRET` | dev-only fallback (warns) | HMAC secret for access/refresh tokens |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `PORT` | `8083` | HTTP port |
| `JWT_ACCESS_EXPIRE` | `900` | Access token lifetime (seconds) |
| `JWT_REFRESH_EXPIRE` | `604800` | Refresh token lifetime (seconds) |
| `COOKIE_SECURE` | `false` | `Secure` flag on the refresh cookie (true in production) |
| `COOKIE_SAME_SITE` | `Lax` | `SameSite` value (`None` requires `COOKIE_SECURE=true`) |
| `COOKIE_DOMAIN` | unset | Optional cookie domain |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failures per user before lock |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | Failures per IP before lock |
| `LOGIN_LOCK_MINUTES` | `15` | Window and lock length |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | Log cleanup horizon |

`JWT_SECRET` has a development fallback so the app can start locally; set a
real secret before exposing the service. `CORS_ORIGINS` is also accepted as
`CORS_ALLOWED_ORIGINS` for parity with the Spring configuration name.

## Run

```bash
cd backend/rust-axum
cargo run
```

The server listens on **http://0.0.0.0:8083** and the API base is
**http://localhost:8083/api/v1**.

One process talks to one engine. Pick it with `DB_DRIVER` plus `DATABASE_URL`:

```bash
# PostgreSQL
DB_DRIVER=postgres DATABASE_URL=postgres://postgres:postgres@localhost:5432/orange cargo run

# MySQL
DB_DRIVER=mysql DATABASE_URL=mysql://root:root@localhost:3306/orange cargo run

# MariaDB (same MySQL driver)
DB_DRIVER=mariadb DATABASE_URL=mysql://root:root@localhost:3307/orange cargo run

# SQLite
DB_DRIVER=sqlite DATABASE_URL=sqlite:./orange.db cargo run
```

`DB_DRIVER` wins over the URL scheme, so it must agree with `DATABASE_URL`.
A bare SQLite path (`DATABASE_URL=D:\data\orange.db`) is accepted too.

Smoke check:

```bash
curl -i -X POST http://localhost:8083/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"super","password":"<seed password>"}'
```

The response sets `refresh_token` as an HttpOnly cookie; send
`Authorization: Bearer <token>` afterwards.

## Test

```bash
cd backend/rust-axum
cargo test
```

The `#[cfg(test)]` tests are pure and need no database:

- `domain/tree_code.rs` — code shape (root widths, child = parent + 2, digits, prefix).
- `domain/permission_shape.rs` — `action` requires an action; `menu`/`directory` forbid it.
- `domain/effective.rs` — disabled roles/permissions, union with direct grants, authority strings.
- `domain/tree.rs` — ancestors, enabled descendants, deepest-first delete.
- `auth/lockout.rs` — failure accumulation, window restart, lock and unblock.
- `operation_log.rs` — record policy, sensitive paths, redaction, truncation.

`cargo test` does not need a database. The cross-engine smoke test is a script:

```powershell
cargo build
pwsh -File scripts/smoke-databases.ps1                  # all four engines
pwsh -File scripts/smoke-databases.ps1 -Engine sqlite
```

It expects the per-engine databases from `docs/DB-MATRIX.md` to be loaded and
only creates/deletes its own rows (`0088` group, `smoketest1` user,
`smokerole` role).

## API coverage

34 canonical operations (all of `docs/API.md`), plus no legacy routes:

- Auth (6): login, refresh, logout, user-info, change-password, menus.
- Users (8): list, detail, create, edit, status, reset-password, delete one, delete many.
- Roles (6): list, detail, create, edit, delete one, delete many.
- Groups (7): list, detail, create child (`/children`), edit, status, delete one, delete many.
- Permissions (6): list, detail, create child (`/children`), edit, delete one, delete many.
- Operation logs (1): list.

Deprecated legacy routes (`/add`, `/edit`, `/addChild`, `/detail/{id}`) are not
implemented, as allowed by `docs/API.md §7`.

## Layout

```text
backend/rust-axum/
├── Cargo.toml
├── .env.example
├── scripts/smoke-databases.ps1  # cross-engine smoke test
└── src/
    ├── main.rs              # bootstrap, listener, daily cleanup
    ├── config.rs            # environment configuration
    ├── db.rs                # DB_DRIVER/DATABASE_URL, dialect helpers, dispatch
    ├── state.rs             # Db + Arc<Config>
    ├── error.rs             # business codes + error envelope
    ├── response.rs          # envelope + task-local trace id
    ├── middleware.rs        # trace, auth, optional auth
    ├── operation_log.rs     # audit policy + middleware
    ├── auth/                # JWT, BCrypt, lockout maths, cookie
    ├── domain/              # entities, DTOs, tree/permission policies
    ├── repository/          # SQLx queries
    ├── service/             # business rules and guards
    └── routes/              # Axum handlers and router
```

## Known gaps / risks

- **No database-backed `cargo test`.** `scripts/smoke-databases.ps1` covers the
  four engines end to end, but it is not part of `cargo test`; add `#[ignore]`
  DB tests if the matrix must run in CI.
- Dialect differences are handled in `src/db.rs` and by generating one copy of
  each repository query per driver (`*_repository!` macros). Adding a query
  means editing the macro body once; no `cfg!` branching is needed.
- SQLite stores timestamps as ISO-8601 text, so timestamp filters go through
  `datetime(...)`; rows written by the SQLite seed's `CURRENT_TIMESTAMP`
  defaults are still comparable. Millisecond precision differs from the
  PostgreSQL/MySQL seeds.
- MySQL/MariaDB join-table inserts use `INSERT IGNORE`, which also ignores
  foreign-key failures. The services validate role/permission ids first, so
  the practical behaviour matches the other engines.
- SQLite has no `FOR UPDATE`; login-attempt updates rely on SQLite's writer
  serialisation instead of a row lock.
- Field-level validation errors are returned as a single `message`; the Java
  backend also puts a `{ field: message }` map in `data` for `@Valid` failures.
- Deprecated list parameters (`filterField`, `filterValue`, `orderField`,
  `orderValue`) are ignored, as allowed by `docs/API.md §4`.
- No OpenAPI/Swagger UI. The contract remains `contracts/openapi.json`.
- JWTs are signed with HS256 from `JWT_SECRET`, not the Java backend's RSA key
  pair. Tokens are therefore not interchangeable between the two backends.
- Login lockout concurrency uses `SELECT ... FOR UPDATE` plus an upsert on
  PostgreSQL/MySQL (no row lock on SQLite); a simultaneous first insert for
  the same key can lose one count on SQLite.
- Operation log cleanup runs once at startup and then every 24 hours; there is
  no cron expression configuration.
- The operation log reads at most 16 KiB of a request body. Larger bodies are
  recorded as absent and forwarded empty (all supported write payloads are far
  below this).
- `GET` lists return the seed's demo data; no pagination clamping beyond the
  documented page/size limits.
