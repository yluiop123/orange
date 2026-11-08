English | [简体中文](README.zh-CN.md)

# Orange · Python + FastAPI backend

Implements the shared API contract with Python + FastAPI, following the Spring
Boot reference for behaviour. One process connects to one database selected by
`DB_DRIVER` / `DATABASE_URL`. Shared backend conventions are in
[../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Python | 3.13+ | `pyproject.toml` |
| Web | FastAPI `>=0.115,<1.0`, uvicorn `>=0.32,<1.0` | `requirements.txt` |
| ORM and drivers | SQLAlchemy `>=2.0,<3.0`, `psycopg[binary]`, `PyMySQL` | `requirements.txt` |
| Validation | pydantic `>=2.9,<3.0` | `requirements.txt` |
| Auth | PyJWT, `cryptography`, `bcrypt` | `requirements.txt` |
| Other | `python-dotenv` | `requirements.txt` |
| Tests | pytest, httpx (in `requirements-dev.txt`) | `requirements-dev.txt` |
| API documentation | FastAPI/Pydantic; `/swagger` + `/openapi.json` | `app/main.py` |
| Build | none; interpreted application | `pyproject.toml` |

## Requirements and commands

Create a virtual environment first.

| Purpose | Command |
| --- | --- |
| Install | `pip install -r requirements-dev.txt` |
| Start | `python -m app.main` |
| Start (CLI) | `uvicorn app.main:app --port 8000` |
| Test | `python -m pytest -q` |
| Build | none |
| Smoke | `python scripts/smoke_http.py --base-url http://127.0.0.1:8000` |

With the CLI form, `--port` wins, so `PORT` / `APP_PORT` do not apply.
`pyproject.toml` sets `testpaths=["tests"]`, `pythonpath=["."]` and `addopts="-q"`.

## Directory structure and layering

```text
app/main.py            application factory, CORS, TraceId, audit middleware, routers
app/config.py          Settings: environment variables, driver normalization, URL assembly
app/db.py              SQLAlchemy engine / session
app/envelope.py        response envelope
app/errors.py          error codes and exception handlers
app/middleware.py      audit middleware
app/models/            ORM models for the shared schema
app/policies/          code shape, permission shape, tree index
app/schemas/           request and response models
app/routers/           auth, users, roles, groups, permissions, operation_logs, docs
app/security/          JWT, refresh cookie, lockout, password, authorization
app/services/          business logic, menu tree, query utilities
tests/                 pytest cases and conftest
scripts/               smoke_http.py, smoke_pg.py
```

## API, auth and database access

- Routers declare the Authority as a dependency, bind Pydantic schemas and call
  services. Exception handlers in `app/errors.py` produce the shared envelope.
- JWT uses PyJWT: RS256 when both RSA keys are set, otherwise HS256 with
  `JWT_SECRET`. Refresh tokens rotate in an HttpOnly cookie.
- SQLAlchemy maps the shared schema; the application never creates tables.
  `DATABASE_URL` accepts the short schemes and fills in the SQLAlchemy dialect.
- Audit-retention cleanup is an in-process asyncio task: it first runs 60 seconds
  after startup and then once per day.
- Tests run on in-memory SQLite (`sqlite+pysqlite:///:memory:`) and need no
  database server.

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `8000` | `app/config.py`: `APP_PORT` → `PORT` → 8000 | Set `APP_PORT` in `.env`, or pass `--port` to uvicorn |
| API prefix | `/api/v1` | `app/main.py` / routers | — |
| Swagger | `/swagger`, `/openapi.json` | `app/main.py` | — |
| CORS | React/Vue/Angular dev origins | `CORS_ORIGINS` | Edit `.env` |
| Local config | `.env` | this stack's root | Copy `.env.example` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DATABASE_URL` → `DB_DRIVER` + `DB_*` → default |
| Connection URL | `DATABASE_URL` accepts `postgresql+psycopg://...` and short schemes | `app/config.py` |
| Discrete values | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `app/config.py` |
| SQLite file | `DB_NAME` or the URL path | `app/config.py` |
| Schema | SQLAlchemy models; no create/migrate | `app/models/` |

## Switching database

| Target | Dependency / driver | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `psycopg[binary]` (already installed) | `DATABASE_URL=postgresql+psycopg://...` or `DB_DRIVER=postgres` | `database/postgres/ddl.sql` then `dml.sql` | Reference |
| MySQL | `PyMySQL` | `DATABASE_URL=mysql+pymysql://...` or `DB_DRIVER=mysql` | `database/mysql/ddl.sql` then `dml.sql` | SQLAlchemy dialect is filled in |
| MariaDB | `PyMySQL` | `DB_DRIVER=mariadb`, MariaDB URL/port | `database/mariadb/ddl.sql` then `dml.sql` | MySQL protocol |
| SQLite | Python `sqlite3` | `DB_DRIVER=sqlite`, `DATABASE_URL=sqlite:///./orange.db` or `DB_NAME` | `database/sqlite/ddl.sql` then `dml.sql` | In-memory SQLite is used by tests |

Steps: create the database if needed, load `ddl.sql` then `dml.sql`, set the
driver and URL or `DB_*`, restart, then verify with the seed accounts.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `.env` (gitignored), loaded by `load_dotenv(".env")`; process environment wins |
| Test | `python -m pytest -q`; in-memory SQLite |
| Production | process environment; use the RSA pair or a strong `JWT_SECRET` |

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
