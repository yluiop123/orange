# ORANGE Backend — Go + Gin + GORM

A port of the ORANGE system-management API to Go. It implements the canonical
contract in [`docs/API.md`](../../docs/API.md) against the existing PostgreSQL
schema in [`database/postgres`](../../database/postgres). The Spring Boot
implementation in `../springboot` is the behavior reference.

- Base path: `/api/v1`
- Default port: **8081**
- Response envelope: `{ code, message, data, timestamp, traceId }`
- `X-Trace-Id` is accepted, generated when absent, and returned in both the body
  and the response header.

## Prerequisites

- Go **1.23+** (developed and tested with Go 1.24.3)
- PostgreSQL 12+ with the project schema and seed loaded
- No database server is installed by this project; it uses the SQL files that
  already exist in the repository.

## Project layout

```text
cmd/server              process entry point, graceful shutdown, log retention
internal/config         environment configuration
internal/auth           JWT access/refresh tokens, BCrypt, refresh cookie
internal/domain         pure policies: code shape, permission shape,
                        effective permissions, tree index, login lockout,
                        operation-log policy
internal/store          GORM models and queries
internal/service        business rules (RBAC guards, tree/reference guards)
internal/http           Gin router, middleware, handlers, envelope
```

Policy and business logic live outside Gin. The required unit tests exercise
those packages directly.

## Database setup

The schema is not created by the application. Load the committed files once:

```powershell
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -f ../../database/postgres/dml.sql
```

