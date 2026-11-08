English | [简体中文](README.zh-CN.md)

# Orange · Go + Gin + GORM backend

Implements the shared API contract in Go, following the Spring Boot reference for
behaviour. One process connects to one database selected by `DB_DRIVER`. Shared
backend conventions are in [../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Go | 1.23.0 | `go.mod` |
| HTTP | Gin 1.10.1 | `go.mod` |
| ORM | GORM 1.30.1 + PostgreSQL/MySQL drivers | `go.mod` |
| SQLite | `github.com/glebarez/sqlite` 1.11.0 (pure Go, no cgo) | `go.mod` |
| JWT | `github.com/golang-jwt/jwt/v5` 5.2.2 | `go.mod` |
| Validation | `go-playground/validator/v10` 10.20.0 | `go.mod` |
| Other | `golang.org/x/crypto` (bcrypt), `google/uuid`, `joho/godotenv` | `go.mod` |
| API documentation | swaggo annotations + gin-swagger | `internal/http/swagger.go`, `docs/` |

## Requirements and commands

| Purpose | Command |
| --- | --- |
| Install | `go mod download` |
| Start | `go run ./cmd/server` |
| Test | `go test ./...` |
| Format check | `gofmt -l .` (must be empty) |
| Static check | `go vet ./...` |
| Build | `go build -o bin/server ./cmd/server` |
| Optional database smoke | `ORANGE_SMOKE=1 go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v` |

`.env.local` is loaded by godotenv at startup and is gitignored.

## Directory structure and layering

```text
cmd/server/            process entry point, graceful shutdown, log retention
internal/config/       environment variables and connection strings
internal/auth/         JWT, bcrypt, refresh cookie
internal/domain/       pure policy: code shape, permission shape, tree, lockout, audit
internal/store/        GORM models and queries, timestamp serialization
internal/service/      business rules: RBAC, tree guards, pagination
internal/http/         Gin routes, middleware, handlers, response envelopes
```

Policy and business logic stay out of the Gin layer; unit tests exercise these
packages directly. Responses use the shared envelope and error codes.

## API, auth and database access

- Gin handlers bind parameters, declare the Authority and call services. The
  central response helper writes the envelope; error codes are in
  `internal/domain/errors.go`.
- JWT uses `golang-jwt/jwt/v5`: RS256 when both RSA keys are set, otherwise
  HS256 with `JWT_SECRET`. Refresh tokens rotate in an HttpOnly cookie.
- GORM maps the shared schema; the application does not migrate. SQLite uses a
  pure-Go driver and a single connection to avoid `SQLITE_BUSY`; other engines use
  a pool of 10.
- The `version` column is written but not compared, so concurrent edits are
  last-write-wins (same as the Rust and Python ports).

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `8081` | `internal/config/config.go`: `APP_PORT` → `PORT` → 8081 | Set `APP_PORT` or `PORT` in `.env.local` |
| API prefix | `/api/v1` | Gin route group | — |
| Swagger | `/swagger`, `/openapi.json` | `internal/http/swagger.go` | — |
| CORS | React/Vue/Angular dev origins | `CORS_ORIGINS` | Edit `.env.local` |
| Local config | `.env.local` | repository root of this stack | Copy `.env.example` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DB_DRIVER` or URL scheme |
| Connection URL | `DATABASE_URL` overrides discrete values | `.env.example`, `internal/config/` |
| Discrete values | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE`, `DB_TIMEZONE` | `internal/config/` |
| SQLite file | `DB_PATH` (alias `SQLITE_PATH`) | `internal/config/` |
| Pool | SQLite 1 connection; others 10 | `internal/store/store.go` |

## Switching database

| Target | Dependency / driver | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `gorm.io/driver/postgres` (already in `go.mod`) | `DB_DRIVER=postgres`, `DATABASE_URL=postgres://...` | `database/postgres/ddl.sql` then `dml.sql` | Reference |
| MySQL | `gorm.io/driver/mysql` + `go-sql-driver/mysql` | `DB_DRIVER=mysql`, `DATABASE_URL=mysql://...` | `database/mysql/ddl.sql` then `dml.sql` | — |
| MariaDB | MySQL driver (no MariaDB package) | `DB_DRIVER=mariadb`, MariaDB URL/port | `database/mariadb/ddl.sql` then `dml.sql` | MariaDB speaks the MySQL protocol |
| SQLite | `github.com/glebarez/sqlite` | `DB_DRIVER=sqlite`, `DB_PATH=./orange.db` | `database/sqlite/ddl.sql` then `dml.sql` | Pure Go; pool capped at 1 |

Steps: create the database if needed, load `ddl.sql` then `dml.sql`, set
`DB_DRIVER` and the URL or `DB_*` values, restart, then verify with the seed
accounts. `DATABASE_URL` wins over the discrete values.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `.env.local` (gitignored) + process environment; process wins |
| Test | `go test ./...`; the optional smoke test runs only when `ORANGE_SMOKE=1` and the database is reachable |
| Production | process environment only; set the RSA pair or a strong `JWT_SECRET` |

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
