# 文档重建 · 事实基线（阶段 0）

> 采集方式：直接读仓库配置/契约/源码，不引用旧文档。
> 基线提交：`24826bb` · 2026-11-07

## 1. 仓库

- 产品：Orange，权限/菜单/角色管理后台（同一产品 9 套实现 + 7 种数据库方言）。
- 结构：`frontend/{react,vue,angular}`、`backend/{springboot,go-gin-gorm,node-nestjs,csharp,rust-axum,python-fastapi}`、`database/<engine>`、`contracts/openapi.json`、`docs/`、`scripts/`、`.github/workflows/main.yml`。
- 源码文件（排除 node_modules/.venv/dist/target/bin/obj）：1,254。TypeScript 597（.ts 301 + .tsx 296）、Java 119、Vue 61、Markdown 58、Python 57、C# 53、Go 52、Rust 44。

## 2. 栈矩阵

| 栈 | 目录 | 端口 | 安装 | 开发/启动 | 测试 | 构建 | 其他 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React 19 + Vite | `frontend/react` | 5173（Vite 默认） | `pnpm install` | `pnpm dev` | `pnpm test`（vitest） | `pnpm build` / `build:github` | `pnpm lint`、`pnpm typecheck`、`pnpm gen:api`（openapi-typescript 生成 `src/api/schema.d.ts`）|
| Vue 3 + Vuetify | `frontend/vue` | 5174（脚本显式 `--port 5174`） | `pnpm install` | `pnpm dev` | `pnpm test` | `pnpm build` | `pnpm lint`、`pnpm typecheck`、`pnpm format` |
| Angular 21 + Material | `frontend/angular` | 4200（`ng serve --port 4200 --configuration local`） | `npm ci` | `npm start` | `npm test`（`--watch=false`） | `npm run build` | `npm run lint` |
| Spring Boot (Java 25) | `backend/springboot` | 8080（`APP_PORT`，默认 8080） | Maven | `mvn spring-boot:run`（待核）| `mvn test` | `mvn -DskipTests package` | 行为基准实现 |
| Go + Gin + GORM | `backend/go-gin-gorm` | 8081（`APP_PORT`/`PORT`） | `go mod download` | `go run ./cmd/server` | `go test ./...` | `go build -o bin/server ./cmd/server` | CI 另跑 `gofmt -l`、`go vet` |
| NestJS | `backend/node-nestjs` | 3000（待核） | `pnpm install` | `pnpm start:dev` | `pnpm test`（jest） | `pnpm build` | `pnpm typecheck`、`pnpm smoke` |
| ASP.NET Core (.NET 10) | `backend/csharp` | 8082（待核） | — | `dotnet run --project src/Orange.Api`（待核） | `dotnet test Orange.slnx` | `dotnet build Orange.slnx` / `dotnet publish` | — |
| Rust + Axum | `backend/rust-axum` | 8083（`APP_PORT`/`PORT`） | — | `cargo run` | `cargo test` | `cargo build` | — |
| Python + FastAPI | `backend/python-fastapi` | 8000（`APP_PORT`/`PORT`；`python -m app.main`） | `pip install -r requirements-dev.txt` | `python -m app.main` | `python -m pytest -q` | — | `/docs` 为 OpenAPI UI |

数据库支持（待各后端 README 核实）：PostgreSQL、MySQL、MariaDB、SQLite；openGauss/OceanBase/GoldenDB 仅静态 SQL。

规模参考（2026-11-07 由后端 README 写作代理用 `git ls-files` 复核，覆盖此前的 `Get-ChildItem` 口径）：
- springboot 128 文件 / 14 个测试类（1 个 Testcontainers，无 Docker 时自动 skip）
- go 57 文件 / 11 个 `_test.go`
- nest 95 文件 / 7 个 `.spec.ts`（纯单测，不起 Nest、不连库）
- csharp 61 文件 / 7 个测试类（另 1 个测试 csproj；用例数未复跑）
- rust 50 文件 / 0 个独立测试文件，8 个模块内联 40 个 `#[test]`
- fastapi 63 文件 / 10 个 `test_*.py` + conftest（内存 SQLite）
- react 8 测试文件 / 188 页面文件；vue 4 / 35；angular 5 / 38

已核实的命令修正（覆盖 §2 表中“待核”项）：
- spring：`mvn spring-boot:run`（仓库无 `mvnw`），测试 `mvn -B test`，构建产物 `target/orange-0.0.1-SNAPSHOT.jar`
- nest：端口 3000（`src/config/app-config.ts`）
- csharp：端口 8082（`Configuration/AppOptions.cs`；整仓无 `launchSettings.json`）
- go：构建产物是 `bin/server`（不是 `bin/orange-server`）
- fastapi：`python -m app.main` 时 `APP_PORT`/`PORT` 生效；`uvicorn app.main:app --port 8000` 时环境变量端口不生效

六栈真实差异（写作时按此，勿写“全部一致”）：JWT 算法（Spring RS256，Go HS256/RS256，其余 HS256）；OpenAPI UI（Spring 默认关、FastAPI 默认开、其余无）；乐观锁（仅 Spring 比较 `@Version`）；缓存（仅 Spring 有 Caffeine group 缓存）；审计清理节奏（Spring 每日 03:30，Nest 启动+每日，C# 每 6 小时，其余每日）；配置载体（仅 Spring 用 YAML，其余 `.env.example`）。

