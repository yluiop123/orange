# Orange · Go + Gin + GORM backend

This stack implements the same API contract in Go, following the Spring Boot reference for behaviour; one process connects to one database via `DB_DRIVER`.

## Tech stack and versions

| Item | Version / notes | Source |
| --- | --- | --- |
| Go | 1.23.0 (CI uses `1.23.x`) | `go.mod`, `main.yml` |
| HTTP | Gin 1.10.1 | `go.mod` |
| ORM | GORM 1.30.1 + `gorm.io/driver/postgres` 1.6.0, `gorm.io/driver/mysql` 1.6.0 | `go.mod` |
| SQLite | `github.com/glebarez/sqlite` 1.11.0 (pure Go, no cgo) | `go.mod` |
| JWT | `github.com/golang-jwt/jwt/v5` 5.2.2 | `go.mod` |
| Validation | `go-playground/validator/v10` 10.20.0 | `go.mod` |
| Other | `golang.org/x/crypto` (bcrypt), `google/uuid`, `joho/godotenv` | `go.mod` |
| API documentation | unified `/swagger` + `/openapi.json` (no extra dependency) | `internal/http/swagger.go` |
| Build | `go` toolchain only, no Makefile | directory contents |

## Commands

| Purpose | Command | Source / notes |
| --- | --- | --- |
| Install | `go mod download` | `go.sum` is committed; CI resolves dependencies directly with `go build ./...` |
| Start | `go run ./cmd/server` | `cmd/server/main.go`; `.env.local` is loaded by godotenv |
| Test | `go test ./...` | `main.yml` (backend job, go) |
| Format and static checks | `gofmt -l .` must be empty, plus `go vet ./...` | same job in `main.yml` |
| Build | `go build -o bin/server ./cmd/server` | `main.yml`; `go build ./...` is also used |
| Optional smoke | `ORANGE_SMOKE=1 go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v` | `internal/http/smoke_test.go:25`; skipped when the database is unreachable |

Port source variable: `env("APP_PORT", env("PORT", "8081"))` (`internal/config/config.go:211`), default 8081; `.env.example` only sets `PORT=8081`.

## Directory structure and layering

```text
cmd/server/            process entry point, graceful shutdown, log retention
internal/config/       environment variables and connection strings
internal/auth/         JWT, bcrypt, refresh cookie
internal/domain/       pure policy: code shape, permission shape, effective permissions, tree index, login lockout, audit rules
internal/store/        GORM models and queries, timestamp serialization
internal/service/      business rules: RBAC, tree and reference guards, pagination
internal/http/         Gin routes, middleware, handlers, response envelopes
```

Policy and business logic do not live in the Gin layer; unit tests exercise these packages directly. Endpoints and the database matrix are not maintained on this page; see the [HTTP contract](../../contracts/openapi.json) and [database dialects](../../database/).

## Configuration entry point

Copy `.env.example` to `.env.local` (gitignored, read by godotenv at startup); real environment variables take precedence over that file. `DATABASE_URL` overrides the discrete `DB_*` variables, and when `DB_DRIVER` is unset the engine is inferred from the URL scheme. The variable list, precedence and cross-stack comparison are in the [backend configuration conventions](../../backend/README.md).

## Deviations of this stack

1. No third-party OpenAPI package: `/swagger` + `/openapi.json` are hand-wired in `internal/http/swagger.go`; `contracts/openapi.json` remains the only authority for the contract.
2. SQLite uses a pure Go driver and builds with `CGO_ENABLED=0`; to avoid `SQLITE_BUSY` the SQLite pool is capped at 1 (`internal/store/store.go:57`), while other engines get 10 (same file, line 60).
3. JWT supports two algorithms: RS256 when `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` (or inline PEM) is configured, otherwise HS256 (`internal/auth/token.go:68`, `token.go:76`). Spring uses RS256 only, and the other four ports use HS256 only.
4. The `version` optimistic lock is not maintained: the column exists in the models (`internal/store/models.go`), is written as 0 on create, is not incremented on update and is not compared with `WHERE version`, so concurrent edits are last-write-wins. Rust and Python increment it but likewise never compare.
5. Go is the only port of the six whose CI additionally requires `gofmt` and `go vet` to pass.

## Size and tests

| Metric | Value |
| --- | --- |
| Version-controlled files | 57 |
| Go source files | 52 |
| Test files | 11 `_test.go` files (including `internal/http` route tests and the optional database smoke test) |

Counting basis: `git ls-files backend/go-gin-gorm`. Why the stacks differ is covered by the [backend shared conventions and deviations](../../backend/README.md).

> Last verified: 24826bb · 2026-11-07
> Sources: `go.mod`, `go.sum`, `.env.example`, `cmd/server/main.go`, `internal/**`, `.github/workflows/main.yml`
