# ORANGE backend — Node.js + NestJS

English | [简体中文](./README.zh-CN.md)

A port of the reference Spring Boot backend to **Node.js LTS + NestJS 11**, with
TypeORM, `@nestjs/jwt`, BCrypt and a rotating HttpOnly refresh cookie. It runs
against PostgreSQL, MySQL, MariaDB and SQLite through one connection switch.
It implements the canonical contract in [`docs/API.md`](../../docs/API.md); the
deprecated legacy routes are intentionally absent.

- Base URL: `http://localhost:3000/api/v1`
- Response envelope: `{ code, message, data, timestamp, traceId }` on every
  response, including errors
- Trace id: accepted from `X-Trace-Id` (also `X-Request-Id`), always echoed in
  the body **and** the `X-Trace-Id` header

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 20 or 22 LTS (developed on Node 24) |
| pnpm | 9+ (`npm` works too) |
| PostgreSQL | 13+ (optional) |
| MySQL / MariaDB | 8.0.16+ / 10.4+ (optional) |
| SQLite | bundled through `better-sqlite3` |

`bcrypt` and `better-sqlite3` are native modules. With recent pnpm versions
their install scripts must be approved once:

```bash
pnpm install          # pnpm 12: build approval is stored in pnpm-workspace.yaml
# if your pnpm asks:
pnpm approve-builds bcrypt better-sqlite3
```

With npm, scripts run automatically: `npm install`.

## Environment

Copy `.env.example` to `.env.local`; the app loads it with `dotenv`
(`src/config/env.ts`), and real environment variables win.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DB_DRIVER` | *(from `DATABASE_URL`, else `postgres`)* | `postgres`, `mysql`, `mariadb` or `sqlite` |
| `DATABASE_URL` | *(unset)* | Full connection URL; wins over the discrete `DB_*` values |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` (PostgreSQL), `3306` (MySQL/MariaDB) | Database port |
| `DB_NAME` | `orange` (`orange.db` for SQLite) | Database or SQLite file |
| `DB_USER` | `postgres` (PostgreSQL), `root` (MySQL/MariaDB) | Database user |
| `DB_PASSWORD` | `postgres` (PostgreSQL), `root` (MySQL/MariaDB) | Database password |
| `DB_SSL` | `false` | `true` enables TLS (PostgreSQL/MySQL) |
| `JWT_SECRET` | `orange-dev-secret-change-me` | HMAC secret for access/refresh JWTs |
| `JWT_ACCESS_EXPIRE` | `900` | Access-token lifetime, seconds |
| `JWT_REFRESH_EXPIRE` | `604800` | Refresh-token lifetime, seconds |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated exact origins, credentials allowed |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `COOKIE_SAME_SITE` | `lax` | `lax`, `strict` or `none` |
| `COOKIE_DOMAIN` | *(unset)* | Optional cookie domain |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failures per user before lockout |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | Failures per IP before lockout |
| `LOGIN_LOCK_MINUTES` | `15` | Window and lock duration |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | Operation-log retention |

### Database selection

One switch for every engine, resolved in this order:

1. `DB_DRIVER` when set (`postgres` / `mysql` / `mariadb` / `sqlite`).
2. Otherwise the `DATABASE_URL` scheme (`postgres://`, `postgresql://`,
   `mysql://`, `mariadb://`, `sqlite:`, `sqlite3:`, `file:`).
3. Otherwise `postgres` (the historical default).

`DATABASE_URL` wins over the discrete `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/
`DB_PASSWORD` values; the discrete values are the fallback.

| Driver | `DB_DRIVER` | `DATABASE_URL` example |
| --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@localhost:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@localhost:3306/orange` |
| MariaDB | `mariadb` | `mysql://root:root@localhost:3306/orange` |
| SQLite | `sqlite` | `sqlite:./orange.db` |

MariaDB is served through TypeORM's `mysql` driver and the `mysql2` client, so
no extra native package is needed; `DB_DRIVER=mariadb` records the target while
the URL may keep the `mysql://` scheme.

## Database setup

The schema and seed are owned by the shared `database/<engine>` directories and
are loaded manually (there is no migration tool, exactly like the reference).
TypeORM runs with `synchronize: false`; it never changes the schema.

PostgreSQL:

```bash
createdb orange
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/dml.sql
```

MySQL / MariaDB (`database/mysql` or `database/mariadb`):

