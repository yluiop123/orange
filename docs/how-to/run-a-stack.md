# 启动任意前后端组合

本页给出九套实现各自的最小启动步骤、配置入口，以及前端在 mock 与真实后端之间的切换点；端口、测试与构建命令只在 [技术栈参考](../reference/stacks.md) 维护，这里不重复。

## 1. 组合规则

- 任意前端可以配任意后端。九套实现之间没有共享运行时库，唯一共同约定是 `/api/v1` 前缀、`{code, message, data, timestamp, traceId}` 响应包体，以及 `Authorization: Bearer` 加 HttpOnly `refresh_token` Cookie。
- 前端 dev server 把 `/api` 代理到后端，浏览器看到的是同源请求，refresh Cookie 才能正常携带；不要为了“直连”把 API 前缀改成绝对地址，除非你确实需要跨域。
- 一个后端进程只连一种数据库引擎，由该栈的 `DB_DRIVER` / `DATABASE_URL` 决定。

## 2. 前端

| 栈 | 目录 | 安装 | 开发 | mock 开关 | 代理目标 |
| --- | --- | --- | --- | --- | --- |
| React | `frontend/react` | `pnpm install` | `pnpm dev` | `.env.development` 的 `VITE_MOCK_ENABLE` | `VITE_PROXY_TARGET` |
| Vue | `frontend/vue` | `pnpm install` | `pnpm dev` | `.env.development` 的 `VITE_MOCK_ENABLE` | `VITE_PROXY_TARGET` |
| Angular | `frontend/angular` | `npm ci` | `npm start` | `src/environments/environment.local.ts` 的 `mock` | `proxy.conf.json` 的 `target` |

React 与 Vue 的开发模式默认 mock（`.env.development` 把 `VITE_MOCK_ENABLE` 设为 `true`），不启动后端也能看界面。Angular 的 `npm start` 固定用 `local` 配置，`environment.local.ts` 里 `mock` 默认是 `false`，也就是默认连真实后端；要用 mock 就把它改成 `true`，或在地址后加 `?mock=1`（会写进 `localStorage`）。

## 3. 后端

| 栈 | 目录 | 安装 | 开发启动 | 配置入口 |
| --- | --- | --- | --- | --- |
| Spring Boot | `backend/springboot` | Maven 在构建时解析依赖，无 `mvnw` | `mvn spring-boot:run`（可加 `SPRING_PROFILES_ACTIVE=local`） | `src/main/resources/application.yaml` + `application-local.yaml` |
| Go | `backend/go-gin-gorm` | `go mod download` | `go run ./cmd/server` | `.env.local` |
| NestJS | `backend/node-nestjs` | `pnpm install` | `pnpm start:dev` | `.env.local` |
| .NET | `backend/csharp` | `dotnet restore`（`build` 时自动） | `dotnet run --project src/Orange.Api` | `.env.local` |
| Rust | `backend/rust-axum` | `cargo` 自动解析 | `cargo run` | `.env` |
| FastAPI | `backend/python-fastapi` | `pip install -r requirements-dev.txt` | `python -m app.main` | `.env` |

## 4. 启动一个组合

以 React + FastAPI + SQLite 为例，其他组合只换第 2、3 步的栈目录与代理目标：

1. **准备数据库**：按 [切换数据库](../backend/switch-database.md) 建库并灌 `database/<engine>/{ddl.sql,dml.sql}`。SQLite 最快，`DB_DRIVER=sqlite` 加一个文件路径即可。
2. **启动后端**：把该栈的 `.env.example` 复制成本地文件（见上表），至少设置 `DB_DRIVER`/`DATABASE_URL` 与 `JWT_SECRET`；运行上表的开发启动命令，用 `POST /api/v1/auth/login`（`super/super`）确认返回 `code=200`。
3. **让前端指向它**：React/Vue 设 `VITE_PROXY_TARGET` 为该后端地址，并把 `VITE_MOCK_ENABLE` 设为 `false`；Angular 改 `proxy.conf.json` 的 `target`，并把 `mock` 设为 `false`。改完必须重启 dev server，代理与环境变量只在启动时求值。
4. **启动前端**：运行上表的开发命令，登录 `super/super`。
5. **跑冒烟**：`node scripts/ci/http-smoke.mjs http://127.0.0.1:<后端端口>/api/v1`，对任意后端都适用。

