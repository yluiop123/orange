# 启动任意前后端组合

本页解决「我想用的这套前端 + 那套后端怎么接起来」：端口、安装、启动与测试命令只在 [栈矩阵](../reference/stacks.md) 维护，这里只写组合时的接线动作、常见坑与三个完整示例。读者应已跑通 [30 分钟快速上手](../tutorials/quickstart.md)。

## 1. 先查两件事

| 要查的 | 去哪 |
| --- | --- |
| 端口、安装/启动/测试/构建命令、各栈独有能力 | [栈矩阵](../reference/stacks.md) |
| 后端数据库与 JWT 相关环境变量 | [后端配置参考](../backend/configuration.md) |

前端到后端只有一条链路：页面用的 API 基地址（React `VITE_BASE_API`、Vue `VITE_API_BASE`、Angular `environment.apiBase`）默认 `/api/v1/` → dev server 把 `/api` 代理到目标 → 后端。代理只在 dev 生效，构建产物里没有代理。

## 2. 前端：mock 还是真实后端

| 前端 | 开关位置 | 开发默认 | 切真实后端要做的 |
| --- | --- | --- | --- |
| React | `.env.development` 的 `VITE_MOCK_ENABLE` | mock 开 | 建 `.env.development.local`：`VITE_MOCK_ENABLE=false` 加 `VITE_PROXY_TARGET=<后端地址>` |
| Vue | `.env.development` 的 `VITE_MOCK_ENABLE` | mock 开 | 同上，代理变量同为 `VITE_PROXY_TARGET` |
| Angular | `src/environments/environment.local.ts` 的 `mock` | **mock 关**（`npm start` 用 `local` 配置） | 代理写死在 `frontend/angular/proxy.conf.json`，改 `target` 后重启；想临时用 mock 在地址后加 `?mock=1` |

共同规则：

- Vite 只在启动时读环境变量，改完必须重启 dev server。
- 优先级：进程环境变量 > `.env.<mode>.local` > `.env.<mode>` > `.env.local` > `.env`；`.env.<mode>` 会盖掉 `.env.local`，所以关掉 `.env.development` 的 mock 要写 `.env.development.local` 或传进程环境变量。
- 直连绝对地址会变成跨域请求，refresh Cookie 与 CORS 都要额外配置；能用代理就用代理。
- mock 落点与完整切换规则见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)。

## 3. 后端：选数据库的环境变量入口

不改代码就能换库，规则统一（逐项变量与默认值见 [后端配置参考](../backend/configuration.md)）：

1. 完整连接串优先：`DATABASE_URL`；Spring 用 `SPRING_DATASOURCE_URL` 或 `DB_URL`（不读 `DATABASE_URL`）。
2. 否则由 `DB_DRIVER` + `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` 拼装；SQLite 用文件路径（Go 是 `DB_PATH`）。
3. 都不给则按 PostgreSQL 默认值连 `localhost:5432`。

| 后端 | 指向 SQLite 的最小写法 |
| --- | --- |
| FastAPI | `DB_DRIVER=sqlite DB_NAME=app.db`（相对**进程工作目录**） |
| Go | `DB_DRIVER=sqlite DB_PATH=./app.db` |
| Spring Boot | `DB_DRIVER=sqlite` 加 `SPRING_DATASOURCE_URL=jdbc:sqlite:<绝对路径>/app.db` |
| Nest / .NET / Rust | `DATABASE_URL=<绝对路径>/app.db` 或 `DB_DRIVER=sqlite` 加各自 `DB_*` |

建库永远用 `database/<engine>/ddl.sql` + `dml.sql`，应用不建表（Spring 的 `ddl-auto` 固定 `none`）。方言差异与切库步骤见 [切换数据库](../backend/switch-database.md)。

## 4. 三个常见组合

### React + Spring Boot + SQLite

1. 建库：在仓库根用 `database/sqlite/ddl.sql` 与 `dml.sql` 生成 `app.db`（同一连接跑完两条脚本）。
2. 起后端（端口见 [栈矩阵](../reference/stacks.md)）：`DB_DRIVER=sqlite SPRING_DATASOURCE_URL=jdbc:sqlite:<绝对路径>/app.db mvn spring-boot:run`。不要同时带 `SPRING_PROFILES_ACTIVE=local`——`application-local.yaml` 里写死了 PostgreSQL 连接。
3. 前端：React 的代理目标默认就是 Spring 的默认端口，只需在 `.env.development.local` 写 `VITE_MOCK_ENABLE=false`，重启 `pnpm dev` 后前端默认端口即连真实后端。

### Vue + Go + SQLite

1. 起后端（端口见 [栈矩阵](../reference/stacks.md)）：`DB_DRIVER=sqlite DB_PATH=./app.db go run ./cmd/server`。
2. 前端 `.env.development.local` 写 `VITE_MOCK_ENABLE=false` 与 `VITE_PROXY_TARGET=http://127.0.0.1:<后端端口>`。
3. 打开 Vue 的默认端口，用 `super` / `super` 登录。

### Angular + FastAPI + SQLite

1. 把 Spring 的默认端口让给 FastAPI：`APP_PORT=<Spring 默认端口> DB_DRIVER=sqlite DB_NAME=app.db python -m app.main`，这样不必改 Angular 的代理文件。
2. 或者保留 FastAPI 的默认端口：把 `frontend/angular/proxy.conf.json` 的 `target` 改成 `http://127.0.0.1:<FastAPI 端口>`，重启 `npm start`。
3. Angular 的 `npm start` 默认不启用 mock，不用动 mock 开关；访问 Angular 的默认端口即可。

## 5. 起来之后验一下

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:<后端端口>/api/v1
```

脚本用 `super`/`super` 登录，覆盖响应包体、`user-info`、菜单、用户列表、组织增删、操作日志与登出；登录最多重试 90 秒，适合紧跟后端启动后运行。参数与退出码见 [脚本参考](../reference/scripts.md)。

## 6. 组合不起来时按顺序查

1. 后端真的在这个端口：直接请求登录接口有 `{code:200,...}`，而不是 dev server 的 404。
2. 代理目标与后端端口一致，且 dev server 已重启。
3. 关掉后端后页面仍能登录 → mock 还开着。
4. 用绝对基地址时报 CORS：来源（协议+主机+端口）必须精确出现在后端 `CORS_ORIGINS` 里。
5. 登录成功但后续请求 401：`localhost` 与 `127.0.0.1` 是不同来源，代理目标与浏览器地址要统一主机名，否则 refresh Cookie 不随请求发送。
6. 后端连库失败：确认 `DB_DRIVER` / `DATABASE_URL` 已生效，不设就默认连 PostgreSQL。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `frontend/react/.env`、`frontend/react/.env.development`、`frontend/react/vite.config.ts`、`frontend/vue/.env*`、`frontend/vue/vite.config.ts`、`frontend/angular/proxy.conf.json`、`frontend/angular/angular.json`、`frontend/angular/src/environments/environment.local.ts`、`frontend/angular/src/app/mock/mock-backend.ts`、`backend/python-fastapi/app/config.py`、`backend/go-gin-gorm/internal/config/config.go`、`backend/springboot/src/main/resources/application.yaml`、`backend/springboot/src/main/resources/application-local.yaml`、`scripts/ci/http-smoke.mjs`