The seed creates the demo accounts `super` / `super`, `admin` / `admin` and
`user` / `user`. The hashes are Spring `{bcrypt}` hashes; this service accepts
both prefixed and raw BCrypt hashes and writes prefixed hashes.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8081` | HTTP listen port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `orange` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_SSLMODE` | `disable` | PostgreSQL `sslmode` |
| `DB_TIMEZONE` | `UTC` | Session time zone |
| `JWT_SECRET` | dev fallback | HS256 signing secret. Set this outside local development. |
| `JWT_PRIVATE_KEY_PATH` | — | RSA private key (PKCS#1 or PKCS#8 PEM); enables RS256 |
| `JWT_PUBLIC_KEY_PATH` | — | RSA public key (PKIX or PKCS#1 PEM) |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | — | Inline PEM alternatives to the paths |
| `JWT_ISSUER` | `orange` | JWT issuer claim |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `900` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_SECONDS` | `604800` | Refresh token / cookie lifetime |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins (credentials enabled) |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `COOKIE_SAME_SITE` | `Lax` | `Lax`, `Strict` or `None` |
| `COOKIE_DOMAIN` | — | Optional refresh-cookie domain |
| `COOKIE_PATH` | `/api/v1/auth` | Refresh-cookie path |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failures per username before lockout |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | Failures per IP before lockout |
| `LOGIN_LOCK_MINUTES` | `15` | Failure window and lock duration |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | Operation-log retention |

If RSA keys are configured, RS256 is used and `JWT_SECRET` is ignored.

## Run

```powershell
cd backend/go-gin-gorm
$env:DB_PASSWORD = "postgres"
$env:JWT_SECRET = "replace-with-a-long-random-value"
go run ./cmd/server
```

The API is then available at `http://localhost:8081/api/v1`.
`GET /healthz` returns a small liveness response (outside the business
envelope).

Build a binary:

```powershell
go build -o bin/orange-server ./cmd/server
```

## Test

```powershell
go test ./...
go vet ./...
```

Unit coverage includes:

- tree business-code shape for groups and permissions,
- permission `type`/`action` shape and authority rendering,
- effective permissions (enabled roles + direct grants − disabled),
- login lockout thresholds, window reset and expiry,
- operation-log recording, redaction and truncation,
- JWT access/refresh typing and tamper rejection,
- BCrypt temporary passwords and `{bcrypt}` seed compatibility,
- router envelope, trace header, CORS preflight and 404/401 behavior.

### Optional PostgreSQL smoke test

The smoke test is opt-in and skips automatically when PostgreSQL is not
reachable:

```powershell
$env:ORANGE_SMOKE = "1"
$env:DB_PASSWORD = "postgres"
$env:SMOKE_USERNAME = "super"   # optional
$env:SMOKE_PASSWORD = "super"   # optional
go test ./internal/http -run TestSmokeAgainstPostgres -v
```

It checks the unauthenticated 401 envelope, login token + HttpOnly refresh
cookie, `user-info`, `menus`, one list endpoint per resource, and a 403 for the
demo `user` role.

## Endpoints

All canonical endpoints from `docs/API.md` are implemented (34 routes). Legacy
deprecated routes (`/add`, `/edit`, `/addChild`, `/detail/{id}`, etc.) are
intentionally omitted.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/user-info`, `POST /auth/change-password`, `GET /auth/menus` |
| Groups | `GET /system/groups`, `GET /system/groups/{id}`, `POST /system/groups/children`, `PATCH /system/groups/{id}`, `PATCH /system/groups/{id}/status`, `DELETE /system/groups/{id}`, `DELETE /system/groups?ids=a,b` |
| Permissions | `GET /system/permissions`, `GET /system/permissions/{id}`, `POST /system/permissions/children`, `PATCH /system/permissions/{id}`, `DELETE /system/permissions/{id}`, `DELETE /system/permissions?ids=a,b` |
| Roles | `GET /system/roles`, `GET /system/roles/{id}`, `POST /system/roles`, `PATCH /system/roles/{id}`, `DELETE /system/roles/{id}`, `DELETE /system/roles?ids=a,b` |
| Users | `GET /system/users`, `GET /system/users/{id}`, `POST /system/users`, `PATCH /system/users/{id}`, `PATCH /system/users/{id}/status`, `POST /system/users/{id}/reset-password`, `DELETE /system/users/{id}`, `DELETE /system/users?ids=a,b` |
| Operation logs | `GET /system/operation-logs` |

Authorities use `type#path` or `type#path:action` (for example
`menu#/system/user`, `action#/system/user:add`). The effective set is the union
of all enabled roles and direct user permissions, minus disabled permissions;
menu/directory authorities only control visibility.

## Behavior notes

- Access tokens are short-lived JWTs carrying `jti`, `token_version` (`ver`)
  and the username. Refresh tokens are `HttpOnly` cookies, rotated on every
  refresh; the previous `jti` is stored in `sys_revoked_token` and replaying it
  returns `401`.
- Logout revokes the presented access `jti` and refresh `jti` and increments
  `token_version` (the reference behavior invalidates other sessions too);
  password change and password reset also increment `token_version`.
- `must_change_password` blocks all endpoints except `user-info`, `menus`,
  `change-password` and `logout` with business code `40302`.
- Login lockout counters are persisted in `sys_login_attempt` under `user:<name>`
  and `ip:<addr>`. Five user failures or twenty IP failures within 15 minutes
  lock the key for 15 minutes and return HTTP 429 / code 429.
- New and reset passwords are 12-character temporary passwords (ambiguous
  characters removed) stored as BCrypt and flagged with `must_change_password`.
- Deletes walk the subtree deepest-first. Reference guards reject deleting a
  group subtree that still has users, a permission subtree referenced by a role
  or user, and a role assigned to a user. Disabling a parent requires all
  descendants to be disabled first.
- Operation-log writes apply to non-GET requests to `/api/v1/system/*` and
  `/api/v1/auth/change-password`. Bodies for login/refresh/change-password/
  reset-password are never stored; other JSON bodies redact
  `password`/`token`/`secret` and truncate to 4000 characters; query strings
  truncate to 500.
- CORS allows configured origins with credentials (required for the refresh
  cookie) and supports preflight requests.
- Logged-in timestamps use the reference bean format
  `yyyy-MM-dd HH:mm:ss+offset`; operation-log timestamps use RFC 3339.

## Known gaps

- No deprecated legacy routes. Only the canonical `docs/API.md` contract is
  implemented.
- No OpenAPI/Swagger UI. `contracts/openapi.json` remains the contract.
- `version` columns are read and written but optimistic-lock conflicts are not
  detected; the last write wins, unlike Spring Data's `@Version` check.
- The operation-log retention job is an in-process daily ticker, not an
  external scheduler. Multiple instances each run it.
- Lockout increments use a row lock for existing keys. Two truly simultaneous
  first failures for the same key can resolve through `ON CONFLICT DO NOTHING`
  and lose one increment. Subsequent failures are serialized.
- `Locale: zh|en` is accepted but messages are Chinese only; no i18n catalog.
- There is no automatic schema migration. Run `ddl.sql`/`dml.sql` manually.
- The optional smoke test requires a seeded PostgreSQL database; CI without a
  database runs only the unit tests.
- CORS defaults are development origins. Set `CORS_ORIGINS` explicitly for any
  deployment.
- JWT verification supports a shared HMAC secret or a single RSA key pair; JWKS
  rotation is not implemented.
