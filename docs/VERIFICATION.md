> English | [简体中文](./VERIFICATION.zh-CN.md)

# Verification

> Date: 2026-11-04
> This page records what was actually executed. Anything not listed here is a static review, not a runtime guarantee.

## 1. Stacks

| Stack | Build | Tests | Runtime smoke |
| --- | --- | --- | --- |
| `backend/springboot` | `mvn compile` | 54 tests (incl. 19 Testcontainers) | PostgreSQL, MySQL, MariaDB, SQLite: login, menus, CRUD, audit |
| `backend/go-gin-gorm` | `go build ./...`, `go vet ./...` | `go test ./...` | PostgreSQL, MySQL, MariaDB, SQLite: full HTTP smoke |
| `backend/node-nestjs` | `pnpm build` | 42 Jest tests | PostgreSQL, MySQL, MariaDB, SQLite: 78 HTTP checks each |
| `backend/csharp` | `dotnet build` (0 warnings) | 69 xUnit tests | PostgreSQL, MySQL, MariaDB, SQLite: auth, RBAC, 409, audit |
| `backend/rust-axum` | `cargo check`, `cargo build` | 40 unit tests | PostgreSQL, MySQL, MariaDB, SQLite: full CRUD smoke |
| `backend/python-fastapi` | imports + uvicorn start | 71 pytest tests | PostgreSQL, MySQL, MariaDB, SQLite: auth/CRUD/audit |
| `frontend/react` | `pnpm build:github` | `tsc` + 43 Vitest tests | Deployed build; mock E2E 14/14 |
| `frontend/angular` | `npm run build` | 26 Vitest tests, lint clean | Mock E2E 15/15 |
| `frontend/vue` | `pnpm build` | 20 Vitest tests, lint clean | Mock E2E 15/15 |

Rust on Windows: the machine has no Visual Studio Build Tools. Verification used
`stable-x86_64-pc-windows-gnu` with the MSYS2 UCRT64 `gcc` linker. Linking the
expanded `sqlx` feature set can exhaust the Windows page file; if linking fails,
build the test profile without debug info:

```powershell
$env:CARGO_PROFILE_TEST_DEBUG='0'
$env:RUSTFLAGS='-C link-arg=-Wl,--no-keep-memory'
cargo +stable-x86_64-pc-windows-gnu test
```

## 2. Databases

| Engine | Verification |
| --- | --- |
| PostgreSQL 16 | Every backend: full smoke against `orange_<stack>` |
| MySQL 8.4 | Every backend: full smoke against `orange_<stack>` |
| MariaDB 11.8 | Every backend: full smoke against `orange_<stack>` |
| SQLite 3.49 | Every backend: full smoke against a per-stack file |
| openGauss | Static compatibility review; not executed |
| OceanBase | MySQL-compatible scripts; not executed |
| GoldenDB | MySQL-compatible scripts; not executed |

The authoritative per-stack result is `docs/DB-MATRIX.md`. Seed parity checked
on PostgreSQL, MySQL, MariaDB and SQLite: 7 groups, 48 permissions, 67 role grants.

## 3. Contract and authorization

- `docs/API.md` is the canonical contract; `contracts/openapi.json` is the machine-readable snapshot.
- All five non-Java backends implement the 34 canonical endpoints and omit the deprecated legacy routes.
- `ControllerAuthorityCoverageTest` keeps `@PreAuthorize` authorities aligned with `permissions.json`.
- Every frontend keeps the access token in memory and restores the session through the HttpOnly refresh cookie.

## 4. CI and deployment

- `.github/workflows/main.yml` compiles and tests the Spring Boot backend.
- The same workflow lints, type-checks, tests and builds `frontend/react`.
- Only `frontend/react/dist` is uploaded to GitHub Pages.
- Angular and Vue are not deployed and are not part of the CI workflow yet.

## 5. Frontend mock end-to-end

Date: 2026-11-04. Playwright against the three dev servers with mock enabled.

| App | Checks | Result |
| --- | --- | --- |
| React | 14 | 14 passed |
| Vue | 15 | 15 passed |
| Angular | 15 | 15 passed |

Each run covered: login, session restore after reload, menu navigation, user
search, all system pages, group create/delete, status toggle and rejected
disable rollback, permission action validation, zh/en switching, logout and
protected-route redirect, restricted-role redirect, and forced password change.

Scripts: `scripts/e2e/` (`mock-react.mjs`, `mock-vue.mjs`, `mock-angular.mjs`).

## 6. Known unverified items

- openGauss, OceanBase and GoldenDB were not started; their scripts need a smoke test on the target version.
- The Rust project has no committed database integration test, only a reproducible smoke script (`backend/rust-axum/scripts/smoke-databases.ps1`).
- Angular Cesium loads runtime assets from the Cesium CDN; offline behaviour falls back to a static globe.
- The Angular/Vue demo pages use framework-appropriate substitutes for React-only libraries (Recharts, AntV G2, L7).
- The three mock E2E scripts are not in CI.
- Real-backend end-to-end (frontend → backend → database) is recorded as pending in `.scratch/2026-11-04-real-e2e.md`.

## 7. Re-running

```bash
# Java
cd backend/springboot && mvn test

# Go
cd backend/go-gin-gorm && go build ./... && go vet ./... && go test ./...

# NestJS
cd backend/node-nestjs && pnpm build && pnpm test

# C#
cd backend/csharp && dotnet build && dotnet test

# Rust
cd backend/rust-axum && cargo test

# FastAPI
cd backend/python-fastapi && .venv/Scripts/python -m pytest

# React
cd frontend/react && pnpm typecheck && pnpm test && pnpm build

# Angular
cd frontend/angular && npm test -- --watch=false && npm run lint && npm run build

# Vue
cd frontend/vue && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
