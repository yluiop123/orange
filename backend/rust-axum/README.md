# ORANGE backend — Rust + Axum

A port of `backend/springboot` to **Rust 2021 / Axum 0.8 / Tokio / SQLx (PostgreSQL)**.
It serves the canonical API from [`docs/API.md`](../../docs/API.md) under
`/api/v1` on port **8083** and uses the existing `database/postgres` schema and
seed (no migrations of its own).

> **Build status — unverified.** `cargo` and `rustc` are not installed on the
> machine where this port was written. The project has **not** been compiled,
> `cargo test` has **not** been run, and it has **not** been started against
> PostgreSQL. All checks were static (Cargo.toml parsing, module/file
> resolution, brace balance, use-path review). Treat the first `cargo check` as
> part of finishing the port.

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
- PostgreSQL 13+ with the ORANGE schema.
- A reachable database and a JWT secret.

## Database setup

From the repository root:

```bash
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql
```

The seed stores BCrypt hashes with Spring's `{bcrypt}` id prefix; the Rust
password verifier strips that prefix, so the same seed works unchanged.

`migrations/` is intentionally absent: `database/postgres` is the single source
of truth, as required by `docs/PORTING.md`.

## Configuration

All configuration comes from the environment. Copy `.env.example` to `.env`
(the app loads `.env` with `dotenvy`) or export the variables.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/orange` | SQLx connection string |
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

There are no database-backed tests in this port.

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
└── src/
    ├── main.rs              # bootstrap, listener, daily cleanup
    ├── config.rs            # environment configuration
    ├── state.rs             # PgPool + Arc<Config>
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

- **Not built or run** (`cargo` unavailable). Compile errors are possible and
  must be fixed on the first `cargo check`; this is the main risk.
- No integration/smoke test against PostgreSQL (the checklist asks for one; it
  could not be executed here). Add `#[ignore]` DB tests or a shell smoke script
  once a toolchain is available.
- Field-level validation errors are returned as a single `message`; the Java
  backend also puts a `{ field: message }` map in `data` for `@Valid` failures.
- Deprecated list parameters (`filterField`, `filterValue`, `orderField`,
  `orderValue`) are ignored, as allowed by `docs/API.md §4`.
- No OpenAPI/Swagger UI. The contract remains `contracts/openapi.json`.
- JWTs are signed with HS256 from `JWT_SECRET`, not the Java backend's RSA key
  pair. Tokens are therefore not interchangeable between the two backends.
- Login lockout concurrency uses `SELECT ... FOR UPDATE` plus an upsert; a
  simultaneous first insert for the same key can lose one count (same class of
  race the reference handles by catching the integrity violation).
- Operation log cleanup runs once at startup and then every 24 hours; there is
  no cron expression configuration.
- The operation log reads at most 16 KiB of a request body. Larger bodies are
  recorded as absent and forwarded empty (all supported write payloads are far
  below this).
- `GET` lists return the seed's demo data; no pagination clamping beyond the
  documented page/size limits.