```bash
mysql -h 127.0.0.1 -u root -proot orange < ../../database/mysql/ddl.sql
mysql -h 127.0.0.1 -u root -proot orange < ../../database/mysql/dml.sql
```

SQLite (`database/sqlite`):

```bash
sqlite3 orange.db < ../../database/sqlite/ddl.sql
sqlite3 orange.db < ../../database/sqlite/dml.sql
```

The `better-sqlite3` driver enables `PRAGMA foreign_keys = ON` on every
connection, so `ON DELETE RESTRICT/CASCADE` behaves like PostgreSQL.

### Column portability

The entities keep one set of types for every engine:

| PostgreSQL | MySQL / MariaDB | SQLite |
| --- | --- | --- |
| `timestamptz` | `datetime(6)` | `TEXT` (ISO-8601 UTC), TypeORM `datetime` codec |
| `varchar` | `varchar(255)` | `TEXT` |
| `boolean` | `tinyint(1)` | `INTEGER` 0/1 |
| `bigserial` | `bigint AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |

`src/entities/column-types.ts` picks the timestamp type from `DB_DRIVER`
(`timestamptz` on PostgreSQL, `datetime` elsewhere), so the PostgreSQL schema
and behaviour are unchanged.

## Run

```bash
pnpm install
export JWT_SECRET=change-me
# PostgreSQL (default)
pnpm build && pnpm start:prod

# another engine
export DB_DRIVER=mysql
export DATABASE_URL=mysql://root:root@localhost:3306/orange
pnpm start:prod

# SQLite
export DB_DRIVER=sqlite
export DATABASE_URL=sqlite:./orange.db
pnpm start:prod
```

PowerShell:

```powershell
$env:JWT_SECRET = "change-me"
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "sqlite:./orange.db"
pnpm build
node dist/main.js
```

The server listens on `PORT` (default **3000**). Verify:

```bash
curl http://localhost:3000/api/v1/auth/menus          # 401 envelope
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super","password":"super"}'
```

## Test and build

```bash
pnpm test      # Jest unit tests
pnpm build     # type-check + emit dist/
npm test       # the same scripts work through npm
npm run build
```

Unit tests cover the code policy (against the shared fixture), permission
shape, effective permissions and the login-lockout state machine. They do not
need a database.

### End-to-end smoke test

With the target schema seeded and the API running on port 3000:

```bash
pnpm smoke
# or: SMOKE_BASE_URL=http://localhost:3000/api/v1 node scripts/smoke.mjs
```

The script logs in as the seeded `super` user, exercises every resource list,
refresh rotation/replay, the forced-password-change flow, code/permission/tree
guards, operation-log redaction, logout revocation and login lockout. It
creates temporary rows and deletes them again. Current result: **78 checks,
0 failed** on PostgreSQL, MySQL, MariaDB and SQLite (see `scripts/smoke.mjs`).

## Endpoint coverage

All **34** canonical endpoints from `docs/API.md` are implemented:

| Resource | Count | Endpoints |
| --- | --- | --- |
| Auth | 6 | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/user-info`, `POST /auth/change-password`, `GET /auth/menus` |
| Groups | 7 | `GET /system/groups`, `GET /:groupId`, `PATCH /:groupId`, `PATCH /:groupId/status`, `POST /children`, `DELETE /:groupId`, `DELETE ?ids=` |
| Permissions | 6 | `GET /system/permissions`, `GET /:permissionId`, `PATCH /:permissionId`, `POST /children`, `DELETE /:permissionId`, `DELETE ?ids=` |
| Roles | 6 | `GET /system/roles`, `GET /:roleId`, `POST /`, `PATCH /:roleId`, `DELETE /:roleId`, `DELETE ?ids=` |
| Users | 8 | `GET /system/users`, `GET /:userId`, `POST /`, `PATCH /:userId`, `PATCH /:userId/status`, `POST /:userId/reset-password`, `DELETE /:userId`, `DELETE ?ids=` |
| Operation logs | 1 | `GET /system/operation-logs` |

Deprecated Java routes (`*/add`, `*/edit`, `*/addChild`, `*/detail/{id}`,
`/users/reset/{id}`) are not implemented.

## Behavior notes

- **Tokens.** HS256 access token (`jti`, `typ=access`, `ver`, `username`,
  `sub=user.id`) and refresh token (`typ=refresh`). The refresh token is only
  delivered as an HttpOnly cookie (`refresh_token`, path `/api/v1/auth`),
  rotated on every refresh; the old `jti` is inserted into `sys_revoked_token`
  atomically, so replay returns 401.
