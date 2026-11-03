# ORANGE

<img height="80" src="./readme/images/orange.png">

ORANGE is a full-stack permission-management demo. The repository is a polyglot monorepo: the same product is implemented with several frontend frameworks, backend languages and database engines.

Project URL: https://yluiop123.github.io/orange

English | [简体中文](./README.zh-CN.md)

<img height="500" src="./readme/images/dashboard.png">
<img height="500" src="./readme/images/disaster-command.png">
<img height="500" src="./readme/images/form.png">
<img height="500" src="./readme/images/rechart.png">

## Repository layout

```text
.
├── frontend/                 # UI implementations, one directory per framework
│   ├── react/                # React 19 + Vite + shadcn/ui (deployed to GitHub Pages)
│   ├── angular/              # Angular + Angular Material
│   └── vue/                  # Vue 3 + Vuetify
├── backend/                  # API implementations, one directory per stack
│   ├── springboot/           # Java 25 + Spring Boot
│   ├── go-gin-gorm/          # Go + Gin + GORM
│   ├── node-nestjs/          # Node.js + NestJS
│   ├── csharp/               # C# + ASP.NET Core
│   ├── rust-axum/            # Rust + Axum
│   └── python-fastapi/       # Python + FastAPI
├── database/                 # DDL and seed data, one directory per engine
│   ├── postgres/
│   ├── mysql/
│   ├── mariadb/
│   ├── sqlite/
│   ├── opengauss/
│   ├── oceanbase/
│   └── goldendb/
├── contracts/                # Cross-stack contracts
│   └── openapi.json          # API contract consumed by every frontend/backend
├── docs/                     # Technology-agnostic project documentation
│   ├── FEATURES.md           # Product scope and permission model
│   ├── API.md                # API contract
│   ├── DATABASE.md           # Schema and invariants
│   ├── STACKS.md             # Stack matrix, ports and run commands
│   ├── validation-rules.md   # Validation rules across layers
│   ├── adr/                  # Architecture decisions
│   ├── audit/                # Audits
│   └── security/             # Security notes
├── scripts/                  # Cross-stack scripts (seed sync, JWT keys)
└── .github/workflows/        # CI: backend tests + React-only Pages deploy
```

Rules for the layout:

- Anything tied to a technology stack lives under `frontend/<stack>` or `backend/<stack>`.
- `docs/`, `contracts/`, `database/` and the root READMEs are technology-agnostic.
- `database/<engine>` contains only DDL and seed data. Runtime connection settings belong to each backend.
- Only `frontend/react` is deployed to GitHub Pages. Angular and Vue are built and tested locally, but are not part of the Pages workflow.

## Stack matrix

| Layer | Stack | Directory | Status |
| --- | --- | --- | --- |
| Frontend | React 19 + Vite + shadcn/ui | `frontend/react` | Implemented, deployed |
| Frontend | Angular + Angular Material | `frontend/angular` | Implemented, 19 tests pass |
| Frontend | Vue 3 + Vuetify | `frontend/vue` | Implemented, 20 tests pass |
| Backend | Java 25 + Spring Boot | `backend/springboot` | Implemented with PostgreSQL |
| Backend | Go + Gin + GORM | `backend/go-gin-gorm` | Implemented |
| Backend | Node.js + NestJS | `backend/node-nestjs` | Implemented |
| Backend | C# + ASP.NET Core | `backend/csharp` | Implemented |
| Backend | Rust + Axum | `backend/rust-axum` | Implemented, 40 tests pass |
| Backend | Python + FastAPI | `backend/python-fastapi` | Implemented |
| Database | PostgreSQL | `database/postgres` | Implemented |
| Database | MySQL / MariaDB | `database/mysql`, `database/mariadb` | Implemented |
| Database | SQLite | `database/sqlite` | Implemented |
| Database | openGauss / OceanBase / GoldenDB | `database/opengauss`, `database/oceanbase`, `database/goldendb` | Dialect scripts |

## Documentation

| Document | Content |
| --- | --- |
| [docs/FEATURES.md](./docs/FEATURES.md) | Product scope, roles, page inventory |
| [docs/API.md](./docs/API.md) | Endpoints, auth, errors, pagination |
| [docs/DATABASE.md](./docs/DATABASE.md) | ER model, invariants, dialect matrix |
| [docs/STACKS.md](./docs/STACKS.md) | Which stack runs on which port, how to start |
| [docs/VERIFICATION.md](./docs/VERIFICATION.md) | What was built, tested and left unverified |
| [contracts/openapi.json](./contracts/openapi.json) | Machine-readable API contract |
| [PROJECT_ISSUES.md](./PROJECT_ISSUES.md) | Decisions, accepted trade-offs, verification log |
| [CONTEXT.md](./CONTEXT.md) | Domain vocabulary |

## Quick start (React + Spring Boot + PostgreSQL)

```bash
# database
psql -U postgres -f database/postgres/ddl.sql
psql -U postgres -f database/postgres/dml.sql

# backend
cd backend/springboot
mvn spring-boot:run

# frontend
cd frontend/react
pnpm install
pnpm dev
```

See [docs/STACKS.md](./docs/STACKS.md) for the other stacks.

## 🧾 License

This project is [MIT licensed](./LICENSE).
