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
| `frontend/react` | `pnpm build:github` | `tsc` + 43 Vitest tests | Mock E2E 14/14, real E2E 14/14 |
| `frontend/angular` | `npm run build` | 26 Vitest tests, lint clean | Mock E2E 15/15, real E2E 15/15 |
| `frontend/vue` | `pnpm build` | 20 Vitest tests, lint clean | Mock E2E 15/15, real E2E 15/15 |

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

### 3.1 Cross-stack contract acceptance

`scripts/ci/contract-test.mjs` exercises the complete documented API against a
fresh SQLite database. One run performs **327 assertions** per backend.

| Backend | Result | Notable checks |
| --- | --- | --- |
| Spring Boot | 327/327 | envelope + `X-Trace-Id` header, refresh rotation, forced password change, all CRUD, RBAC, logs, CORS |
| Go | 327/327 | same suite |
| NestJS | 327/327 | same suite |
| C# | 327/327 | same suite |
| Rust | 327/327 | same suite |
| FastAPI | 327/327 | same suite |

Run all six with `node scripts/ci/run-contract.mjs` (uses port `18080` and a
throwaway SQLite file per stack). The CI `backend` matrix runs the same script on
pushes.

Inconsistencies found and fixed by this suite:

- Go, NestJS, Rust and Spring Boot returned `40001` for request-body validation;
  they now return `40002` like FastAPI and C#.
- Spring Boot returned the trace id only in the body and as `X-Request-Id`; it
  now also returns the documented `X-Trace-Id` header and puts the trace id in
  success envelopes.
- Vue, NestJS, C# and Spring Boot returned `40002` when disabling a group with
  enabled children; all six now return `40901` (conflict), matching the mock API.
- Rust LIKE filters did not declare `ESCAPE '\'`, so usernames and role codes
  containing `_` were invisible to `keyword`/`id` filters on SQLite/PostgreSQL.

## 4. CI and deployment

`.github/workflows/main.yml` runs on pushes and pull requests to `main`:

- `frontend-react`, `frontend-angular`, `frontend-vue`: lint, type-check, test, build.
- `backend` matrix (`spring`, `go`, `nest`, `csharp`, `rust`, `fastapi`): each stack's
  tests and build, then — on push — an HTTP smoke against PostgreSQL, MySQL, MariaDB
  and SQLite using `scripts/ci/run-db-matrix.mjs`, followed by the full contract
  acceptance suite on SQLite (`scripts/ci/run-contract.mjs`).
- Pull requests skip the four-engine matrix to keep feedback fast; unit tests still run.
- Only `frontend/react/dist` is uploaded to GitHub Pages, after the React job passes.

Angular and Vue are verified but not deployed. Backend hosting is not part of this
workflow; GitHub Pages cannot run server processes.

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

## 6. Frontend real end-to-end

Date: 2026-11-04. Mocks disabled; the dev-server proxies forwarded `/api/v1` to the real backend.

| Backend | Database | React | Vue | Angular |
| --- | --- | --- | --- | --- |
| FastAPI | PostgreSQL | 14/14 | 15/15 | 15/15 |
| Spring Boot | MySQL | 14/14 | 15/15 | 15/15 |
| Go | SQLite | 14/14 | 15/15 | 15/15 |

Each run covered: login with the database account, session restore after reload,
menu navigation, user search, role/permission/group pages, group create/status/delete,
operation-log rows produced by those writes, permission action validation, zh/en
switching, logout and protected-route redirect, and restricted-role redirect.

Scripts: `scripts/e2e/real-react.mjs`, `real-vue.mjs`, `real-angular.mjs`; set
`E2E_BACKEND` and `E2E_DB` to label the run.

Defects found and fixed by this run:

- Vue and Angular menu titles came from the backend, which returns Chinese names
  only. They now translate by path from the shared permission catalog, like React.
- Angular operation-log requests sent empty `from`/`to` filters and the real
  backend rejected them with 400. Empty filters are now omitted.
- Spring Boot's CORS default allowed only `localhost:5173`; it now matches the
  other stacks and allows 5173, 5174 and 4200.

## 7. UI parity

The React implementation is the visual baseline. All three frontends now use the
same system-page shell:

- no page title or filter card; one toolbar row with filters, actions and the
  column-visibility menu;
- page height locked below the 4rem header, so only the table body scrolls;
- one bordered table with a sticky 40px header, 40px rows and plain text cells;
- footer with selected count on the left and `page / totalPages` plus
  previous/next on the right;
- compact status switch (32×18), 8px control radius and 14px table text.

React-specific fixes:

- user/permission/group/role pages no longer scroll their toolbars;
- the column selector moved into the toolbar row;
- permission/group pagination counts expanded tree rows, so expanding a node can
  create additional pages;
- operation logs use one paired date-time range control, defaulting to today
  00:00–23:59.

Vue and Angular column sets, status rendering and footer now match React. Known
remaining shell differences: the sidebar brand block, top-right role/language/user
controls and brand accent are framework-specific; Angular uses a single-month
Material range calendar instead of React's two-month calendar.

## 8. Known unverified items

- openGauss, OceanBase and GoldenDB were not started; their scripts need a smoke test on the target version.
- The Rust project has no committed database integration test, only a reproducible smoke script (`backend/rust-axum/scripts/smoke-databases.ps1`).
- Angular Cesium loads runtime assets from the Cesium CDN; offline behaviour falls back to a static globe.
- The Angular/Vue demo pages use framework-appropriate substitutes for React-only libraries (Recharts, AntV G2, L7).
- The three mock E2E scripts are not in CI.
- Real browser end-to-end was executed for FastAPI+PostgreSQL, Spring+MySQL and
  Go+SQLite. The remaining backend/database combinations are covered by the
  per-stack HTTP smoke tests and the CI database matrix, not by a browser run.

## 9. Re-running

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