- **Invalidation.** `sys_user.token_version` is embedded as `ver`. Password
  change, password reset, disabling a user and logout increment it.
- **Forced password change.** `must_change_password=true` allows only
  `user-info`, `menus`, `change-password` and `logout`; everything else is
  `40302`.
- **Login lockout.** Failures are counted per `user:<lowercased name>` and
  `ip:<address>` in `sys_login_attempt`: 5/20 failures within 15 minutes lock
  that key for 15 minutes. A successful login clears only the user counter.
  Lockout returns HTTP 429 / code 429, like the reference.
- **Passwords.** BCrypt with the Spring `{bcrypt}` prefix so the seeded users
  work and the Java backend can read hashes written here. New/reset passwords
  are 12 characters from the same unambiguous alphabet and set
  `must_change_password=true`.
- **RBAC.** Authorities are `type#path` or `type#path:action`; effective
  permissions are enabled roles ∪ direct grants − disabled permissions. Role
  ids are also kept in the principal for the `super` checks. Menu/directory
  permissions gate the menu tree; API calls are checked against the matching
  authority string.
- **Trees.** Digit-only codes, root 2/4 digits, child = parent + 2, immutable.
  Deleting a subtree is deepest-first with reference guards; disabling a parent
  requires all descendants disabled. Text filters return ancestors.
- **Menus.** `/auth/menus` returns enabled `menu`/`directory` nodes ordered by
  code; a branch with a disabled parent is hidden, not promoted.
- **Operation log.** Non-GET requests to `/api/v1/system/*` and
  `/auth/change-password` are recorded after the response finishes. Bodies of
  `login`, `refresh`, `change-password` and `reset-password` are never stored;
  other bodies redact `password`/`token`/`secret` and truncate to 4000 chars;
  query strings truncate to 500. Retention is 90 days by default.

## Layout

```text
src/
  main.ts                  bootstrap, global prefix, CORS, cookies, trace middleware
  app.module.ts            TypeORM, global guards/interceptors/filter/pipe
  common/                  envelope, errors, trace, validation, tree policies, password
  config/                  environment-backed AppConfig, DB driver + TypeORM options
  auth/                    login/refresh/logout/user-info/change-password, JWT, lockout
  menus/                   /auth/menus tree
  users/ roles/ groups/ permissions/    DTOs, services, controllers
  operation-log/           interceptor, policy, recorder/query
  entities/                TypeORM entities for the shared schema
  policies/                permission shape + effective permissions
scripts/smoke.mjs          end-to-end smoke test
```

## Known gaps

- **No deprecated legacy routes** — intentional per `docs/API.md §7`.
- **No OpenAPI/Swagger generation or UI.** The contract lives in
  `contracts/openapi.json`.
- **No migration tool.** The shared DDL/DML must be loaded manually;
  `synchronize` is disabled.
- **MariaDB uses TypeORM's `mysql` driver** (`mysql2` client) rather than the
  separate `mariadb` package; query behaviour is the same, but MariaDB-only
  driver features are not used.
- **SQLite has no native date type.** `timestamptz` columns are `TEXT`
  ISO-8601 UTC as the shared DDL declares; rows written by `CURRENT_TIMESTAMP`
  defaults have second precision while application writes keep microseconds.
  `varchar(n)` limits and numeric ranges are not enforced by SQLite.
- **No i18n message bundles.** The `Locale` header is accepted, but messages
  are the reference Chinese strings only.
- **No email delivery** for the temporary password; it is returned once in the
  response body (`Cache-Control: no-store` on reset).
- **Unit tests do not boot Nest or a database.** Database behavior is verified
  by `scripts/smoke.mjs`, not by Jest e2e tests.
- **In-process maintenance.** Operation-log retention cleanup runs once at boot
  and daily per process; it is idempotent but not a distributed scheduler.
  Expired `sys_login_attempt` rows are ignored but not periodically deleted.
- **No rate limiting beyond login lockout** (no global request throttling).
- **Legacy compatibility parameters** (`filterField`, `filterValue`,
  `orderField`, `orderValue`) are not accepted; use `keyword`/`sort`.
- **Timestamps are serialized as ISO-8601 UTC** (`...Z`) rather than Java's
  `yyyy-MM-dd HH:mm:ssXXX` string; they represent the same instants and parse
  with `Date`/dayjs.
- **Concurrency conflicts** are mapped to `40901`, but there is no automatic
  optimistic-lock retry.
