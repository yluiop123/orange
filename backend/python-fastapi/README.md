# ORANGE — Python / FastAPI backend

A Python 3.13 + FastAPI port of the ORANGE system-management API. It implements
the canonical contract in [`docs/API.md`](../../docs/API.md) at parity with the
Spring Boot reference (`backend/springboot`) and is intended to run against the
PostgreSQL schema in `database/postgres`.

- Base path: `/api/v1`
- Default port: `8000`
- Every response uses `{ code, message, data, timestamp, traceId }` and every
  response carries the same `traceId` in the `X-Trace-Id` header.
- Interactive docs: <http://localhost:8000/docs>

## Prerequisites

- Python **3.13** (the project uses modern `str | None` annotations; 3.11+
  probably works, 3.13 is the supported version).
- PostgreSQL 13+ with the ORANGE schema loaded.
- A C toolchain is **not** required: `psycopg[binary]` and `bcrypt` ship wheels.

## Install

```bash
cd backend/python-fastapi
python3.13 -m venv .venv
# Windows: .venv\Scripts\python -m pip install -r requirements-dev.txt
source .venv/bin/activate
pip install -r requirements-dev.txt
```

`requirements-dev.txt` adds `pytest` and `httpx` on top of `requirements.txt`.

## Environment variables

Only the variables in the porting checklist are required. Everything else has a
development default.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `orange` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | insecure dev value | HS256 signing secret — **set this in production** |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins (credentials enabled) |
| `PORT` | `8000` | HTTP port used by `python -m app.main` |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `900` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_SECONDS` | `604800` | Refresh-token lifetime |
| `COOKIE_SECURE` | `false` | Mark the refresh cookie `Secure` |
| `COOKIE_SAME_SITE` | `lax` | `lax` / `strict` / `none` |
| `COOKIE_DOMAIN` | empty | Optional refresh-cookie domain |
| `LOGIN_MAX_ATTEMPTS` | `5` | Failures per username before lockout |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | Failures per IP before lockout |
| `LOGIN_LOCK_MINUTES` | `15` | Window and lock duration |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | Audit-log retention |

See `.env.example` for a copy-paste template. The process reads the real
environment; it does not load `.env` automatically.

## Database setup

Create the database and load the shared schema and seed (from this directory):

```bash
createdb orange
psql -d orange -f ../../database/postgres/ddl.sql
psql -d orange -f ../../database/postgres/dml.sql
```

The seed includes the demo users `super` / `super`, `admin` / `admin` and
`user` / `user` (BCrypt hashes are prefixed with `{bcrypt}`; the verifier accepts
both prefixed and bare hashes).

## Run

```bash
# from backend/python-fastapi, with the virtualenv active
python -m app.main
# or
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`PORT` only affects `python -m app.main`; pass `--port` to uvicorn explicitly if
you need a different port.

Smoke check:

```bash
curl -i -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Trace-Id: my-trace-0001" \
  -d '{"username":"super","password":"super"}'
```

The response sets the HttpOnly `refresh_token` cookie (path `/api/v1/auth`) and
returns an access token. Send it as `Authorization: Bearer <token>`.

## Test

```bash
# from backend/python-fastapi, with the virtualenv active
python -m pytest -q
```

The suite does **not** need PostgreSQL:

- pure unit tests for code policy, permission shape, effective permissions,
  login lockout, operation-log redaction/truncation, temporary passwords and the
  tree index;
- envelope/authentication tests that exercise the real ASGI app;
- an end-to-end SQLite integration suite covering login, refresh rotation and
  replay rejection, logout, RBAC/40301, forced password change/40302, list
  endpoints, CRUD, reference guards, permission identity conflicts and operation
  logging (SQLite is an in-memory test double, not a supported deployment).

A live PostgreSQL smoke test was also run against PostgreSQL 16 with
`database/postgres/ddl.sql` + `dml.sql` loaded, using
`scripts/smoke_pg.py`. It verified:

- unauthenticated request → 401 with the envelope and `X-Trace-Id`;
- `super` login → access token + HttpOnly refresh cookie;
- `user-info`, `menus` and one list endpoint per resource;
- a plain user calling `/system/users` → 403/`40301`;
- group create/delete, permission identity conflict → 409;
- operation log row with the caller-supplied trace id;
- user create → 12-char temporary password, temporary login → `40302`;
- refresh rotation, replay rejection and logout revocation.

Reproduce it against a scratch database:

```bash
DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=orange DB_USER=postgres \
  DB_PASSWORD=postgres python scripts/smoke_pg.py
```

The script mutates the target database (it creates and deletes an organisation
and creates a user), so do not point it at shared data.

## Endpoint coverage

All **34** canonical endpoints from `docs/API.md` are implemented:

