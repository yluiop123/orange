> English | [简体中文](./README.zh-CN.md)

# Backend Documentation

Design and operations documentation for the six backend implementations. The API
contract, database design and stack matrix are technology-agnostic and live in
[`../../docs/`](../../docs/README.md); this directory covers the code under
`backend/`.

## Documents

| Document | Content |
| --- | --- |
| [GETTING-STARTED.md](./GETTING-STARTED.md) | Ports, prerequisites, database setup, run and test |
| [CONFIGURATION.md](./CONFIGURATION.md) | Shared config, generated local files, JWT and cookies |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer model, response envelope, auth, RBAC, database portability |

## The six stacks

| Stack | Directory | Default port | Status |
| --- | --- | --- | --- |
| Java 25 + Spring Boot | [`../springboot`](../springboot/README.md) | 8080 | reference implementation |
| Go + Gin + GORM | [`../go-gin-gorm`](../go-gin-gorm/README.md) | 8081 | implemented |
| C# + ASP.NET Core | [`../csharp`](../csharp/README.md) | 8082 | implemented |
| Rust + Axum | [`../rust-axum`](../rust-axum/README.md) | 8083 | implemented |
| Node.js + NestJS | [`../node-nestjs`](../node-nestjs/README.md) | 3000 | implemented |
| Python + FastAPI | [`../python-fastapi`](../python-fastapi/README.md) | 8000 | implemented |

All six implement the same `/api/v1` contract. Spring Boot is the behaviour
reference when two implementations disagree.

## Contract and data

| Source | Purpose |
| --- | --- |
| [`../../docs/API.md`](../../docs/API.md) | Human-readable contract |
| [`../../contracts/openapi.json`](../../contracts/openapi.json) | Machine-readable contract |
| [`../../database/<engine>/ddl.sql`](../../database) | Canonical schema |
| [`../../database/<engine>/dml.sql`](../../database) | Canonical seed data |
| [`../../docs/validation-rules.md`](../../docs/validation-rules.md) | Validation layering |

No backend owns migrations or engine-specific schema copies. A schema change is
made once in `database/<engine>` and every stack must keep working against it.

## Test matrix

- Unit tests per stack (see each README).
- `scripts/test-databases.ps1` runs the live matrix against PostgreSQL, MySQL,
  MariaDB and SQLite.
- `scripts/sync-permission-seed.mjs` keeps the seed and the React permission
  constants in sync.
- Every stack is expected to pass the 327-endpoint contract check recorded in
  [VERIFICATION.md](../../docs/VERIFICATION.md).

openGauss, OceanBase and GoldenDB remain `static`: their SQL is maintained, but
no local instance is available to run the matrix.
