# Backend

Six API implementations serve one HTTP contract and one database schema. Spring
Boot is the behavioural reference; the contract and the contract tests are the
final authority. The six share no runtime library and never call each other.

Repository layout and quick start: [../README.md](../README.md). The contract is
[../contracts/openapi.json](../contracts/openapi.json), schema and seed data live
in [../database/](../database/), cross-stack checks in [../scripts/](../scripts/),
and the UI conventions in [../frontend/README.md](../frontend/README.md).

| Stack | Directory | Role |
| --- | --- | --- |
| Java 25 + Spring Boot | [springboot/README.md](springboot/README.md) | behaviour reference |
| Go + Gin + GORM | [go-gin-gorm/README.md](go-gin-gorm/README.md) | second implementation |
| NestJS | [node-nestjs/README.md](node-nestjs/README.md) | third implementation |
| ASP.NET Core (.NET 10) | [csharp/README.md](csharp/README.md) | fourth implementation |
| Rust + Axum | [rust-axum/README.md](rust-axum/README.md) | fifth implementation |
| Python + FastAPI | [python-fastapi/README.md](python-fastapi/README.md) | sixth implementation |

## 1. Shared layering and responsibilities

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
own error body. The operation log is written after the response, so a logging
failure cannot turn a successful request into a failure.

| Layer | Only does | Where it lives |
| --- | --- | --- |
| Controller / router | binds path and query parameters, declares the Authority, calls the service, wraps the envelope | Spring `controller/`; Go `internal/http/*_handler.go`; NestJS `src/<domain>/*.controller.ts`; ASP.NET Core `Controllers/`; Rust `src/routes/`; FastAPI `app/routers/` |
| DTO | field shape and format constraints | Spring `domain/<domain>/req/`; Go `*Request` structs and `internal/http/bind.go`; NestJS `*.dto.ts`; ASP.NET Core `Contracts/Requests.cs`; Rust `src/domain/dto.rs`; FastAPI `app/schemas/` |
| Authentication and authorization | JWT checks, `token_version`, `must_change_password`, Authority checks | Spring `security/`; Go `internal/http/middleware_auth.go`; NestJS `src/auth/*.guard.ts`; ASP.NET Core `Security/AuthenticationMiddleware.cs`; Rust `src/auth/` and `src/middleware.rs`; FastAPI `app/security/dependencies.py` |
| Service | existence, uniqueness, tree rules, authorization boundaries, transactions | Spring `service/system/impl/`; Go `internal/service/`; NestJS `*.service.ts`; ASP.NET Core `Services/`; Rust `src/service/`; FastAPI `app/services/` |
| Repository (data access) | queries, writes, dialect branches | Spring `repository/system/`; Go `internal/store/`; NestJS injected TypeORM `Repository`; ASP.NET Core `Data/OrangeDbContext.cs`; Rust `src/repository/`; FastAPI SQLAlchemy `Session` with models in `app/models/` |
| Error mapping | exception or business message to business code plus HTTP status | Spring `controller/GlobalExceptionHandler.java`; Go `internal/http/response.go` and `internal/domain/errors.go`; NestJS `src/common/all-exceptions.filter.ts`; ASP.NET Core `Middleware/ExceptionHandlingMiddleware.cs`; Rust `src/error.rs`; FastAPI `app/errors.py` |
| Operation log | records non-GET writes | Spring `config/OperationLogInterceptor.java`; Go `internal/http/middleware.go`; NestJS `src/operation-log/operation-log.interceptor.ts`; ASP.NET Core `Middleware/OperationLogMiddleware.cs`; Rust `src/operation_log.rs`; FastAPI `app/middleware.py` |

"Repository" is a logical layer, not a required directory: NestJS injects a
TypeORM `Repository`, ASP.NET Core and FastAPI use `DbContext` and `Session`
inside the service. A layer may collapse; its responsibility may not. Format
validation never enters the service, and business rules never enter a controller.

## 2. Response envelope and error codes

Every `/api/v1` response, including errors and unknown routes, has the same shape:

