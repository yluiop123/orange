# ORANGE — C# / ASP.NET Core backend

A port of the ORANGE permission-management API to **.NET 10 + ASP.NET Core + EF Core**, at parity with the Java reference in [`backend/springboot`](../springboot) and the contract in [`docs/API.md`](../../docs/API.md).

- Base path: `/api/v1`
- Default port: **8082**
- Databases: **PostgreSQL** (default), **MySQL**, **MariaDB**, **SQLite** — one binary, selected by `DB_DRIVER` / `DATABASE_URL`
- Schema: the shared `database/<engine>/ddl.sql` + `dml.sql` files, no migrations
- Passwords: BCrypt (seed-compatible, including the Spring `{bcrypt}` prefix)
- Tokens: HS256 JWT access token + rotating HttpOnly refresh cookie

## Prerequisites

- .NET SDK **10.0** (`dotnet --version`)
- One of: PostgreSQL 14+, MySQL 8+, MariaDB 10.11+, or SQLite 3.35+
- The engine's client CLI only for loading the schema (the app does not create tables)

## Database setup

Load the shared schema and seed for the engine you want, from the repository root:

```bash
# PostgreSQL
cd database/postgres
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f ddl.sql
psql -U postgres -d orange -f dml.sql

# MySQL
cd database/mysql
mysql -uroot -proot -e "CREATE DATABASE orange;"
mysql -uroot -proot orange < ddl.sql
mysql -uroot -proot orange < dml.sql

# MariaDB
cd database/mariadb
mysql -uroot -proot -e "CREATE DATABASE orange;"
mysql -uroot -proot orange < ddl.sql
mysql -uroot -proot orange < dml.sql

# SQLite
cd database/sqlite
sqlite3 orange-csharp.db < ddl.sql
sqlite3 orange-csharp.db < dml.sql
```

The seed creates the demo accounts:

| Username | Password |
| --- | --- |
| `super` | `super` |
| `admin` | `admin` |
| `user` | `user` |

The seed stores hashes as `{bcrypt}$2a$...`; the app strips the Spring prefix before BCrypt verification.

There is no migration tool (matching the repository rule). Re-run `ddl.sql` only against a fresh database.

## Configuration

Everything is read from environment variables. Unknown/blank values fall back to the defaults below.
Real environment variables win over `.env.local`, which only fills the gaps.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_DRIVER` | `postgres` | Engine: `postgres`, `mysql`, `mariadb` or `sqlite` |
| `DATABASE_URL` | empty | One-line connection URL. **Wins over the discrete `DB_*` values.** |
| `DB_HOST` | `localhost` | Database host (non-SQLite) |
| `DB_PORT` | `5432` (`postgres`) / `3306` (`mysql`, `mariadb`) | Database port |
| `DB_NAME` | `orange` | Database name. For SQLite it is used as the file name only when it ends in `.db` |
| `DB_USER` | `postgres` (`postgres`) / `root` (MySQL family) | Database user |
| `DB_PASSWORD` | `postgres` (`postgres`) / `root` (MySQL family) | Database password |
| `SQLITE_PATH` | `orange-csharp.db` | SQLite file path when `DATABASE_URL` is unset |
| `JWT_SECRET` | development-only constant | HMAC key for access/refresh tokens. **Set this in production.** |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins (credentials enabled). `CORS_ALLOWED_ORIGINS` is accepted as a fallback. |
| `PORT` | `8082` | HTTP listen port |
| `APP_PORT` | `PORT` or `8082` | HTTP listen port (wins over `PORT`) |
| `ACCESS_TOKEN_SECONDS` | `900` | Access token lifetime |
| `REFRESH_TOKEN_SECONDS` | `604800` | Refresh token / cookie lifetime |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failures per user before lockout |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | Failures per IP before lockout |
| `LOGIN_LOCK_MINUTES` | `15` | Window and lock duration |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `COOKIE_SAME_SITE` | `Lax` | `Lax`, `Strict`, or `None` |
| `COOKIE_DOMAIN` | empty | Optional cookie domain |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | Audit-log retention |

### Connection precedence

1. `DATABASE_URL`, when set, defines the connection. Supported schemes:
   - `postgres://user:password@host:port/database` (also `postgresql://`)
   - `mysql://user:password@host:port/database`
   - `mariadb://user:password@host:port/database`
   - `sqlite:///absolute/path.db`, `sqlite:relative.db`, or `file:path.db`
2. Otherwise `DB_DRIVER` plus the discrete `DB_*` values build the connection string.
3. `DB_DRIVER` defaults to `postgres`; when it is unset and `DATABASE_URL` is set, the URL scheme selects the engine. A `DB_DRIVER` that contradicts the URL scheme fails at startup with a clear error.
4. With `DB_DRIVER=sqlite` and no scheme, `DATABASE_URL` is treated as a file path.

Note: the generated `.env.local` pins `DB_PORT=5432`. When switching `DB_DRIVER` to `mysql` or `mariadb`, set `DB_PORT=3306` (or use `DATABASE_URL`) because real environment variables override that file.

