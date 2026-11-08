English | [简体中文](README.zh-CN.md)

# Orange

Orange is a permission-first admin console built as a behaviour-first reference:
the same product is implemented by three frontends (React, Vue, Angular) and six
backends (Spring Boot, Go, NestJS, ASP.NET Core, Rust, FastAPI) against one HTTP
contract and one data model. SQL is provided for seven database dialects.

| Dashboard | Form |
| --- | --- |
| ![Dashboard](readme/images/dashboard.png) | ![Form](readme/images/form.png) |
| ![Charts](readme/images/rechart.png) | ![Map](readme/images/disaster-command.png) |

## What it does

- **Authentication** — password login, short-lived access tokens, a rotating
  HttpOnly refresh cookie, logout, forced first-login password change and
  database-backed login lockout.
- **Authorization** — users, roles, organizations and permissions, plus direct
  grants, role fusion and a UI-only role switch.
- **System management** — CRUD for the four system resources, trees ordered by
  business code, menu i18n and a read-only operation log.
- **Demo pages** — dashboards, charts, maps, 3D scenes and component galleries.
  They exercise the shell and design system and add no backend endpoints.
- **Seed roles** — `super` (all permissions), `admin` (system management without
  `super`) and `user` (read-only demo pages). The demo passwords are the same as
  the usernames.

## Architecture and directories

Nothing is shared at runtime: no frontend imports another, and no backend shares
a package. What is shared is verifiable — the frozen frontend API snapshot
[frontend/openapi.json](frontend/openapi.json) and the data model in
[database/](database/).

| Directory | Purpose |
| --- | --- |
| [frontend/](frontend/README.md) | Shared frontend conventions and the three SPA implementations |
| [backend/](backend/README.md) | Shared backend conventions and the six API implementations |
| [database/](database/README.md) | Table definitions, seed data and the seven SQL dialects |
| [readme/images/](readme/images/) | Screenshots used by this README |
| [.github/workflows/main.yml](.github/workflows/main.yml) | CI: frontend and backend matrices, GitHub Pages deployment |

## Supported stacks

| Service | Stack | Port | Start | Documentation |
| --- | --- | --- | --- | --- |
| Frontend | React 19 + Vite + shadcn/Base UI | 5173 | `pnpm dev` | [frontend/react](frontend/react/README.md) |
| Frontend | Vue 3 + Vuetify 3 + Vite | 5174 | `pnpm dev` | [frontend/vue](frontend/vue/README.md) |
| Frontend | Angular 21 + Material | 4200 | `pnpm start` | [frontend/angular](frontend/angular/README.md) |
| Backend | Spring Boot 4 / Java 25 | 8080 | `mvn spring-boot:run` | [backend/springboot](backend/springboot/README.md) |
| Backend | Go + Gin + GORM | 8081 | `go run ./cmd/server` | [backend/go-gin-gorm](backend/go-gin-gorm/README.md) |
| Backend | NestJS 11 | 3000 | `pnpm start:dev` | [backend/node-nestjs](backend/node-nestjs/README.md) |
| Backend | ASP.NET Core / .NET 10 | 8082 | `dotnet run --project src/Orange.Api` | [backend/csharp](backend/csharp/README.md) |
| Backend | Rust + Axum | 8083 | `cargo run` | [backend/rust-axum](backend/rust-axum/README.md) |
| Backend | Python + FastAPI | 8000 | `python -m app.main` | [backend/python-fastapi](backend/python-fastapi/README.md) |

Runtime databases: PostgreSQL (reference), MySQL, MariaDB and SQLite. openGauss,
OceanBase and GoldenDB ship static SQL only. See [database/](database/README.md).

Backend ports come from `APP_PORT`, with `PORT` as a fallback. Spring Boot reads
only `APP_PORT`. Each stack keeps its own lockfile or dependency manifest.

## Requirements

| Tool | Version used here |
| --- | --- |
| Node.js | 20.19+ or 22.12+ (CI uses the current LTS) |
| pnpm | 12.15.0 (`packageManager` in each Node project) |
| Java | 25 (Spring Boot) |
| Go | 1.23+ |
| .NET | 10 |
| Rust | 1.75+ |
| Python | 3.13+ |

## Quick start

React + FastAPI + SQLite, from a clean checkout:

```bash
# terminal 1 — database and backend
cd backend/python-fastapi
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
sqlite3 orange.db < ../../database/sqlite/ddl.sql
sqlite3 orange.db < ../../database/sqlite/dml.sql
export DB_DRIVER=sqlite DB_NAME=orange.db           # Windows: $env:DB_DRIVER="sqlite"; $env:DB_NAME="orange.db"
python -m app.main                                  # http://127.0.0.1:8000
```

```bash
# terminal 2 — frontend
cd frontend/react
pnpm install
VITE_MOCK_ENABLE=false VITE_PROXY_TARGET=http://127.0.0.1:8000 pnpm dev
# http://127.0.0.1:5173
```

Sign in with `super / super`, `admin / admin` or `user / user`.

Startup order is database → backend → frontend. The frontends can also start
alone: development mode enables the in-browser mock by default, so no backend is
required to browse the demo.

JWT keys are not committed. Generate the development RSA pair into
`backend/keys/` and point `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` at it to use RS256;
without keys the backends fall back to HS256 with `JWT_SECRET`. The OpenSSL
commands and variable precedence are in
[backend configuration](backend/README.md#jwt-keys).

## Configuration at a glance

| Item | Default | Where to change it |
| --- | --- | --- |
| Frontend ports | React 5173, Vue 5174, Angular 4200 | `frontend/*/vite.config.ts`, `frontend/angular/angular.json` |
| Backend ports | Spring 8080, Go 8081, NestJS 3000, ASP.NET Core 8082, Rust 8083, FastAPI 8000 | `APP_PORT` / `PORT` in each backend |
| API prefix | `/api/v1` | Frontend env files and Angular `environment.*.ts`; backend global prefix |
| Dev proxy target | `http://127.0.0.1:8080` | `vite.config.ts`, `frontend/angular/proxy.conf.json` |
| Mock | On in development | `VITE_MOCK_ENABLE`, Angular `environment.local.ts` |
| Database | PostgreSQL | `DB_DRIVER`, `DATABASE_URL` and the discrete `DB_*` variables |
| JWT | HS256 with `JWT_SECRET`; RS256 when both RSA keys are set | Environment variables |

Exact variables, precedence and per-stack file names are documented in
[backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## Documentation

- [Frontend overview](frontend/README.md) — shared API, auth, permission, UI and
  mock conventions; links to React, Vue and Angular.
- [Backend overview](backend/README.md) — shared envelope, error codes, auth,
  configuration and database switching; links to all six stacks.
- [Database](database/README.md) — table structure, initialization and dialect
  differences.

## Verification and CI

Run the commands for the stack you changed. CI runs frontend lint, type-check,
test and build for React/Vue/Angular, and the test/build matrix for all six
backends. Pull requests skip deployment; CI does not start a live backend or a
database server.

## License

Orange is released under the MIT License; see [LICENSE](LICENSE).
