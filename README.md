# ORANGE

[![CI](https://github.com/yluiop123/orange/actions/workflows/main.yml/badge.svg)](https://github.com/yluiop123/orange/actions/workflows/main.yml)

<img height="80" src="./readme/images/orange.png">

ORANGE is a full-stack permission-management demo. One product is implemented
three times on the frontend (React, Vue, Angular), six times on the backend
(Spring Boot, Go, NestJS, C#, Rust, FastAPI) and against several database
engines. Every stack serves the same API contract and renders the same shell:
login, RBAC menu tree, dashboards, charts, maps, 3D scenes, a component gallery
and system management.

Project URL: https://yluiop123.github.io/orange

English | [简体中文](./README.zh-CN.md)

<img height="500" src="./readme/images/dashboard.png">
<img height="500" src="./readme/images/disaster-command.png">
<img height="500" src="./readme/images/form.png">
<img height="500" src="./readme/images/rechart.png">

## What is included

- **Authentication**: JWT access token, rotating HttpOnly refresh cookie, login
  lockout, forced initial password change.
- **RBAC**: path-based menu and permission tree, users, roles, groups,
  permissions and operation logs.
- **Demo pages**: six dashboards, ECharts/Recharts/AntV/D3 charts, Leaflet/
  OpenLayers/deck.gl/Cesium maps, Three.js/Babylon.js scenes and a shadcn
  component gallery.
- **Two data modes**: an in-browser mock for demos and a real backend through the
  dev proxy.
- **Parity**: React is the reference for page content; Vue and Angular match its
  routes, menu tree, icons, theme tokens and tab styling.

## Repository layout

```text
.
├── frontend/                 # UI implementations, one directory per framework
│   ├── react/                # React 19 + Vite + shadcn/Base UI (GitHub Pages)
│   ├── angular/              # Angular 21 + Angular Material
│   ├── vue/                  # Vue 3 + Vuetify
│   └── docs/                 # Frontend startup, configuration, architecture
├── backend/                  # API implementations, one directory per stack
│   ├── springboot/           # Java 25 + Spring Boot (behaviour reference)
│   ├── go-gin-gorm/          # Go + Gin + GORM
│   ├── node-nestjs/          # Node.js + NestJS
│   ├── csharp/               # C# + ASP.NET Core
│   ├── rust-axum/            # Rust + Axum
│   ├── python-fastapi/       # Python + FastAPI
│   └── docs/                 # Backend startup, configuration, architecture
├── database/                 # DDL and seed data, one directory per engine
│   ├── postgres/ mysql/ mariadb/ sqlite/
│   └── opengauss/ oceanbase/ goldendb/
├── contracts/                # Cross-stack contracts
│   └── openapi.json          # Machine-readable API contract
├── docs/                     # Technology-agnostic project documentation
│   ├── README.md             # Documentation index and placement rules
│   ├── FEATURES.md API.md DATABASE.md STACKS.md
│   ├── validation-rules.md VERIFICATION.md PORTING.md
│   ├── adr/ audits/ security/ agents/
└── scripts/                  # Cross-stack scripts (seed sync, E2E, JWT keys)
```

Rules for the layout:

- `docs/`, `contracts/`, `database/` and the root READMEs are technology-agnostic.
- Frontend-specific design lives in `frontend/docs/`; backend-specific design
  lives in `backend/docs/`.
- Configuration lives next to the code it configures: `frontend/<stack>/.env*`,
  `frontend/angular/src/environments/`, and `backend/<stack>/.env.example` /
  `application-local.example.yaml`.
- `database/<engine>` contains only DDL and seed data. Runtime connection
  settings belong to each backend.
- Only `frontend/react` is deployed to GitHub Pages.

## Stack matrix

### Frontend

| Stack | Directory | Port | Notes |
| --- | --- | --- | --- |
| React 19 + Vite 8 + shadcn/Base UI | `frontend/react` | 5173 | Reference, deployed to Pages |
| Vue 3.5 + Vuetify 3 | `frontend/vue` | 5174 | 20 unit tests |
| Angular 21 + Angular Material | `frontend/angular` | 4200 | 26 unit tests |

### Backend

| Stack | Directory | Port | Database support |
| --- | --- | --- | --- |
| Java 25 + Spring Boot | `backend/springboot` | 8080 | PostgreSQL, MySQL, MariaDB, SQLite |
| Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | PostgreSQL, MySQL, MariaDB, SQLite |
| C# + ASP.NET Core | `backend/csharp` | 8082 | PostgreSQL, MySQL, MariaDB, SQLite |
| Rust + Axum | `backend/rust-axum` | 8083 | PostgreSQL, MySQL, MariaDB, SQLite |
| Node.js + NestJS | `backend/node-nestjs` | 3000 | PostgreSQL, MySQL, MariaDB, SQLite |
| Python + FastAPI | `backend/python-fastapi` | 8000 | PostgreSQL, MySQL, MariaDB, SQLite |

### Database

| Engine | Directory | Runtime matrix |
| --- | --- | --- |
| PostgreSQL | `database/postgres` | tested |
| MySQL | `database/mysql` | tested |
| MariaDB | `database/mariadb` | tested |
| SQLite | `database/sqlite` | tested |
| openGauss / OceanBase / GoldenDB | `database/<engine>` | static SQL only |

Database design is public and engine-neutral: see
[docs/DATABASE.md](./docs/DATABASE.md).

## Documentation

| Document | Content |
| --- | --- |
| [docs/README.md](./docs/README.md) | Documentation index and placement rules |
| [docs/FEATURES.md](./docs/FEATURES.md) | Product scope, roles, page inventory |
| [docs/API.md](./docs/API.md) | Endpoints, auth, errors, pagination |
| [docs/DATABASE.md](./docs/DATABASE.md) | ER model, invariants, dialect matrix |
| [docs/STACKS.md](./docs/STACKS.md) | Ports and run commands |
| [docs/VERIFICATION.md](./docs/VERIFICATION.md) | What was built, tested and left unverified |
| [frontend/docs/README.md](./frontend/docs/README.md) | Frontend startup, configuration, architecture, visual guide |
| [backend/docs/README.md](./backend/docs/README.md) | Backend startup, configuration, shared architecture |
| [contracts/openapi.json](./contracts/openapi.json) | Machine-readable API contract |
| [PROJECT_ISSUES.md](./PROJECT_ISSUES.md) | Decisions, accepted trade-offs, verification log |
| [CONTEXT.md](./CONTEXT.md) | Domain vocabulary |

## Quick start (React + Spring Boot + PostgreSQL)

```bash
# 1. database
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql

# 2. backend configuration
cp backend/springboot/src/main/resources/application-local.example.yaml \
   backend/springboot/src/main/resources/application-local.yaml
# edit the datasource if your PostgreSQL is not localhost:5432

# 3. backend
cd backend/springboot
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# 4. frontend
cd frontend/react
pnpm install
pnpm dev            # http://localhost:5173
```

Sign in with `super / super`, `admin / admin` or `user / user`.

Other stacks: see [frontend/docs/GETTING-STARTED.md](./frontend/docs/GETTING-STARTED.md)
and [backend/docs/GETTING-STARTED.md](./backend/docs/GETTING-STARTED.md).

## 🧾 License

This project is [MIT licensed](./LICENSE).
