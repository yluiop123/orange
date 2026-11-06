# ORANGE Backend — Go + Gin + GORM

English | [简体中文](./README.zh-CN.md)

A port of the ORANGE system-management API to Go. It implements the canonical
contract in [`docs/API.md`](../../docs/API.md) against the committed schemas in
[`database/`](../../database). PostgreSQL, MySQL, MariaDB and SQLite are all
supported through one `DB_DRIVER` switch. The Spring Boot implementation in
`../springboot` is the behavior reference.

- Base path: `/api/v1`
- Default port: **8081**
- Response envelope: `{ code, message, data, timestamp, traceId }`
- `X-Trace-Id` is accepted, generated when absent, and returned in both the body
  and the response header.

## Prerequisites

- Go **1.23+** (developed and tested with Go 1.24.3)
- One database, seeded with the matching files under `database/`:
  PostgreSQL 12+, MySQL 8+, MariaDB 10.6+, or SQLite 3.35+
- SQLite uses `github.com/glebarez/sqlite` (pure Go), so no cgo or C compiler is
  required and `CGO_ENABLED=0` builds work.
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

The schema is not created by the application. Load the committed files once for
the engine you want:

```powershell
# PostgreSQL
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -f ../../database/postgres/dml.sql

# MySQL
mysql -uroot -proot -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -proot orange < ../../database/mysql/ddl.sql
mysql -uroot -proot orange < ../../database/mysql/dml.sql

# MariaDB
mysql -uroot -proot -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -proot orange < ../../database/mariadb/ddl.sql
mysql -uroot -proot orange < ../../database/mariadb/dml.sql

# SQLite (no server; the app creates nothing, so run the scripts once)
sqlite3 orange-go.db ".read ../../database/sqlite/ddl.sql"
sqlite3 orange-go.db ".read ../../database/sqlite/dml.sql"
```

The seed creates the demo accounts `super` / `super`, `admin` / `admin` and
`user` / `user`. The hashes are Spring `{bcrypt}` hashes; this service accepts
both prefixed and raw BCrypt hashes and writes prefixed hashes.

## Environment

Connection strings are selected with one switch:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_DRIVER` | `postgres` | `postgres`, `mysql`, `mariadb` or `sqlite`. Also accepts `postgresql`/`pg` and `sqlite3`. |
| `DATABASE_URL` | — | Full connection string. Overrides every discrete `DB_*` value. |
| `DB_HOST` | `localhost` | Host for PostgreSQL/MySQL/MariaDB |
| `DB_PORT` | `5432` (PostgreSQL), `3306` (MySQL/MariaDB) | Port |
| `DB_NAME` | `orange` | Database name |
| `DB_USER` | `postgres` (PostgreSQL), `root` (MySQL/MariaDB) | User |
| `DB_PASSWORD` | `postgres` (PostgreSQL), `root` (MySQL/MariaDB) | Password |
| `DB_SSLMODE` | `disable` | PostgreSQL `sslmode` |
| `DB_TIMEZONE` | `UTC` | PostgreSQL session time zone |
| `DB_PATH` | `orange-go.db` | SQLite file (alias `SQLITE_PATH`); ignored by the other drivers |

Precedence: `DATABASE_URL` wins over the discrete `DB_*`/`DB_PATH` values, which
win over the driver defaults. When `DATABASE_URL` is set without `DB_DRIVER`,
the driver is inferred from the URL scheme (`postgres://`, `mysql://`,
`mariadb://`); anything without a scheme is treated as a SQLite file.

Accepted `DATABASE_URL` forms:

```text
postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable
mysql://root:root@localhost:53306/orange_go
mariadb://root:root@localhost:53307/orange_go
orange-go.db
sqlite:orange-go.db
```

`mysql://` and `mariadb://` URLs are rewritten to go-sql-driver syntax and
always get `parseTime=true&loc=UTC`. SQLite paths get
`_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)` on every pooled connection;
SQLite enforces foreign keys per connection, so this is required.

The remaining settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8081` | HTTP listen port |
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
$env:JWT_SECRET = "replace-with-a-long-random-value"

# PostgreSQL (default)
go run ./cmd/server

# MySQL
$env:DB_DRIVER = "mysql"
$env:DATABASE_URL = "mysql://root:root@localhost:3306/orange"
go run ./cmd/server

# MariaDB
$env:DB_DRIVER = "mariadb"
$env:DATABASE_URL = "mariadb://root:root@localhost:3306/orange"
go run ./cmd/server

# SQLite
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "orange-go.db"
go run ./cmd/server
```

The API is then available at `http://localhost:8081/api/v1`.
`GET /healthz` returns a small liveness response (outside the business
envelope).

Build a binary (set `CGO_ENABLED=0` to prove no cgo is needed):

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
- connection precedence and per-driver DSN rendering,
- timestamp parsing across PostgreSQL, MySQL and SQLite text formats,
- JWT access/refresh typing and tamper rejection,
- BCrypt temporary passwords and `{bcrypt}` seed compatibility,
- router envelope, trace header, CORS preflight and 404/401 behavior.

### Optional database smoke test

The smoke test is opt-in and skips automatically when the configured database is
not reachable. It works for every driver:

```powershell
$env:ORANGE_SMOKE = "1"

# PostgreSQL
$env:DB_DRIVER = "postgres"
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable"

# MySQL / MariaDB
$env:DB_DRIVER = "mysql"
$env:DATABASE_URL = "mysql://root:root@localhost:53306/orange_go"

# SQLite
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "orange-go.db"

$env:SMOKE_USERNAME = "super"   # optional
$env:SMOKE_PASSWORD = "super"   # optional
go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v
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
- Queries are dialect-neutral: LIKE filters escape wildcards with `ESCAPE '!'`
  (backslash is not a portable LIKE escape), token/lockout upserts use GORM
  `clause.OnConflict` (rendered as `ON CONFLICT` on PostgreSQL/SQLite and
  `ON DUPLICATE KEY UPDATE` on MySQL/MariaDB), and no raw SQL uses
  `strpos`, `ILIKE`, `RETURNING` or PostgreSQL casts.
- Timestamps use a GORM serializer because the SQLite schema stores them as
  `TEXT`; it accepts `time.Time`, driver text formats and NULL, so the same
  models read correctly from every engine.
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
- Lockout increments use a row lock (`SELECT ... FOR UPDATE`) on
  PostgreSQL/MySQL/MariaDB. SQLite has no row locks, so it uses one serialized
  connection instead; two truly simultaneous first failures for the same key
  can still lose one increment through `ON CONFLICT DO NOTHING`.
- SQLite runs with `MaxOpenConns(1)` to avoid `SQLITE_BUSY`. It is fine for
  development and the smoke test, but a high-write deployment should use a
  server database or a connection pool designed for SQLite.
- SQLite `TEXT` timestamps are compared lexicographically. Rows written by this
  service use one format; seed rows written by `CURRENT_TIMESTAMP` have a
  different precision. Date-range filters remain correct, sub-second ordering
  between the two formats is not meaningful.
- `Locale: zh|en` is accepted but messages are Chinese only; no i18n catalog.
- There is no automatic schema migration. Run `ddl.sql`/`dml.sql` manually for
  the engine you use.
- The optional smoke test requires a seeded database; CI without a database runs
  only the unit tests.
- CORS defaults are development origins. Set `CORS_ORIGINS` explicitly for any
  deployment.
- JWT verification supports a shared HMAC secret or a single RSA key pair; JWKS
  rotation is not implemented.
