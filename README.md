English | [简体中文](README.zh-CN.md)

# Orange

Orange is a permission, menu and role management admin console. It is built as
one product with nine implementations: three frontends (React, Vue, Angular)
and six backends (Spring Boot, Go, NestJS, C#, Rust, FastAPI), all built
against one HTTP contract and one data model, with SQL for seven database
dialects.

The product is not the point. The point is a behaviour-first reference for
comparing stacks: the same screens, endpoints, error codes and permission
semantics must be reproduced in every stack, so a difference between
implementations is a difference between frameworks or languages, not between
product designs. Nothing is shared at runtime: no frontend imports another, no
backend shares a package. What is shared is verifiable — the frontend's frozen
API snapshot [frontend/openapi.json](frontend/openapi.json), the data model in
[database/](database/), and the check scripts in [scripts/](scripts/).

## Product scope

- **Authentication** — password login, short-lived access tokens, a rotating HttpOnly refresh cookie, logout, forced password change on first login, database-backed login lockout.
- **Authorization** — users, roles, organizations and permissions, plus direct grants, role fusion and a UI-only role switch.
- **System management** — CRUD for the four resources, trees ordered by business code, and a read-only operation log.
- **Demo pages** — dashboards, charts, maps, 3D scenes and component galleries; they exercise the shell and design system and add no backend endpoints.
- **Seed roles** — `super` (all permissions; only it may grant `super` or reset a `super` password), `admin` (system management without `super`) and `user` (read-only demo pages).
- **Pages** — 30 menu pages: 6 dashboards, 8 component pages, 4 chart pages, 2 3D pages, 5 map pages and 5 system pages, plus `/login`, `/forbidden` and `/not-found`.
- **Permission model** — a permission is `type + path + action`; effective permissions are the union of enabled roles and direct grants minus disabled permissions; directory permissions affect menu visibility only.

## Stack matrix

| Stack | Port | Start | Test |
| --- | --- | --- | --- |
| React 19 + Vite + shadcn/Base UI | 5173 | `pnpm dev` | `pnpm test` |
| Vue 3 + Vuetify 3 + Vite | 5174 | `pnpm dev` | `pnpm test` |
| Angular 21 + Material | 4200 | `pnpm start` | `pnpm test` |
| Spring Boot 4 (Java 25) | 8080 | `mvn spring-boot:run` | `mvn -B test` |
| Go + Gin + GORM | 8081 | `go run ./cmd/server` | `go test ./...` |
| NestJS | 3000 | `pnpm start:dev` | `pnpm test` |
| ASP.NET Core (.NET 10) | 8082 | `dotnet run --project src/Orange.Api` | `dotnet test Orange.slnx --no-build` |
| Rust + Axum | 8083 | `cargo run` | `cargo test` |
| Python + FastAPI | 8000 | `python -m app.main` | `python -m pytest -q` |

Backend ports come from `APP_PORT`, with `PORT` as fallback; a local Spring
Boot run usually also sets `SPRING_PROFILES_ACTIVE=local`. Every Node project
uses pnpm: `pnpm install` for React, Vue, Angular and Nest; FastAPI uses
`pip install -r requirements-dev.txt`. Maven, Go modules, Cargo and
`dotnet restore` are handled by their toolchains.

## Quick start

React + FastAPI + SQLite, from a clean checkout:

```bash
# terminal 1 — backend
cd backend/python-fastapi
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
sqlite3 app.db < ../../database/sqlite/ddl.sql
sqlite3 app.db < ../../database/sqlite/dml.sql
DB_DRIVER=sqlite DB_NAME=app.db python -m app.main   # http://127.0.0.1:8000

# terminal 2 — frontend
cd frontend/react
pnpm install
pnpm dev                                             # http://localhost:5173
```

JWT keys are not committed. From the repository root, `pnpm run jwt:keys`
writes `keys/jwt-private.pem` and `keys/jwt-public.pem` (gitignored); set
`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` to those paths to use RS256. Without
them the quick start falls back to HS256 with `JWT_SECRET`. All six backends
accept the same pair.

Without the `sqlite3` CLI, run both scripts through Python's `sqlite3` module
on one connection. React serves mocks by default; to use the backend above, put
`VITE_MOCK_ENABLE=false` and `VITE_PROXY_TARGET=http://127.0.0.1:8000` in
`frontend/react/.env.development.local` and restart the dev server. Sign in
with `super` / `super`, `admin` / `admin` or `user` / `user`.

## API and Swagger

Every backend generates its own document from framework annotations at runtime
and exposes `GET /openapi.json` plus `GET /swagger`:

| Stack | Generator |
| --- | --- |
| Spring Boot | springdoc-openapi annotations (`@Operation`, `@Schema`) |
| FastAPI | FastAPI/Pydantic route metadata |
| NestJS | `@nestjs/swagger` + the CLI plugin |
| ASP.NET Core | Swashbuckle controller metadata |
| Go | swaggo handler annotations |
| Rust | utoipa derives and path annotations |

The frontend owns a separate, frozen snapshot at
[frontend/openapi.json](frontend/openapi.json). Each app serves its own Swagger
UI page at `/swagger` (`#/swagger` in React) from `public/openapi.json`; it never
reads a running backend's generated document. Swagger UI assets come from each
framework (or its CDN). Any backend will do — with FastAPI running:

```bash
cd backend/python-fastapi
DB_DRIVER=sqlite DB_NAME=app.db python -m app.main
# open http://127.0.0.1:8000/swagger
curl -s http://127.0.0.1:8000/openapi.json | head
```

Replace the port with the one from the matrix to use another backend.

## Database design

One logical model, ten tables, all prefixed `sys_`: `sys_group`,
`sys_permission`, `sys_role`, `sys_role_permission`, `sys_user`,
`sys_user_permission`, `sys_user_role`, `sys_revoked_token`,
`sys_login_attempt` and `sys_operation_log`. Structure is canonical in
[database/postgres/ddl.sql](database/postgres/ddl.sql); every other engine
directory is a port. Each directory contains exactly `ddl.sql` (tables, keys,
indexes, checks) and `dml.sql` (seed data).

| Engine | Files | Verification |
| --- | --- | --- |
| PostgreSQL 16 | [ddl.sql](database/postgres/ddl.sql), [dml.sql](database/postgres/dml.sql) | CI matrix and contract acceptance |
| MySQL 8.0.16+ | [ddl.sql](database/mysql/ddl.sql), [dml.sql](database/mysql/dml.sql) | CI matrix |
| MariaDB 11 | [ddl.sql](database/mariadb/ddl.sql), [dml.sql](database/mariadb/dml.sql) | CI matrix |
| SQLite 3 | [ddl.sql](database/sqlite/ddl.sql), [dml.sql](database/sqlite/dml.sql) | CI matrix and contract acceptance |
| openGauss 5/6 | [ddl.sql](database/opengauss/ddl.sql), [dml.sql](database/opengauss/dml.sql) | static review only |
| OceanBase 4 (MySQL mode) | [ddl.sql](database/oceanbase/ddl.sql), [dml.sql](database/oceanbase/dml.sql) | static review only |
| GoldenDB 6 | [ddl.sql](database/goldendb/ddl.sql), [dml.sql](database/goldendb/dml.sql) | static review only |

- The business code `id` is both the primary key and the tree position: roots
  are 2 digits for organizations and 4 for permissions, a child appends 2
  digits to its parent, and sibling order is the code's lexicographic order.
  There is no order column; changing a code changes identity.
- Permission identity is `(type, path, action)`. PostgreSQL enforces it with
  two partial unique indexes; MySQL and MariaDB use a generated `action_key`
  column instead.
- Menus are database rows: `sys_permission` stores `name` and `name_en`, and
  `/auth/menus` returns the one matching the `Locale` header. The frontend ships
  no menu-title catalogue.
- `database/permissions.json` is the permission source of truth.
  `pnpm run permissions:sync` regenerates the generated seed block in all seven
  dialect `dml.sql` files, so none of them can drift silently.
- PostgreSQL, MySQL, MariaDB and SQLite run in CI. openGauss, OceanBase and
  GoldenDB ship static SQL only and are not runtime-verified.
- SQLite foreign keys are per-connection and off by default, so `ddl.sql` and
  `dml.sql` must run in that order on a single connection.

## Documentation

Start with the two shared documents, then open the stack you are working on.

- [frontend/README.md](frontend/README.md) — shared frontend conventions: routing, permission visibility, API and mock switching, design tokens.
- [backend/README.md](backend/README.md) — shared backend layering, response envelope, errors and configuration.
- Frontends: [React](frontend/react/README.md), [Vue](frontend/vue/README.md), [Angular](frontend/angular/README.md).
- Backends: [Spring Boot](backend/springboot/README.md), [Go](backend/go-gin-gorm/README.md), [NestJS](backend/node-nestjs/README.md), [C#](backend/csharp/README.md), [Rust](backend/rust-axum/README.md), [FastAPI](backend/python-fastapi/README.md).
- Every stack README ships as `README.md` (English) and `README.zh-CN.md` (Chinese).

## Design decisions

- **Path is permission identity.** A permission is `type + path + action`, with no separate permission code. The page path is a stable contract; renaming a route is a permission-data migration.
- **The backend owns the menu tree.** `GET /api/v1/auth/menus` returns every enabled `menu` and `directory` node, ordered by code. The frontend renders and filters the tree but never generates routes from it, so a menu failure degrades the sidebar instead of blocking navigation.
- **Business code is the tree order.** Numeric codes encode both the parent prefix and the sibling position, so there is no order column and no runtime reordering.
- **Validation has three layers.** The database enforces invariants for every writer, the backend turns failures into readable business errors, and the frontend pre-checks only to save a round trip; it never grants access.
- **Roles fuse; switching is a view.** Effective permissions are the union of enabled roles plus direct grants, minus disabled permissions. Role switching filters menus and buttons in the UI only and never reduces backend authority.
- **Visibility is not authorization.** Directory permissions control whether a menu appears; API access still requires the matching `menu` or `action` authority, and disabling a permission removes both.
- **Annotations generate docs; behaviour is the contract.** Each backend owns its `/openapi.json`, generated from its own annotations. The frontend's `openapi.json` is a frozen consumer snapshot, and the cross-stack contract test — not a shared runtime spec file — keeps the six implementations aligned.

## Verification and CI

Run the commands for the stack you changed (matrix above), then the root
checks: `node scripts/check-config.mjs`, `pnpm run permissions:check` and
`pnpm run docs:check` (local relative-link check).

[.github/workflows/main.yml](.github/workflows/main.yml) runs on pull requests
to `main`, pushes to `main` and manual dispatch:

- `config` — check-config, permissions:check and docs:check.
- `frontend-react`, `frontend-vue`, `frontend-angular` — install, lint, type-check (React and Vue), test and build; React also builds the Pages artifact on push.
- `backend` — test and build matrix over the six stacks; on push the same job also runs the four-engine database matrix and contract acceptance on SQLite.
- `deploy` — publishes the React build to GitHub Pages; the other frontends are never deployed.

There is no path filter, so a documentation-only change still runs every job.
Pull requests skip the database matrix, contract acceptance and deployment, so
a green PR does not prove backend behaviour.

## License and code of conduct

Orange is released under the MIT License; see [LICENSE](LICENSE). Participation
is governed by the Contributor Covenant in
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
