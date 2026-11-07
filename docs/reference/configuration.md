# 配置加载与文件位置

本页解决：配置写在哪个文件、谁覆盖谁、哪些文件不入库。
读者：要改端口/接口地址/数据库连接，或排查“我明明改了却没生效”的开发者。

变量清单不在本页：后端变量见 [Backend 配置](./../backend/configuration.md)，前端 mock 与接口切换见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)，根脚本参数见 [脚本参考](./scripts.md)。

## 1. 前端

三个前端都按“构建模式（mode）→ 环境文件 → 环境变量”的顺序加载。

| 前端 | 环境文件 | 选择方式 | 关键变量 |
| --- | --- | --- | --- |
| React | `frontend/react/.env`、`.env.development`、`.env.github`、`.env.local`（本地，不入库） | `pnpm dev` 用 development；`pnpm build` 用 production；`pnpm build:github` 用 `--mode github` | `VITE_BASE`、`VITE_BASE_API`、`VITE_PROXY_TARGET`、`VITE_MOCK_ENABLE` |
| Vue | `frontend/vue/.env`、`.env.development`、`.env.local`（本地，不入库） | 同上，Vite mode 决定 | `VITE_API_BASE`、`VITE_PROXY_TARGET`、`VITE_MOCK_ENABLE` |
| Angular | `frontend/angular/src/environments/environment.{ts,development.ts,local.ts}` | `npm start` 用 `--configuration local`；`ng build` 用默认/development | `apiBase`、`mock`、`production` |

优先级（从高到低）：进程环境变量 > `.env.<mode>.local` > `.env.<mode>` > `.env.local` > `.env`。**mode 文件覆盖 `.env.local`**：想关掉 `.env.development` 里默认开启的 mock，要写 `.env.development.local` 或传进程环境变量。Vite 只把 `VITE_` 前缀暴露给浏览器端代码。

三个前端的默认行为一致：

- **开发**：`VITE_MOCK_ENABLE=true`（React/Vue 的 `.env.development`）或 `environment.local.ts` 的 `mock` 开关，接口走浏览器内 mock，不需要后端。
- **连真实后端**：把 `/api/v1/` 交给 Vite dev 代理，代理目标默认 `http://localhost:8080`（Spring）；换后端就改 `VITE_PROXY_TARGET` 或直接改成绝对地址。
- **GitHub Pages 构建**：React 用 `.env.github`，`VITE_BASE=/orange/`，并默认开启 mock。

## 2. 后端

| 后端 | 配置入口 | 读取方式 |
| --- | --- | --- |
| Spring Boot | `backend/springboot/src/main/resources/application.yaml`（默认值）、`application-local.yaml`（本地，不入库） | `${APP_PORT:8080}` 形式的环境变量占位符；数据库 URL 优先级 `SPRING_DATASOURCE_URL > DB_URL > DB_HOST/DB_PORT/DB_NAME`，引擎由 `DB_DRIVER` 或 JDBC URL 识别 |
| Go | `backend/go-gin-gorm/.env.example` 为模板；进程环境变量 | `APP_PORT`（回退 `PORT`）、数据库 DSN 相关变量 |
| NestJS | `backend/node-nestjs/.env.example` 为模板；`src/config/env.ts` 加载 | `src/config/app-config.ts` 读取并校验，端口来自配置对象 |
| .NET | `backend/csharp/src/Orange.Api/appsettings.json` + `.env.example`；**仓库没有 `Properties/launchSettings.json`**，监听地址由 `AppOptions` + `Program.cs` 的 `UseUrls` 决定 | ASP.NET Core 配置系统（环境变量覆盖 appsettings） |
| Rust | `backend/rust-axum/.env.example` 为模板；进程环境变量 | `APP_PORT`/`PORT`、数据库连接由 config 模块解析 |
| FastAPI | `backend/python-fastapi/.env.example` 为模板；`app/config.py` 读取 | `APP_PORT`（回退 `PORT`）、DSN、JWT 相关 |

后端通用约定：

- **端口**优先读 `APP_PORT`；Spring 只读 `APP_PORT`，其余五栈未设置时回退 `PORT`，再回退各栈默认值。默认端口表只在 [Reference: 栈矩阵](./stacks.md) 维护。
- **数据库引擎**由驱动名或 DSN 前缀决定，schema 由 `database/<engine>/ddl.sql` 管理，应用不建表（Spring 的 `ddl-auto: none` 是这一约定的显式声明）。
- **JWT 密钥**由 `scripts/generate-jwt-keys.mjs` 生成，轮换流程见 [轮换 JWT 密钥](../how-to/rotate-jwt-keys.md)。

## 3. 哪些文件不入库

`.gitignore` 对配置类文件的规则：

| 规则 | 覆盖文件 |
| --- | --- |
| `*.local` | 所有 `.env.local` 类本地覆盖 |
| `frontend/react/.env.local`、`frontend/vue/.env.local` | 前端本地环境 |
| `backend/springboot/src/main/resources/application-local.yaml` | Spring 本地配置 |
| `backend/go-gin-gorm/.env.local`、`backend/node-nestjs/.env.local`、`backend/rust-axum/.env`、`backend/python-fastapi/.env`、`backend/csharp/.env.local` | 各后端本地环境 |
| `backend/springboot/src/main/resources/keys/*.pem` | JWT 私钥/公钥 |
| `*.db`、`*.sqlite`、`*.sqlite3` | 本地 SQLite 库 |

规则的含义：**仓库里只提交模板与默认值，真实密码、密钥、本地端口覆盖都不入库**。新增后端时要同时补 `.env.example` 和 `.gitignore` 条目，否则 CI 的 `scripts/check-config.mjs` 或 code review 会拦下。

## 4. 配置一致性校验

- `node scripts/check-config.mjs`：只读校验提交的配置模板是否自洽（CI `config` job 的第一条命令）。
- `npm run permissions:check`：校验权限目录与种子数据的同步状态（CI `config` job 的第二条命令）。

改动配置模板后本地先跑这两条，能提前拦住 CI 失败。

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/*/.env*、frontend/angular/src/environments/*、backend/*/src/main/resources/application.yaml、backend/*/src/config/*、.gitignore、.github/workflows/main.yml