```json
{ "code": 200, "message": "success", "data": null, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

`code` is the business code (`200` on success), `timestamp` is server time in
milliseconds, `traceId` matches the `X-Trace-Id` response header, and `data` is
the payload or a `{field: message}` map for validation failures. On success, five
stacks copy a string payload into both `message` and `data`; FastAPI sets only
`data`, so pass `message=` explicitly when parity matters.

| code | HTTP | Meaning | Typical trigger |
| --- | --- | --- | --- |
| `40001` | 400 | bad request | malformed JSON, missing required query parameter, unconvertible type |
| `40002` | 400 | validation failed | DTO format violation, or a business message with no mapping keyword |
| `40101` | 401 | not signed in | missing, invalid or expired token, revoked `jti`, `token_version` mismatch, disabled account, wrong password |
| `40301` | 403 | forbidden | signed in but missing the Authority the endpoint requires |
| `40302` | 403 | change the initial password first | `must_change_password=true` and the path is not on the allowlist |
| `40401` | 404 | not found | lookup by id returns nothing, or the route does not exist |
| `40501` | 405 | method not allowed | the path exists, but not for this method |
| `40901` | 409 | conflict | unique or foreign-key violation, optimistic-lock failure, protected delete |
| `429` | 429 | too many login attempts | the account or IP lockout threshold is reached |
| `50000` | 500 | internal error | uncaught exception |

The mapping tables are `domain/common/ErrorCode.java` in Spring,
`internal/domain/errors.go` in Go, `src/common/error-code.ts` in NestJS,
`Domain/ErrorCodes.cs` in ASP.NET Core, `src/error.rs` in Rust and `app/errors.py`
in FastAPI. New endpoints reuse these codes and never invent numbers.

Spring, Rust and ASP.NET Core choose `40401` or `40901` from keywords in the
business message: `不存在` maps to `40401`; `已存在`, `已被`, `不能删除` and
`请先禁用子组织` map to `40901`; anything else falls back to `40002`. Editing a
message can therefore change the HTTP status, so search for those keywords first.

`429` is the only code outside the Spring `ErrorCode` enum: `LoginController`
writes the literal, while NestJS, Go, ASP.NET Core and Rust define a constant and
FastAPI returns it from the auth router for the same lockout rule.

Pagination is always `{ total, list, page, size, totalPages }`. `page` defaults to
1 and `size` to 10; `totalPages` rounds up; a page past the end returns an empty
list rather than an error. Sorting accepts a whitelist and silently falls back to
the default field outside it.

## 3. Configuration

Configuration comes from the process environment, optionally seeded from a local
file at startup. Only the precedence rules are shared. The full variable tables
live in each stack's `.env.example` or YAML file and in its README, not here.

- Database URL: a complete URL overrides every discrete value. Five stacks read
  `DATABASE_URL`; Spring Boot orders
  `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url` and builds a JDBC URL
  from `DB_HOST`/`DB_PORT`/`DB_NAME` only when no URL is set. Its credentials are
  `SPRING_DATASOURCE_USERNAME/PASSWORD > DB_USER/DB_PASSWORD`.
  Once a URL is set, changing only `DB_PASSWORD` has no effect.
- Engine: `DB_DRIVER` wins, otherwise the URL scheme decides, otherwise
  PostgreSQL. MariaDB speaks the MySQL protocol, so `mariadb://` and `mysql://`
  both connect; Spring also rewrites `jdbc:mariadb:` to `jdbc:mysql:`.
- Port: every stack reads `APP_PORT`. Spring Boot reads only `APP_PORT`; the other
  five fall back to `PORT` and then to their own default.
