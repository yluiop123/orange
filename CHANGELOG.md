# Changelog

## Unreleased

### Changed

- Configuration is per stack. The root `config/` directory and
  `scripts/sync-config.mjs` were removed; each frontend/backend now documents and
  ships its own example (`frontend/<stack>/.env*`,
  `backend/<stack>/.env.example`, `application-local.example.yaml`).
- Documentation is split into technology-agnostic `docs/`, `frontend/docs/` and
  `backend/docs/`. Database design is documented once in `docs/DATABASE.md`.
- React, Vue and Angular login pages, tab styling and dark surface tokens were
  aligned. Vue and Angular now render the same 70 component tabs and 7 Recharts
  tabs as React, with the same labels and order.
- Every backend now has a Chinese README (`README.zh-CN.md`).

## 1.0.0 — 2026-11-04

First repository-wide parity release.

### Added

- Six backend implementations of the same 34-endpoint contract: Spring Boot, Go/Gin/GORM,
  NestJS, ASP.NET Core, Rust/Axum and FastAPI.
- Three frontends with the same 33 routes: React, Angular and Vue.
- Seven database scripts: PostgreSQL, MySQL, MariaDB, SQLite, openGauss, OceanBase, GoldenDB.
- Single-source configuration: `config/app.example.env` plus `scripts/sync-config.mjs`.
- Mock mode for all three frontends, covering login, menus, CRUD, operation logs and errors.
- Playwright scripts for mock and real end-to-end runs (`scripts/e2e/`).
- CI matrix for all frontends and backends, with a PostgreSQL/MySQL/MariaDB/SQLite
  HTTP smoke for every backend (`scripts/ci/`).

### Changed

- All backends use the same environment variable names (`APP_PORT`, `DB_*`, `JWT_*`,
  `CORS_ORIGINS`, `LOG_RETENTION_DAYS`).
- React is pinned to `HashRouter`; `VITE_ROUTE` was removed.
- Angular and Vue now translate menu titles client-side, matching React.
- Spring Boot CORS defaults to `localhost:5173`, `5174` and `4200`, matching the other stacks.

### Fixed

- React: runtime 40302 forced password change, role-switch redirect, permission shape
  validation, mock guards, dialog reset losing untouched fields.
- Angular: mock mode, 403 dialog, locale refresh, self-disable, token pre-refresh,
  permission action error display, operation-log empty filters.
- Vue: status switch rollback on a rejected write.
- Rust: SQLx queries rewritten for PostgreSQL/MySQL/MariaDB/SQLite.

### Verified

- Backends × PostgreSQL/MySQL/MariaDB/SQLite: 6 × 4 pass.
- Mock E2E: React 14/14, Vue 15/15, Angular 15/15.
- Real E2E: FastAPI+PostgreSQL, Spring+MySQL, Go+SQLite — React 14/14, Vue 15/15,
  Angular 15/15 each.
- openGauss, OceanBase and GoldenDB remain static compatibility targets; no instance
  was used.