Query-string transport options are honoured where they exist: `?sslmode=disable|require|...` is mapped to the provider equivalent. Everything else must be configured through `DB_*`.

Examples:

```bash
# PostgreSQL
DB_DRIVER=postgres DATABASE_URL=postgres://postgres:postgres@localhost:5432/orange dotnet run --project src/Orange.Api

# MySQL
DB_DRIVER=mysql DATABASE_URL=mysql://root:root@localhost:3306/orange dotnet run --project src/Orange.Api

# MariaDB
DB_DRIVER=mariadb DATABASE_URL=mariadb://root:root@localhost:3306/orange dotnet run --project src/Orange.Api

# SQLite
DB_DRIVER=sqlite SQLITE_PATH=./orange-csharp.db dotnet run --project src/Orange.Api
```

### Engine differences that the code handles

- PostgreSQL keeps `timestamptz` and `DateTimeOffset` end to end and searches with `ILIKE`.
- MySQL/MariaDB use `datetime(6)`; SQLite stores ISO-8601 UTC text. A value converter maps `DateTimeOffset` to a UTC `DateTime` and restores the UTC kind on read.
- List filters use `lower(column) LIKE pattern ESCAPE '\'` on the non-PostgreSQL engines.
- Upserts: `ON CONFLICT` on PostgreSQL/SQLite, `ON DUPLICATE KEY UPDATE` / `INSERT IGNORE` on MySQL/MariaDB.


## Run

```bash
cd backend/csharp
dotnet run --project src/Orange.Api
```

Then the API is at `http://localhost:8082/api/v1`. Example:

```bash
curl -i -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super","password":"super"}'
```

## Build and test

```bash
cd backend/csharp
dotnet build
dotnet test
```

`dotnet test` runs the xUnit suite (69 tests) covering:

- tree code policy (root length, child length, parent prefix)
- permission shape policy (`action` vs `menu`/`directory`)
- effective permissions (enabled roles + direct grants − disabled, authority format)
- login lockout (5/user, 20/IP, window reset, lock expiry, key normalization)
- BCrypt compatibility with the PostgreSQL seed hashes
- operation-log recording/redaction/truncation rules
- tree index subtree/ancestor/delete-order rules

## Endpoints

All canonical endpoints from `docs/API.md` are implemented (34 total). Deprecated legacy routes are intentionally absent.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/user-info`, `POST /auth/change-password`, `GET /auth/menus` |
| Users | `GET/POST /system/users`, `GET/PATCH/DELETE /system/users/{id}`, `PATCH /system/users/{id}/status`, `POST /system/users/{id}/reset-password`, `DELETE /system/users?ids=` |
| Roles | `GET/POST /system/roles`, `GET/PATCH/DELETE /system/roles/{id}`, `DELETE /system/roles?ids=` |
| Groups | `GET /system/groups`, `GET/PATCH/DELETE /system/groups/{id}`, `PATCH /system/groups/{id}/status`, `POST /system/groups/children`, `DELETE /system/groups?ids=` |
| Permissions | `GET /system/permissions`, `GET/PATCH/DELETE /system/permissions/{id}`, `POST /system/permissions/children`, `DELETE /system/permissions?ids=` |
| Operation logs | `GET /system/operation-logs` |

Behavior preserved from the reference:

- `{ code, message, data, timestamp, traceId }` envelope on success and error; `X-Trace-Id` is returned in the body and response header. `X-Request-Id` is also accepted and echoed for compatibility with the Java backend.
- Business codes `200/40001/40002/40101/40301/40302/40401/40501/40901/50000`, plus the Java-compatible `429` login-lockout response.
- Access token + HttpOnly `refresh_token` cookie scoped to `/api/v1/auth`; refresh rotation revokes the previous `jti` (replay returns 401).
- `sys_user.token_version` is embedded as `ver` and checked on every request. Logout revokes the access `jti` and bumps the token version.
- `must_change_password` allows only `user-info`, `menus`, `change-password`, `logout`; everything else returns `40302`.
- Login lockout counters persist in `sys_login_attempt` as `ip:<addr>` / `user:<name>` rows.
- 12-character temporary password on user creation and password reset, with `must_change_password = true`.
- Authorities are `type#path` / `type#path:action`; effective permissions are the union of enabled roles and direct grants minus disabled permissions.
- Menu tree returns only enabled `menu`/`directory` nodes ordered by code; branches with a disabled/missing parent are hidden.
- Code policy, permission shape, permission `(type,path,action)` uniqueness, parent existence, deepest-first subtree deletes, reference guards, disable guards, self/last-super guards, and grant guards.
- Operation-log middleware records non-GET requests to `/api/v1/system/*` and `/auth/change-password`; sensitive paths never store the body; bodies redact `password`/`token`/`secret` and truncate at 4000 characters; query strings truncate at 500; rows expire after the retention period.
- CORS allows the configured origins with `AllowCredentials`.

## Project layout

