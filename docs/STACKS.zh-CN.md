> [English](./STACKS.md) | 简体中文

# 技术栈

每个技术栈都实现同一个产品。契约见 [API.md](./API.md)；一致性检查清单见 [PORTING.md](./PORTING.md)。前端专项设计见 [frontend/docs](../frontend/docs/README.zh-CN.md)；后端专项设计见 [backend/docs](../backend/docs/README.zh-CN.md)。

## 1. 矩阵

| 层 | 技术栈 | 目录 | 端口 | 状态 |
| --- | --- | --- | --- | --- |
| 前端 | React 19 + Vite + shadcn/ui | `frontend/react` | 5173 | 已实现，已部署到 GitHub Pages |
| 前端 | Angular + Angular Material | `frontend/angular` | 4200 | 已实现，26 个测试通过 |
| 前端 | Vue 3 + Vuetify | `frontend/vue` | 5174 | 已实现，20 个测试通过 |
| 后端 | Java 25 + Spring Boot | `backend/springboot` | 8080 | 已实现 |
| 后端 | Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | 已实现 |
| 后端 | Node.js + NestJS | `backend/node-nestjs` | 3000 | 已实现 |
| 后端 | C# + ASP.NET Core | `backend/csharp` | 8082 | 已实现 |
| 后端 | Rust + Axum | `backend/rust-axum` | 8083 | 已实现，40 个测试通过 |
| 后端 | Python + FastAPI | `backend/python-fastapi` | 8000 | 已实现 |

只有 `frontend/react` 已部署。Angular 和 Vue 在本地构建和测试，但未发布。

## 2. 各技术栈对应的数据库

所有后端都从环境变量读取连接信息。默认目标为 PostgreSQL：

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orange
DB_USER=postgres
DB_PASSWORD=postgres
```

各引擎脚本：

| 引擎 | 脚本 | 验证情况 |
| --- | --- | --- |
| PostgreSQL | `database/postgres` | 是，集成测试 |
| MySQL 8 | `database/mysql` | 是，Docker |
| MariaDB 11 | `database/mariadb` | 是，Docker |
| SQLite | `database/sqlite` | 是，Python `sqlite3` |
| openGauss | `database/opengauss` | 静态兼容性评审 |
| OceanBase | `database/oceanbase` | 静态检查，兼容 MySQL |
| GoldenDB | `database/goldendb` | 静态检查，兼容 MySQL |

目前六个后端都只连接 PostgreSQL；尚未接入 MySQL 或 SQLite 驱动。提供 MySQL/SQLite 脚本是为了 schema 可移植性以及未来的运行时支持。openGauss、OceanBase 和 GoldenDB 是兼容性目标，需要通过 PostgreSQL/MySQL 兼容驱动访问；这一切换尚未实现。

## 3. 运行命令

以下命令假设 `config/app.env` 已存在，并已运行 `node scripts/sync-config.mjs`：

```bash
cp config/app.example.env config/app.env
node scripts/sync-config.mjs
```

### Spring Boot

```bash
cd backend/springboot
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
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

各技术栈的 README 是其确切命令和环境变量的权威来源。

## 4. CI 与部署

- `.github/workflows/main.yml` 会编译 Java 后端、运行其测试，然后构建 React 应用并把 `frontend/react/dist` 部署到 GitHub Pages。
- Angular 和 Vue 未部署，也尚未纳入 CI 工作流。等 CI 资源允许时，再加入它们的构建/测试步骤。
- CI 中不执行数据库脚本，仅 Java 集成测试所用的 PostgreSQL schema 例外。
- 新的后端应添加一个 CI 任务，至少编译项目并运行单元测试。在该任务出现之前，本地证据记录在 [VERIFICATION.md](./VERIFICATION.md) 中；「已实现」意味着本地已验证，而非 CI 覆盖。

## 5. 新增技术栈

1. 创建 `backend/<stack>` 或 `frontend/<stack>`。
2. 遵循 [PORTING.md](./PORTING.md)。
3. 把该技术栈及其端口加入本文件。
4. 如果工具链可用，添加一个 CI 任务。
5. 不要为了适配某个技术栈而修改 `contracts/` 或 `database/postgres`；只有当契约本身变化时才修改它们。
