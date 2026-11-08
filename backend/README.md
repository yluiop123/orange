English | [简体中文](README.zh-CN.md)

# Backend

Six API implementations serve one behaviour contract and one database schema.
Spring Boot is the behavioural reference; the other five follow it. They share no
runtime library and never call each other. Each backend generates its own
OpenAPI document from its own annotations; the frontend owns a separate frozen
snapshot for its types and Swagger page.

| Stack | Directory | Default port | Documentation |
| --- | --- | --- | --- |
| Java 25 + Spring Boot 4 | `backend/springboot` | 8080 | [springboot/README.md](springboot/README.md) |
| Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | [go-gin-gorm/README.md](go-gin-gorm/README.md) |
| NestJS 11 | `backend/node-nestjs` | 3000 | [node-nestjs/README.md](node-nestjs/README.md) |
| ASP.NET Core / .NET 10 | `backend/csharp` | 8082 | [csharp/README.md](csharp/README.md) |
| Rust + Axum | `backend/rust-axum` | 8083 | [rust-axum/README.md](rust-axum/README.md) |
| Python + FastAPI | `backend/python-fastapi` | 8000 | [python-fastapi/README.md](python-fastapi/README.md) |

## Request pipeline

Every request takes the same path, and the order is part of the contract:

```text
request
  → trace id (accept or generate; echoed as X-Trace-Id)
  → CORS allowlist
  → authentication (JWT signature, jti revocation, token_version)
  → forced password-change gate (must_change_password)
  → authorization (Authority = type#path[:action])
  → controller or handler with DTO validation
  → service (business rules, transaction boundary)
  → data access (dialect branches live here)
  → envelope { code, message, data, timestamp, traceId }
  ↘ any exception → one centralized mapping → the same envelope
  ↘ after the response → operation log (a log failure never fails the request)
```

Authorization precedes DTO validation so an unauthorized caller cannot probe
parameter rules. Error mapping sits outside controllers, so no handler writes its
own error body. The operation log is written after the response.

| Layer | Responsibility |
| --- | --- |
| Controller / router | binds parameters, declares the Authority, calls the service, wraps the envelope |
| DTO | field shape and format constraints |
| Authentication / authorization | JWT checks, `token_version`, `must_change_password`, Authority checks |
| Service | existence, uniqueness, tree rules, authorization boundaries, transactions |
| Repository | queries, writes, dialect branches |
| Error mapping | business message or exception to business code plus HTTP status |
| Operation log | records non-GET writes |

Go, ASP.NET Core and FastAPI wrap the whole request, so rejected requests are
logged too; Spring, NestJS and Rust install the recorder after authentication, so
only requests that reach the handler are logged. "Repository" is a logical layer,
not a required directory.

## Response envelope and error codes

Every `/api/v1` response, including errors and unknown routes, has the same
shape:

```json
{ "code": 200, "message": "success", "data": null, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

`code` is the business code, `timestamp` is server time in milliseconds,
`traceId` matches the `X-Trace-Id` response header, and `data` is the payload or a
`{field: message}` map for validation failures.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `40001` | 400 | bad request: malformed JSON, missing parameter, unconvertible type |
| `40002` | 400 | validation failed |
| `40101` | 401 | not signed in: missing/invalid token, revoked `jti`, `token_version` mismatch, disabled account, wrong password |
| `40301` | 403 | signed in but missing the required Authority |
| `40302` | 403 | initial password change required |
| `40401` | 404 | resource or route not found |
| `40501` | 405 | method not allowed |
| `40901` | 409 | conflict: unique/foreign-key violation, optimistic-lock failure, protected delete |
| `429` | 429 | login lockout threshold reached |
| `50000` | 500 | uncaught exception |

Pagination is always `{ total, list, page, size, totalPages }`. `page` defaults to
1 and `size` to 10; a page past the end returns an empty list. Sorting accepts a
whitelist and silently falls back to the default field outside it.

## Authentication and permissions

- Passwords use bcrypt with cost 10; every stack accepts `{bcrypt}$2a$...`,
  `{bcrypt}$2b$...` and a bare bcrypt row, so a password changed by one stack
  verifies in another.
- Access tokens are short-lived. Refresh tokens are rotated and stored in an
  HttpOnly cookie. Revoked `jti` values and `token_version` are checked on every
  request.
- A permission is `type + path + action`. Effective permissions are the union of
  enabled roles plus direct grants minus disabled permissions. Role switching is
  UI-only and never reduces backend Authority.
- Menus are database rows: `sys_permission.name` is the default name and
  `sys_permission_i18n` stores one row per locale. `/auth/menus` resolves the
  `Locale` header through exact locale, language and default-name fallbacks.

## Configuration

Configuration comes from the process environment, optionally seeded from a local
file at startup. Only the precedence rules are shared; each stack's README and
`.env.example` / YAML file list the exact variables.

- **Database URL**: a complete URL overrides every discrete value. Five stacks
  read `DATABASE_URL`; Spring Boot orders
  `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url` and builds a JDBC URL
  from `DB_HOST` / `DB_PORT` / `DB_NAME` only when no URL is set.
- **Engine**: `DB_DRIVER` wins, otherwise the URL scheme, otherwise PostgreSQL.
  MariaDB speaks the MySQL protocol, so `mariadb://` and `mysql://` both connect;
  Spring rewrites `jdbc:mariadb:` to `jdbc:mysql:`.