```
backend/csharp/
├── Orange.slnx
├── src/Orange.Api/
│   ├── Program.cs                 # host, DI, middleware pipeline
│   ├── Configuration/             # environment options
│   ├── Contracts/                 # request/response DTOs
│   ├── Controllers/               # minimal controllers per resource
│   ├── Data/                      # provider switch, dialect helpers, DbContext + mappings
│   ├── Domain/                    # policies, entities, exceptions, log rules
│   ├── Middleware/                # trace, errors, validation, operation log
│   ├── Security/                  # JWT, cookies, auth middleware, RBAC, lockout
│   └── Services/                  # business logic
└── tests/Orange.Tests/            # xUnit unit tests
```

## Verification performed

- `dotnet build` — 0 warnings, 0 errors.
- `dotnet test` — 69 passed, 0 failed.
- Smoke test against all four engines, each with its own seeded database from `database/<engine>`:
  `super`/`super` login, `user-info`, `menus` (6 roots, ordered by code, no action nodes), users list, filtered users/groups/operation-log lists, group create → read → delete, and refresh rotation with a rejected replay.

  | Engine | Endpoint | Result |
  | --- | --- | --- |
  | PostgreSQL 16 | `localhost:55432/orange_csharp` | pass |
  | MySQL 8 | `localhost:53306/orange_csharp` | pass |
  | MariaDB 11.8 | `localhost:53307/orange_csharp` | pass |
  | SQLite | `orange-csharp.db` | pass |

- Earlier PostgreSQL smoke (single-engine) also covered:
  - unauthenticated request → 401 envelope with reused trace id
  - `user` calling a system endpoint → 403/40301
  - create user → 12-char temporary password; forced password change → 40302; change password → old token rejected; new login works
  - duplicate permission identity → 409; referenced role delete → 409; unknown route → 40401; wrong method → 40501
  - logout revokes the access token; CORS preflight with credentials

## Known gaps

- **EF Core is pinned to 9.x.** `Pomelo.EntityFrameworkCore.MySql` 9.0.0 is the current release and requires EF Core 9; Npgsql and the SQLite provider are pinned to the same major. Upgrading to EF Core 10 needs a Pomelo 10 release. Mixing Pomelo 9 with EF Core 10 fails at runtime with `MissingMethodException` (`AbstractionsStrings.ArgumentIsEmpty`), so versions must move together.
- **Non-PostgreSQL timestamps lose the offset.** MySQL/MariaDB `datetime(6)` and SQLite text have no offset; the app stores UTC and renders `+00:00`. Values written by another stack in a different zone would be read as UTC.
- **MySQL/MariaDB collations are case-insensitive by default.** `username` and `jti` equality therefore matches case-insensitively there, while PostgreSQL is case-sensitive. This comes from the shared schema, not the code.
- **SQLite `lower()` folds ASCII only.** Case-insensitive list filters behave identically for ASCII and may differ for non-ASCII text; PostgreSQL is locale-aware.
- **Concurrency tokens and autogenerated ids rely on the engine defaults** (`bigserial`, `AUTO_INCREMENT`, `AUTOINCREMENT`) present in the shipped DDL; the app never creates or migrates schema.
- **No OpenAPI/Swagger UI** is served. `contracts/openapi.json` remains the machine-readable contract; adding Swashbuckle would be a new dependency.
- **No migrations or automatic schema/seed load.** The shared SQL files must be applied manually, as documented above.
- **JWT algorithm differs from the Java reference.** Java signs RS256 with PEM keys; this port uses HS256 with `JWT_SECRET` because the required environment list does not include key paths. Token claims (`jti`, `typ`, `ver`, `username`, `sub`) match.
- **`Locale` header is not implemented.** Messages are Chinese, matching the Java backend's actual behavior, not the optional i18n note in `docs/API.md`.
- **Timestamp formatting is ISO-8601** (`2026-11-03T08:00:00+00:00`), as the API document specifies. Java entity beans use a space-separated pattern; clients that string-compare timestamps may notice.
- **`created_by` / `updated_by` are not populated.** Java fills them from the security context; this port writes `create_time` / `update_time` and the optimistic-lock `version` only.
- **Denied writes are also audited.** The operation-log middleware wraps authentication, so a non-GET to `/api/v1/system/*` that ends in 401/403 is recorded with `username = anonymous` (or the authenticated caller). Java's servlet interceptor only sees requests that pass Spring Security.
- **Login-attempt concurrency is best-effort.** A read-then-upsert per key is race-safe for uniqueness but two simultaneous failures can undercount by one; Java uses a pessimistic row lock.
- **Retention cleanup cadence is every 6 hours**, not a configurable daily cron.
- **No committed database integration tests.** The xUnit suite is unit-level; the multi-engine HTTP smoke tests were run manually against disposable containers and a SQLite file. CI would need the four services and a scripted smoke test.
- **No optimistic-lock retry loop.** Concurrent edits return `40901` ("数据冲突，请刷新后重试") instead of retrying.
- **Legacy routes are absent by design**: `POST .../add`, `POST .../edit`, `POST .../addChild`, `GET .../detail/{id}`, and `POST /system/permissions` (legacy list) are not implemented.
- **`docs/STACKS.md` was not updated** because changes outside `backend/csharp` are out of scope for this port.
