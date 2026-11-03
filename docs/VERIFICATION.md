> English | [简体中文](./VERIFICATION.zh-CN.md)

# Verification

> Date: 2026-11-03
> This page records what was actually executed. Anything not listed here is a static review, not a runtime guarantee.

## 1. Stacks

| Stack | Build | Tests | Runtime smoke |
| --- | --- | --- | --- |
| `backend/springboot` | `mvn compile` | 27 unit + 19 Testcontainers integration | PostgreSQL 16 via Testcontainers |
| `backend/go-gin-gorm` | `go build ./...`, `go vet ./...` | `go test ./...` (domain/auth/http) | PostgreSQL 16: login, 40302, CRUD, 409, guards, audit |
| `backend/node-nestjs` | `pnpm build` | 25 Jest tests | PostgreSQL 16: 78 HTTP checks |
| `backend/csharp` | `dotnet build` (0 warnings) | 69 xUnit tests | PostgreSQL 16: auth, RBAC, 409, audit |
| `backend/rust-axum` | `cargo check`, `cargo build` | 40 unit tests | PostgreSQL 16: login, user-info, 6 menu roots, users |
| `backend/python-fastapi` | imports + uvicorn start | 67 pytest tests | PostgreSQL 16: full auth/CRUD/audit flow |
| `frontend/react` | `pnpm build` | `tsc` + 40 Vitest tests | Deployed build; mock and real API |
| `frontend/angular` | `npm run build` | 19 Vitest tests, lint clean | Playwright: all routes, 0 console errors |
| `frontend/vue` | `pnpm build` | 20 Vitest tests, lint clean | Playwright: all 33 routes, CRUD, forced password |

Rust on Windows: the machine has no Visual Studio Build Tools. Verification used
`stable-x86_64-pc-windows-gnu` with the MSYS2 UCRT64 `gcc` linker. On Linux CI,
the default stable toolchain builds without this workaround.

## 2. Databases

| Engine | Verification |
| --- | --- |
| PostgreSQL 16 | Integration tests and every backend smoke test |
| MySQL 8.4 | Docker: load `ddl.sql` + `dml.sql`, constraint probes, seed counts |
| MariaDB 11.8 | Docker: same checks as MySQL |
| SQLite 3.49 | Python `sqlite3`: load, seed counts, constraint accept/reject matrix |
| openGauss | Static compatibility review against 6.0 docs; not executed |
| OceanBase | MySQL-compatible scripts; not executed |
| GoldenDB | MySQL-compatible scripts; not executed |

Seed parity checked on PostgreSQL, MySQL, MariaDB and SQLite: 7 groups, 48
permissions, 67 role grants.

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

## 5. Known unverified items

- openGauss, OceanBase and GoldenDB were not started; their scripts need a smoke test on the target version.
- The Rust project has no committed database integration test, only a manual smoke run.
- Angular Cesium loads runtime assets from the Cesium CDN; offline behaviour falls back to a static globe.
- The Angular/Vue demo pages use framework-appropriate substitutes for React-only libraries (Recharts, AntV G2, L7).
- Browser smoke tests are manual; they are not in CI.

## 6. Re-running

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