- **Port**: every stack reads `APP_PORT`. Spring Boot reads only `APP_PORT`; the
  other five fall back to `PORT` and then their own default.
- **JWT**: when `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are both set, the stacks
  sign and verify with RS256; each value may be an inline PEM or a file path.
  Otherwise they use HS256 with `JWT_SECRET`. Setting only one key is a startup
  error. In production use the RSA pair (recommended) or a non-default secret of
  at least 32 bytes.
- **Local overrides** are never committed: `application-local.yaml` with
  `SPRING_PROFILES_ACTIVE=local` for Spring Boot, `.env.local` for Go, NestJS and
  ASP.NET Core, `.env` for Rust and FastAPI.

### JWT keys

Generate a development RSA pair with OpenSSL from the repository root into
`backend/keys/`:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out backend/keys/jwt-private.pem
openssl rsa -pubout -in backend/keys/jwt-private.pem -out backend/keys/jwt-public.pem
```

Point a backend at it with `JWT_PRIVATE_KEY=../keys/jwt-private.pem` and
`JWT_PUBLIC_KEY=../keys/jwt-public.pem` (paths are relative to each
`backend/<stack>` directory).

| Stack | Committed configuration | Local file |
| --- | --- | --- |
| Spring Boot | `src/main/resources/application.yaml`, `application-prod.yaml` | `application-local.yaml` |
| Go, NestJS, ASP.NET Core | `.env.example` | `.env.local` |
| Rust, FastAPI | `.env.example` | `.env` |

Applications never create tables: Spring sets `ddl-auto: none`, NestJS sets
`synchronize: false`, and the other four only read the existing schema. Schema
ownership belongs to [../database/](../database/).

## Switching database

PostgreSQL is the reference; MySQL, MariaDB and SQLite are supported. Before
switching, create the database if the engine needs one, then load `ddl.sql`
followed by `dml.sql` from the matching [../database/](../database/) engine
directory. An empty SQLite file connects, but every query fails until the schema
is loaded.

| Engine | `DB_DRIVER` | `DATABASE_URL` (five stacks) | Spring JDBC URL |
| --- | --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@127.0.0.1:5432/orange` | `jdbc:postgresql://127.0.0.1:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@127.0.0.1:3306/orange` | `jdbc:mysql://127.0.0.1:3306/orange` |
| MariaDB | `mariadb` | `mariadb://root:root@127.0.0.1:3307/orange` | `jdbc:mysql://127.0.0.1:3307/orange` |
| SQLite | `sqlite` | `./orange.db` | `jdbc:sqlite:./orange.db` |

SQLite paths are per stack: Go `DB_PATH` (alias `SQLITE_PATH`), Rust `DB_FILE`,
ASP.NET Core `SQLITE_PATH`, NestJS and FastAPI `DB_NAME` or the URL path. Spring
Boot enables foreign keys and `date_class=text` itself; hand-written JDBC URLs
must keep those parameters. MariaDB commonly listens on 3307 in the sample URL,
so change `DB_DRIVER` and the port together.

Each stack's README has the exact driver, ORM and file locations. Verify a switch
by starting the server and exercising it with the seed credentials; a stale
`DATABASE_URL` is the usual reason a new `DB_HOST` appears to be ignored.

## Adding an endpoint

1. Define the behaviour in the reference implementation first: method, path,
   Authority, request/response schemas and every error the endpoint can return.
   Annotate the Spring controller and DTOs so springdoc includes it, then mirror
   the annotations in the other five stacks. Update
   [../frontend/openapi.json](../frontend/openapi.json) when the consumer-facing
   shape changes.
2. Add the DTO and its constraints. Validation failures return `40002` with
   `{field: message}` in `data`; malformed JSON is `40001`.
3. Implement the rule in the service layer: existence, uniqueness, tree and
   authorization boundaries, transaction.
4. Wire the controller or handler: declare the Authority
   (`action#/system/role:edit` style), call the service, return the envelope. A
   Spring `@PreAuthorize` string must exist in `database/permissions.json`.
5. Write no logging code. Non-GET requests under `/api/v1/system/` and
   `/api/v1/auth/change-password` are recorded automatically; secrets are masked
   and query/body are truncated.
6. Repeat the change in all six stacks. Run service unit tests, then start the
   server and verify the new endpoint manually: the write returns `200`, then a
   read shows the new state.

## Swagger

Documentation endpoints sit outside `/api/v1`, do not use the business envelope,
and are generated by each framework:

| Stack | Generator | Endpoints |
| --- | --- | --- |
| Spring Boot | springdoc-openapi annotations | `/openapi.json`, `/swagger` |
| FastAPI | FastAPI/Pydantic route metadata | `/openapi.json`, `/swagger` |
| NestJS | `@nestjs/swagger` + CLI plugin | `/openapi.json`, `/swagger` |
| ASP.NET Core | Swashbuckle controller metadata | `/openapi.json`, `/swagger` |
| Go | swaggo handler annotations | `/openapi.json`, `/swagger` |
| Rust | utoipa derives and path annotations | `/openapi.json`, `/swagger` |

There is no shared runtime document. A path that is not annotated does not
appear, so update the annotation in each stack when the endpoint changes.

## Documentation

- [Frontend overview](../frontend/README.md)
- [Database](../database/README.md)
- [Repository README](../README.md)