| Area | Count | Paths |
| --- | --- | --- |
| Auth | 6 | `POST /auth/login`, `/refresh`, `/logout`, `/change-password`; `GET /auth/user-info`, `/auth/menus` |
| Groups | 7 | `GET /system/groups`, `GET /{id}`, `PATCH /{id}`, `PATCH /{id}/status`, `POST /children`, `DELETE /{id}`, `DELETE ?ids=` |
| Permissions | 6 | `GET /system/permissions`, `GET /{id}`, `PATCH /{id}`, `POST /children`, `DELETE /{id}`, `DELETE ?ids=` |
| Roles | 6 | `GET /system/roles`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}`, `DELETE ?ids=` |
| Users | 8 | `GET /system/users`, `GET /{id}`, `POST /`, `PATCH /{id}`, `PATCH /{id}/status`, `POST /{id}/reset-password`, `DELETE /{id}`, `DELETE ?ids=` |
| Operation logs | 1 | `GET /system/operation-logs` |

The deprecated legacy routes (`/add`, `/edit`, `/addChild`, `/detail/{id}`,
`/reset/{id}`) are intentionally **not** implemented; `docs/API.md` §7 says new
implementations should not expose them.

## Behaviour notes

- **Sessions** — access JWT (HS256) carries `sub`, `username`, `typ`, `ver`
  (`token_version`) and `jti`. The refresh token is an HttpOnly cookie, rotated
  on every refresh; the previous `jti` is written to `sys_revoked_token`, so
  replaying it returns 401. Logout revokes the access `jti`, the refresh `jti`
  and increments `token_version` (matching the Java reference, which logs the
  user out everywhere).
- **Forced password change** — while `must_change_password` is true only
  `user-info`, `menus`, `change-password` and `logout` are reachable; everything
  else returns `40302`.
- **Lockout** — 5 failures per username and 20 per IP in a 15-minute window,
  persisted in `sys_login_attempt`; both lock for 15 minutes. The username is
  normalised to lower case, and a successful login clears only the account
  counter (not the IP counter).
- **RBAC** — an authority is `type#path` or `type#path:action`; permission IDs
  are accepted as authorities too, like the reference. Effective permissions are
  enabled roles ∪ direct grants, minus disabled permissions. Menu/directory
  permissions never grant API access.
- **Menus** — only enabled `menu`/`directory` nodes, ordered by code; a branch
  under a disabled/missing parent is dropped rather than promoted to the root.
- **Uniqueness** — `(type, path, action)` with `action IS NULL` as one value is
  checked in the service and backed by the two partial unique indexes in the
  DDL.
- **Deletes** — group/permission deletes require every requested id to exist and
  run deepest-first; role/user deletes ignore missing ids unless none exist.
- **Operation log** — non-GET/OPTIONS writes to `/api/v1/system/*` and
  `/api/v1/auth/change-password` are recorded asynchronously after the response.
  Login/refresh/change-password/reset-password bodies are never stored; JSON
  fields matching `password`/`token`/`secret` are replaced with `***`; bodies are
  truncated to 4000 chars, query strings to 500.

## Known gaps

Honest list of what is **not** delivered or not verified here:

1. **Legacy routes are omitted by design** (see above), so a client still
   calling `/add`, `/edit`, `/addChild`, `/detail/{id}` or `/reset/{id}` will get
   404.
2. **Optimistic locking is informational.** The `version` column is incremented
   on every application update, but SQLAlchemy does not issue
   `WHERE version = ?`, so simultaneous edits are last-write-wins (the Java
   reference uses JPA `@Version` and maps a conflict to 409).
3. **Validation failures return `40002`** (as documented in `docs/API.md`)
   instead of the Java backend's `40001` for bean-validation failures. Malformed
   JSON returns `40001`. Field errors are `40002` with a `{field: message}` map.
4. **Operation-log retention runs in-process.** A background task deletes logs
   older than 90 days once per day, starting 60 seconds after boot. It is not a
   distributed cron and does not run during test lifetimes.
5. **Audit writes are best-effort.** If the log insert fails (for example the
   database is down), the request still succeeds and the failure is only logged.
6. **`X-Forwarded-For` is trusted blindly** for the login-lockout IP and the
   audit `ip` column. Deploy behind a proxy that overwrites the header; direct
   clients can spoof it.
7. **`logout` invalidates every session for the user** (it increments
   `token_version`), not only the current access token. This matches the Java
   reference, but is stronger than the wording in `docs/API.md`.
8. **No password complexity rules on the 12-character temporary password**
   beyond the alphabet used (ambiguous characters excluded). Only
   `change-password` enforces 8–64 chars with letters and digits.
9. **One extra documented rule is enforced on permission edit:** changing a
   node's type to `action` while it still has children is rejected
   (`动作权限不能有子节点`). The Java service only enforces this when adding a
   child, so this implementation is slightly stricter.
10. **`Locale` is accepted but ignored.** Messages are Chinese, matching the
    reference; there is no server-side i18n catalogue.
11. **No rate limiting on `/auth/refresh`** beyond refresh-token rotation. Only
    login has lockout.
12. **SQLite is only a test double.** PostgreSQL-specific behaviour (partial
    unique indexes, `ON DELETE RESTRICT`, `timestamptz`) remains authoritative in
    production; the service layer duplicates the important checks.
13. **OpenAPI schemas are thin.** All routes are documented at `/docs`, but
    responses are built through the shared envelope helper and therefore do not
    publish per-endpoint response models in the generated schema.
