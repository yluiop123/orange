# ORANGE backend — Node.js + NestJS

A port of the reference Spring Boot backend to **Node.js LTS + NestJS 11**, with
TypeORM/PostgreSQL, `@nestjs/jwt`, BCrypt and a rotating HttpOnly refresh cookie.
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
| PostgreSQL | 13+ |

`bcrypt` is a native module. With recent pnpm versions its install script must
be approved once:

```bash
pnpm install          # pnpm 12: build approval is stored in pnpm-workspace.yaml
# if your pnpm asks:
pnpm approve-builds bcrypt
```

With npm, scripts run automatically: `npm install`.

## Environment

Copy `.env.example` if you want a reference; the app reads **process
environment variables only** (it does not parse `.env` by itself).

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `orange` | Database |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_SSL` | `false` | `true` enables TLS |
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

## Database setup

The schema and seed are owned by the shared `database/postgres` directory and
are loaded manually (there is no migration tool, exactly like the reference).

```bash
createdb orange
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/dml.sql
```

TypeORM runs with `synchronize: false`; it never changes the schema.

## Run

```bash
pnpm install
export JWT_SECRET=change-me
pnpm build && pnpm start:prod
# development:
pnpm start:dev
```

PowerShell:

```powershell
$env:JWT_SECRET = "change-me"
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

With PostgreSQL seeded and the API running on port 3000:

```bash
pnpm smoke
# or: SMOKE_BASE_URL=http://localhost:3000/api/v1 node scripts/smoke.mjs
```

The script logs in as the seeded `super` user, exercises every resource list,
refresh rotation/replay, the forced-password-change flow, code/permission/tree
guards, operation-log redaction, logout revocation and login lockout. It
creates temporary rows and deletes them again. Current result: **78 checks,
0 failed** (see `scripts/smoke.mjs`).

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
  config/                  environment-backed AppConfig
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
- **No i18n message bundles.** The `Locale` header is accepted, but messages
  are the reference Chinese strings only.
- **No email delivery** for the temporary password; it is returned once in the
  response body (`Cache-Control: no-store` on reset).
- **Unit tests do not boot Nest/PostgreSQL.** Database behavior is verified by
  `scripts/smoke.mjs`, not by Jest e2e tests.
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