## 5. 环境变量从哪里读

| 栈 | 本地文件（gitignored） | 提交的模板 | 覆盖规则 |
| --- | --- | --- | --- |
| Spring Boot | `application-local.yaml` | `application-local.example.yaml` | 真实环境变量 > profile 文件 > `application.yaml` |
| Go | `.env.local` | `.env.example` | 真实环境变量 > `.env.local` |
| NestJS | `.env.local` | `.env.example` | 真实环境变量 > `.env.local` |
| .NET | `.env.local` | `.env.example` | 真实环境变量 > `.env.local` |
| Rust | `.env` | `.env.example` | 真实环境变量 > `.env` |
| FastAPI | `.env` | `.env.example` | 真实环境变量 > `.env` |
| React / Vue | `.env.local`、`.env.<mode>.local` | 无模板，仓库提交 `.env` 与 `.env.development` | 进程环境变量 > `.env.<mode>.local` > `.env.<mode>` > `.env.local` > `.env` |
| Angular | `src/environments/environment.local.ts` | 同文件（已提交） | `angular.json` 的 `fileReplacements` 在启动时替换 |

所有后端都遵循同一条连接优先级：`DATABASE_URL` 压过 `DB_DRIVER` 加离散 `DB_*`；都没设时回落到 PostgreSQL 默认值。逐项变量清单见 [配置参考](../reference/configuration.md) 与 [Backend 配置](../backend/configuration.md)。

## 6. mock 与真实 API

| 栈 | 开 mock | 关 mock |
| --- | --- | --- |
| React | `VITE_MOCK_ENABLE=true pnpm dev` | `VITE_MOCK_ENABLE=false pnpm dev` |
| Vue | `VITE_MOCK_ENABLE=true pnpm dev` | `VITE_MOCK_ENABLE=false pnpm dev` |
| Angular | `environment.local.ts` 里 `mock: true`，或 URL 加 `?mock=1` | `mock: false` |

Windows PowerShell 用 `$env:VITE_MOCK_ENABLE="false"` 再 `pnpm dev`。注意 Vite 的加载顺序：`.env.development` 排在 `.env.local` 之后，所以仓库里 `.env.development` 的 `mock=true` 会覆盖 `.env.local` 的 `false`；要长期关闭就在 `.env.development.local` 里写，或每次用进程环境变量。mock 的落点、代理与 CORS 细节见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)。

## 7. 常见问题

- **代理不生效**：代理只属于 dev server，`pnpm build` / `ng build` 的产物不含代理；部署后要么同源，要么让后端放行前端 Origin。
- **换后端端口后 404**：改代理目标，不要改源码里的 `/api/v1` 前缀；Angular 的目标写死在 `proxy.conf.json`。
- **Cookie 不随请求发送**：`localhost` 与 `127.0.0.1` 是不同 Origin，登录与代理要统一用一个主机名。
- **FastAPI 换端口**：`python -m app.main` 读 `APP_PORT`/`PORT`；改用 `uvicorn app.main:app` 命令行时显式传 `--port`，环境变量不再生效。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `frontend/{react,vue}/package.json`、`frontend/{react,vue}/vite.config.ts`、`frontend/{react,vue}/.env*`、`frontend/angular/{package.json,angular.json,proxy.conf.json,src/environments/environment*.ts}`、`backend/*/README.md`、`backend/{go-gin-gorm,node-nestjs,csharp}/.env.example`、`backend/{rust-axum,python-fastapi}/.env.example`、`backend/springboot/src/main/resources/application*.yaml`、`backend/python-fastapi/app/config.py`、`scripts/ci/http-smoke.mjs`
