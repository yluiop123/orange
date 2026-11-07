# 栈矩阵（唯一事实源）

本页解决：九套实现各自的端口、命令、数据库支持与独有能力。
读者：要启动/测试/构建某一套栈，或对比实现差异的人。**端口与命令只在本页维护**，其他文档一律链接到本页。

## 1. 前端

| 栈 | 目录 | 技术栈 | 端口 | 安装 | 开发 | 测试 | 构建 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React | `frontend/react` | React 19 + Vite + shadcn/Base UI + Tailwind | 5173（Vite 默认） | `pnpm install` | `pnpm dev` | `pnpm test`（vitest） | `pnpm build` / `pnpm build:github` |
| Vue | `frontend/vue` | Vue 3 + Vuetify 3 + Vite | 5174（脚本 `--port 5174`） | `pnpm install` | `pnpm dev` | `pnpm test` | `pnpm build` |
| Angular | `frontend/angular` | Angular 21 + Material | 4200（`ng serve --port 4200 --configuration local`） | `npm ci` | `npm start` | `npm test`（`--watch=false`） | `npm run build` |

补充命令：

- React：`pnpm lint`、`pnpm typecheck`、`pnpm gen:api`（由 `contracts/openapi.json` 生成 `src/api/schema.d.ts`）、`pnpm preview`、`pnpm analyze`
- Vue：`pnpm lint`、`pnpm typecheck`、`pnpm format`
- Angular：`npm run lint`

三个前端默认行为不同：React 与 Vue 在开发模式下默认 mock（`.env.development` 里 `VITE_MOCK_ENABLE=true`，无需后端）；Angular 的 `npm start` 使用 `local` 配置，`environment.local.ts` 默认 `mock: false`，需要后端或手动把 `mock` 改成 `true`（也可用 `?mock=1` 临时打开）。切换方式见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)。只有 React 会部署到 GitHub Pages（`build:github`，base `/orange/`）。

## 2. 后端

| 栈 | 目录 | 技术栈 | 端口 | 启动 | 测试 | 构建 |
| --- | --- | --- | --- | --- | --- | --- |
| Spring Boot | `backend/springboot` | Java 25 + Spring Boot 4（行为基准） | 8080（`APP_PORT`） | `mvn spring-boot:run`（本地加 `SPRING_PROFILES_ACTIVE=local`） | `mvn -B test` | `mvn -B -DskipTests package` → `target/orange-0.0.1-SNAPSHOT.jar` |
| Go | `backend/go-gin-gorm` | Go + Gin + GORM | 8081（`APP_PORT`→`PORT`） | `go run ./cmd/server` | `go test ./...`（CI 另跑 `gofmt -l .` 与 `go vet ./...`） | `go build -o bin/server ./cmd/server` |
| NestJS | `backend/node-nestjs` | Node.js + NestJS | 3000（`APP_PORT`→`PORT`） | `pnpm start:dev` | `pnpm test`（jest） | `pnpm build` → `pnpm start:prod` |
| .NET | `backend/csharp` | C# + ASP.NET Core + EF Core（.NET 10） | 8082（`APP_PORT`→`PORT`） | `dotnet run --project src/Orange.Api` | `dotnet build Orange.slnx` 后 `dotnet test Orange.slnx --no-build` | `dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` |
| Rust | `backend/rust-axum` | Rust + Axum | 8083（`APP_PORT`/`PORT`） | `cargo run` | `cargo test` | `cargo build` |
| FastAPI | `backend/python-fastapi` | Python + FastAPI | 8000（`APP_PORT`→`PORT`） | `python -m app.main`（`uvicorn app.main:app --port 8000` 时环境变量端口不生效） | `python -m pytest -q` | 无构建步骤 |

安装：

- Spring / Go / Rust：工具链自带（Maven、`go mod download`、`cargo`），仓库**没有** `mvnw`
- Nest：`pnpm install`
- .NET：`dotnet restore`（`build` 时自动）
- FastAPI：`pip install -r requirements-dev.txt`

各后端的配置入口与环境变量见 [Backend 配置](../backend/configuration.md)；切库见 [切换数据库](../backend/switch-database.md)。

## 3. 数据库支持

| 引擎 | 后端运行时支持 | 验证方式 |
| --- | --- | --- |
| PostgreSQL | 6 个后端全部支持 | CI 数据库矩阵 + 契约测试 |
| MySQL | 6 个后端全部支持 | CI 数据库矩阵 |
| MariaDB | 6 个后端全部支持 | CI 数据库矩阵 |
| SQLite | 6 个后端全部支持 | CI 数据库矩阵 + 契约测试（SQLite） |
| openGauss / OceanBase / GoldenDB | 不支持 | 只有静态 SQL，见 [数据库方言](../reference/db-dialects.md) |

引擎由驱动名（如 `DB_DRIVER`）或 DSN 前缀识别；schema 由 `database/<engine>/ddl.sql` 管理，应用不建表。

## 4. 独有能力（差异，不是缺陷）

| 栈 | 独有事实 |
| --- | --- |
| Spring Boot | 唯一使用 RS256 + PEM 密钥；唯一有 Caffeine `group` 缓存；唯一在 JPA 层比较乐观锁 `@Version`；有 springdoc 但默认关闭（`SPRINGDOC_ENABLED`）；审计清理每日 03:30 |
| Go | JWT 支持 HS256 或 RS256；审计清理每日 |
| NestJS | 审计清理在启动时 + 每日；测试为纯单测（不启 Nest、不连库） |
| .NET | JWT 只用 HS256；审计清理每 6 小时；无 `launchSettings.json`，监听地址来自 `UseUrls` |
| Rust | JWT 只用 HS256；40 个内联 `#[test]`；乐观锁自增但不比较 `WHERE version` |
| FastAPI | JWT 只用 HS256；默认开启 `/docs`（OpenAPI UI）；测试用内存 SQLite |
| React | 唯一部署到 Pages；依赖面最大（图表/地图/3D/表格/表单） |

## 5. 测试规模

| 栈 | 测试 |
| --- | --- |
| Spring | 14 个测试类（含 1 个 Testcontainers，无 Docker 自动 skip） |
| Go | 11 个 `_test.go` |
| Nest | 7 个 `.spec.ts` |
| .NET | 7 个测试类（用例数待核） |
| Rust | 8 个模块内联 40 个 `#[test]` |
| FastAPI | 10 个 `test_*.py` + `conftest`（内存 SQLite） |
| React / Vue / Angular | 8 / 4 / 4 个测试文件 |

## 6. 常用组合

| 目标 | 组合 |
| --- | --- |
| 快速看界面 | React（mock）+ 任意后端都不启动 |
| 全链路最小验证 | React + FastAPI + SQLite |
| 行为基准对照 | React + Spring Boot + PostgreSQL |
| 跨栈一致性 | 三前端 mock 模式 + `scripts/e2e/parity.mjs` |

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/*/package.json、backend/*/package.json|pom.xml|go.mod|Cargo.toml|*.csproj、backend/*/src 配置类、.github/workflows/main.yml
