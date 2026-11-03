# Stacks

Every stack implements the same product. The contract is [API.md](./API.md); the parity checklist is [PORTING.md](./PORTING.md).

## 1. Matrix

| Layer | Stack | Directory | Port | Status |
| --- | --- | --- | --- | --- |
| Frontend | React 19 + Vite + shadcn/ui | `frontend/react` | 5173 | Implemented, deployed to GitHub Pages |
| Frontend | Angular + Angular Material | `frontend/angular` | 4200 | Implemented, 19 tests pass |
| Frontend | Vue 3 + Vuetify | `frontend/vue` | 5174 | Implemented, 20 tests pass |
| Backend | Java 25 + Spring Boot | `backend/springboot` | 8080 | Implemented |
| Backend | Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | Implemented |
| Backend | Node.js + NestJS | `backend/node-nestjs` | 3000 | Implemented |
| Backend | C# + ASP.NET Core | `backend/csharp` | 8082 | Implemented |
| Backend | Rust + Axum | `backend/rust-axum` | 8083 | Implemented, 40 tests pass |
| Backend | Python + FastAPI | `backend/python-fastapi` | 8000 | Implemented |

Only `frontend/react` is deployed. Angular and Vue are built and tested locally, but are not published.

## 2. Database per stack

All backends read the connection from environment variables. The default target is PostgreSQL:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orange
DB_USER=postgres
DB_PASSWORD=postgres
```

Per-engine scripts:

| Engine | Scripts | Verified |
| --- | --- | --- |
| PostgreSQL | `database/postgres` | Yes, integration tests |
| MySQL 8 | `database/mysql` | Yes, Docker |
| MariaDB 11 | `database/mariadb` | Yes, Docker |
| SQLite | `database/sqlite` | Yes, Python `sqlite3` |
| openGauss | `database/opengauss` | Static compatibility review |
| OceanBase | `database/oceanbase` | Static, MySQL-compatible |
| GoldenDB | `database/goldendb` | Static, MySQL-compatible |

The Java backend targets PostgreSQL. The other backends use the language's PostgreSQL driver by default; switching to MySQL/SQLite is documented in each backend README where the ORM supports it. openGauss, OceanBase and GoldenDB are reached through their PostgreSQL/MySQL-compatible drivers.

## 3. Run commands

### Spring Boot

```bash
cd backend/springboot
mvn spring-boot:run
```

### Go

```bash
cd backend/go-gin-gorm
go run ./cmd/server
```

### NestJS

```bash
cd backend/node-nestjs
pnpm install
pnpm start:dev
```

### C#

```bash
cd backend/csharp
dotnet run --project src/Orange.Api
```

### Rust

```bash
cd backend/rust-axum
cargo run
```

### FastAPI

```bash
cd backend/python-fastapi
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### React

```bash
cd frontend/react
pnpm install
pnpm dev
```

### Angular

```bash
cd frontend/angular
npm install
npm start
```

### Vue

```bash
cd frontend/vue
pnpm install
pnpm dev
```

Each stack README is the source of truth for its exact commands and environment variables.

## 4. CI and deployment

- `.github/workflows/main.yml` compiles the Java backend, runs its tests, then builds the React app and deploys `frontend/react/dist` to GitHub Pages.
- Angular and Vue are not deployed and are not yet in the CI workflow. Add their build/test steps when CI capacity allows.
- The database scripts are not executed in CI except the PostgreSQL schema used by the Java integration tests.
- New backends should add a CI job that at least compiles the project and runs unit tests.

## 5. Adding a stack

1. Create `backend/<stack>` or `frontend/<stack>`.
2. Follow [PORTING.md](./PORTING.md).
3. Add the stack and its port to this file.
4. Add a CI job if the toolchain is available.
5. Do not change `contracts/` or `database/postgres` to fit a stack; change them only when the contract itself changes.