- JWT: Spring Boot uses RS256 PEM keys (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`); the
  other five use HS256 `JWT_SECRET`. The shared development default is
  `orange-dev-secret-change-me-in-production`; with `APP_ENV=production|prod`
  those five refuse to start while it is in use.
- Local overrides are never committed: `application-local.yaml` with
  `SPRING_PROFILES_ACTIVE=local` for Spring Boot, `.env.local` for Go, NestJS and
  ASP.NET Core, `.env` for Rust and FastAPI.

| Stack | Committed configuration | Local file |
| --- | --- | --- |
| Spring Boot | `src/main/resources/application.yaml`, `application-prod.yaml` | `application-local.yaml` |
| Go, NestJS, ASP.NET Core | `.env.example` | `.env.local` |
| Rust, FastAPI | `.env.example` | `.env` |

Applications never create tables: Spring sets `ddl-auto: none`, NestJS sets
`synchronize: false`, and the other four only read the existing schema. Schema
ownership belongs to [../database/](../database/).

## 4. Switching database

PostgreSQL is the reference; MySQL, MariaDB and SQLite are supported. Before
switching, create the database if the engine needs one, then load
`ddl.sql` followed by `dml.sql` from the matching [../database/](../database/)
engine directory. An empty SQLite file connects, but every query fails until the
schema is loaded. `prepare-stack-databases.ps1` in [../scripts/](../scripts/)
prepares local databases for several stacks at once.

| Engine | `DB_DRIVER` | `DATABASE_URL` (five stacks) | Spring JDBC URL |
| --- | --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@127.0.0.1:5432/orange` | `jdbc:postgresql://127.0.0.1:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@127.0.0.1:3306/orange` | `jdbc:mysql://127.0.0.1:3306/orange` |
| MariaDB | `mariadb` | `mariadb://root:root@127.0.0.1:3307/orange` | `jdbc:mysql://127.0.0.1:3307/orange` |
| SQLite | `sqlite` | `./orange.db` | `jdbc:sqlite:./orange.db` |

SQLite paths are per stack: Go `DB_PATH` (alias `SQLITE_PATH`), Rust `DB_FILE`,
ASP.NET Core `SQLITE_PATH`, NestJS and FastAPI `DB_NAME` or the URL path. Spring
Boot enables foreign keys and `date_class=text` itself; hand-written JDBC URLs
must keep those parameters. MariaDB uses port 3307 in CI, so change `DB_DRIVER`
and the port together.

Verify a switch by running the server and pointing `http-smoke.mjs` from
[../scripts/](../scripts/) at its base URL, or use the database matrix runner,
which exercises one stack against all four engines. A stale `DATABASE_URL` is the
usual reason a new `DB_HOST` appears to be ignored.

## 5. Adding an endpoint

1. Define the behaviour in [../contracts/openapi.json](../contracts/openapi.json)
   first: method, path, Authority, request and response schemas, and every error
   the endpoint can return. The document is maintained by hand; no generator or
   contract validator runs in the repository.
2. Add the DTO and its format constraints. Validation failures return `40002`
   with `{field: message}` in `data`; a body that is not valid JSON is `40001`.
3. Implement the rule in the service layer: existence, uniqueness, tree and
   authorization boundaries, transaction. Throw a business message only when the
   centralized mapping turns it into the intended code.
4. Wire the controller or handler: declare the Authority
   (`action#/system/role:edit` style), call the service, return the envelope. A
   Spring `@PreAuthorize` string must exist in the permission catalog
   `database/permissions.json`, otherwise the authority-coverage test fails.
5. Write no logging code. A non-GET request under `/api/v1/system/` or
   `/api/v1/auth/change-password` is recorded automatically; login, refresh and
   password paths omit the body, and keys containing `password`, `token` or
   `secret` are masked. Query and body are truncated at 500 and 4000 characters,
   and a failed log write only produces a warning.
6. Repeat the change in all six stacks, using the layer table above. The
   per-stack README lists the exact directories; the Node stack installs and
   tests with `pnpm install` and `pnpm test`.
7. Test before merging: service unit tests, `http-smoke.mjs` against a running
   server, and `contract-test.mjs` against the same base URL. Both scripts live
   in [../scripts/](../scripts/). The contract test covers a fixed behaviour set
   and does not discover new paths, so add explicit assertions for the endpoint:
   the write returns `200`, then a read shows the new state.

## 6. Swagger

Documentation endpoints sit outside `/api/v1` and do not use the business
envelope:

- `GET /swagger` renders Swagger UI 5 from unpkg, with the schema URL pinned to
  `/openapi.json`.
- `GET /openapi.json` returns [../contracts/openapi.json](../contracts/openapi.json)
  as `application/json`. The working directory must stay inside the repository so
  that the file can be found.
- Spring Boot also exposes springdoc's `GET /swagger-ui.html` and `GET /api-docs`;
  both are off by default, turn on with `SPRINGDOC_ENABLED=true`, and stay off in
  production.
- FastAPI redirects `GET /docs` to `/swagger` and disables its framework-generated
  schema, so the shared contract is the only source.

The UI reads the contract; it never defines one. A path that exists only in a
framework annotation is invisible to `/openapi.json`, so change the contract first.

> Last verified: 24826bb · 2026-11-07