依赖规模：react 63 运行时 + 24 开发依赖；vue 17 运行时；angular 15 运行时。

## 3. 契约（`contracts/openapi.json`）

- 解析结果：**33 个 path、49 个 operation、15 个 deprecated（标记废弃）→ 34 个规范 operation**。
- tag：用户管理、操作日志、组织管理、角色管理、权限管理、login-controller、菜单。
- 认证：`security: bearerAuth`（JWT，`Authorization: Bearer`）。
- 响应包体：`{code, message, data, timestamp, traceId}`；分页 `{total, list, page, size, totalPages}`。
- 关键 path 组：`/api/v1/auth/{login,logout,refresh,change-password,user-info,menus}`；`/api/v1/system/{users,roles,permissions,groups,operation-logs}`（含 `/{id}`、`/{id}/status`、`/children` 等）。
- 旧接口：`*/detail/{id}`、`*/add`、`*/edit`、`permissions/addChild` 等 15 个标记 deprecated，规范实现不暴露（见各后端 README）。

## 4. 数据模型

`database/<engine>/ddl.sql` + `dml.sql`，7 个引擎：postgres、mysql、mariadb、sqlite、opengauss、oceanbase、goldendb。PostgreSQL DDL 中的 10 张表：

`sys_group`、`sys_permission`、`sys_role`、`sys_role_permission`、`sys_user`、`sys_user_permission`、`sys_user_role`、`sys_revoked_token`、`sys_login_attempt`、`sys_operation_log`。

不变量（以 `docs/adr/` 为准，写作时引用 ADR，不在正文重复推导）：path 即权限身份、编码决定同级顺序、校验分层（ADR 0001/0002/0003/0004）。

## 5. 环境变量与配置

后端各有 `.env.example`：`backend/{csharp,go-gin-gorm,node-nestjs,python-fastapi,rust-axum}/.env.example`；spring 用 `backend/springboot/src/main/resources/application*.yaml`；前端用 `frontend/<stack>/.env*`（见 `frontend/react/.env.local` 被 gitignore，仓库内有 example 待核）。字段以这些文件为准，写作时逐项列出来源文件。

## 6. 脚本（17 个）

| 脚本 | 作用（摘自文件头） |
| --- | --- |
| `scripts/check-config.mjs` | 只读校验提交的配置模板一致性（CI config job 调用） |
| `scripts/sync-permission-catalog.mjs` | 把权威权限目录同步到消费它的前端 |
| `scripts/sync-permission-seed.mjs` | 同步权限种子数据（`npm run permissions:sync` 的一半） |
| `scripts/generate-jwt-keys.mjs` | 生成 JWT 密钥对 |
| `scripts/prepare-stack-databases.ps1` | 准备各栈数据库 |
| `scripts/test-databases.ps1` | 本地数据库测试 |
| `scripts/ci/http-smoke.mjs` | 跨栈 HTTP 冒烟（用法：`node scripts/ci/http-smoke.mjs http://127.0.0.1:8080/api/v1`） |
| `scripts/ci/contract-test.mjs` | 跨栈契约验收（用法同上，可指定 base URL） |
| `scripts/ci/run-contract.mjs` | 对单个/多个后端跑完整契约验收（SQLite） |
| `scripts/ci/run-db-matrix.mjs` | 对一个后端跑 PG/MySQL/MariaDB/SQLite 矩阵 |
| `scripts/e2e/parity.mjs` | 三前端视觉一致性截图 + diff（协议见 `.scratch/ui-parity/spec.md`） |
| `scripts/e2e/{mock,real}-{react,vue,angular}.mjs` | 三前端 mock/真实后端 E2E 驱动 |
| `scripts/e2e/check-controls.mjs` | 校验共享头部/登录控件、语言菜单、主题切换 |

根 `package.json` 脚本：`permissions:sync`（catalog + seed 同步）、`permissions:check`（`--check` 模式，CI 用）。

## 7. CI（`.github/workflows/main.yml`）

- job `config`：`node scripts/check-config.mjs` + `npm run permissions:check`
- job `frontend-react`：lint → typecheck → test → build:github（push 时发布 Pages）
- job `frontend-angular` / `frontend-vue`：install → lint/test → build
- job `backend`：矩阵 `[spring, go, nest, csharp, rust, fastapi]`，起 postgres/mysql/mariadb service；push 时额外跑 `run-db-matrix` 与 `run-contract`
- job `deploy`：push 时部署 React 到 GitHub Pages

## 8. 已知与文档相关的偏差（写作时修正，不要沿用）

- 旧 `docs/README.md` 目录表不含 `docs/audits/`，而该目录是空目录。
- 6 个后端 README 各自重抄端点/数据库/验证结论；新结构只允许 `docs/reference/stacks.md` 与 `docs/reference/api.md` 写事实。
- 旧 `frontend/docs`、`backend/docs` 各有两份 `.zh-CN` 副本，与新语言策略冲突（删除）。
- `.scratch/` 34 篇归档不属于本次重建范围。
