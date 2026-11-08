[English](README.md) | 简体中文

# Orange

Orange 是一个权限、菜单与角色管理后台。同一个产品有九套实现：三套前端（React、Vue、
Angular）和六套后端（Spring Boot、Go、NestJS、C#、Rust、FastAPI），它们共用一份 HTTP
契约和一套数据模型，并提供七种数据库方言的 SQL。

产品本身不是目的。目的是**以行为为准的对照参考**：同样的页面、接口、错误码和权限语义，
每套栈都要按同样的方式实现，这样实现之间的差异才来自框架或语言，而不是产品设计。九套
实现之间没有运行时共享——前端不互相 import，后端不共用包；共享的是可验证的事实：
前端冻结的接口快照 [frontend/openapi.json](frontend/openapi.json)、[database/](database/)
里的数据模型，以及 [scripts/](scripts/) 里的检查脚本。

## 功能范围

- **认证**：用户名/密码登录、短时效访问令牌、轮换的 HttpOnly refresh Cookie、登出、
  首次登录强制改密、基于数据库的登录锁定。
- **授权**：用户、角色、组织、权限四种资源，以及直属授权、角色融合和仅作用于前端视图的
  角色切换。
- **系统管理**：四种资源的增删改查、按业务编码排序的树、只读的操作日志。
- **演示页面**：仪表盘、图表、地图、三维场景和组件展示；用于验证应用外壳与设计系统，
  不新增后端接口。
- **种子角色**：`super`（拥有全部权限，且只有它能授予 `super`、重置 `super` 的密码）、
  `admin`（系统管理，但不含 `super`）、`user`（只读演示页面）。
- **页面清单**：30 个菜单页——仪表盘 6、组件 8、图表 4、三维 2、地图 5、系统管理 5，
  另有 `/login`、`/forbidden`、`/not-found` 三个特殊路由。
- **权限模型**：权限由 `type + path + action` 确定；有效权限是所有启用角色与直属授权的
  并集，再剔除禁用权限；目录权限只影响菜单可见性。

## 技术栈矩阵

| 栈 | 端口 | 启动 | 测试 |
| --- | --- | --- | --- |
| React 19 + Vite + shadcn/Base UI | 5173 | `pnpm dev` | `pnpm test` |
| Vue 3 + Vuetify 3 + Vite | 5174 | `pnpm dev` | `pnpm test` |
| Angular 21 + Material | 4200 | `pnpm start` | `pnpm test` |
| Spring Boot 4（Java 25） | 8080 | `mvn spring-boot:run` | `mvn -B test` |
| Go + Gin + GORM | 8081 | `go run ./cmd/server` | `go test ./...` |
| NestJS | 3000 | `pnpm start:dev` | `pnpm test` |
| ASP.NET Core（.NET 10） | 8082 | `dotnet run --project src/Orange.Api` | `dotnet test Orange.slnx --no-build` |
| Rust + Axum | 8083 | `cargo run` | `cargo test` |
| Python + FastAPI | 8000 | `python -m app.main` | `python -m pytest -q` |

后端端口由 `APP_PORT` 决定，未设置时回落到 `PORT`；Spring Boot 本地启动通常还会设置
`SPRING_PROFILES_ACTIVE=local`。所有 Node 项目统一用 pnpm：React、Vue、Angular、Nest
都跑 `pnpm install`；FastAPI 用 `pip install -r requirements-dev.txt`。Maven、Go
modules、Cargo 和 `dotnet restore` 由各自的工具链处理。

## 快速开始

从干净检出开始，跑通 React + FastAPI + SQLite：

```bash
# 终端 1：后端
cd backend/python-fastapi
python -m venv .venv && source .venv/bin/activate   # Windows：.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
sqlite3 app.db < ../../database/sqlite/ddl.sql
sqlite3 app.db < ../../database/sqlite/dml.sql
DB_DRIVER=sqlite DB_NAME=app.db python -m app.main   # http://127.0.0.1:8000

# 终端 2：前端
cd frontend/react
pnpm install
pnpm dev                                             # http://localhost:5173
```

JWT 密钥不入库。在仓库根目录执行 `pnpm run jwt:keys` 会生成
`keys/jwt-private.pem` 与 `keys/jwt-public.pem`（已 gitignore）；把
`JWT_PRIVATE_KEY`、`JWT_PUBLIC_KEY` 指向这两个文件即可使用 RS256。未配置时快速开始
回退到 `JWT_SECRET` 的 HS256。六套后端接受同一对密钥。

没有 `sqlite3` 命令行时，用 Python 的 `sqlite3` 模块在同一个连接里依次执行两个脚本。
React 开发模式默认走 mock；要连上面的后端，把 `VITE_MOCK_ENABLE=false` 和
`VITE_PROXY_TARGET=http://127.0.0.1:8000` 写进 `frontend/react/.env.development.local`，
再重启 dev server。种子账号：`super` / `super`、`admin` / `admin`、`user` / `user`。

## API 与 Swagger

六个后端都从各自的框架注解生成文档，并暴露 `GET /openapi.json` 与 `GET /swagger`：

| 栈 | 生成方式 |
| --- | --- |
| Spring Boot | springdoc-openapi 注解（`@Operation`、`@Schema`） |
| FastAPI | FastAPI/Pydantic 的路由元数据 |
| NestJS | `@nestjs/swagger` + CLI 插件 |
| ASP.NET Core | Swashbuckle 的控制器元数据 |
| Go | swaggo 的 handler 注解 |
| Rust | utoipa derive 与 path 注解 |

前端单独维护冻结的接口快照 [frontend/openapi.json](frontend/openapi.json)。三个前端各自
在 `/swagger`（React 为 `#/swagger`）提供 Swagger UI 页面，读取自己的
`public/openapi.json`，不请求任何运行中的后端。Swagger UI 的静态资源由各框架或其 CDN
提供。任选一个后端即可验证，以 FastAPI 为例：

```bash
cd backend/python-fastapi
DB_DRIVER=sqlite DB_NAME=app.db python -m app.main
# 浏览器打开 http://127.0.0.1:8000/swagger
curl -s http://127.0.0.1:8000/openapi.json | head
```

换用其他后端时，把端口换成矩阵里的端口即可。

## 数据库设计

所有引擎共享同一套逻辑模型：11 张表，全部以 `sys_` 为前缀——`sys_group`、
`sys_permission`、`sys_permission_i18n`、`sys_role`、`sys_role_permission`、
`sys_user`、`sys_user_permission`、`sys_user_role`、`sys_revoked_token`、
`sys_login_attempt`、`sys_operation_log`。结构以 [database/postgres/ddl.sql](database/postgres/ddl.sql) 为
基线，其他引擎目录都是它的移植；每个目录只有两个文件：`ddl.sql`（建表、主外键、索引、
CHECK）和 `dml.sql`（种子数据）。

| 引擎 | 文件 | 验证方式 |
| --- | --- | --- |
| PostgreSQL 16 | [ddl.sql](database/postgres/ddl.sql)、[dml.sql](database/postgres/dml.sql) | CI 矩阵 + 契约验收 |
| MySQL 8.0.16+ | [ddl.sql](database/mysql/ddl.sql)、[dml.sql](database/mysql/dml.sql) | CI 矩阵 |
| MariaDB 11 | [ddl.sql](database/mariadb/ddl.sql)、[dml.sql](database/mariadb/dml.sql) | CI 矩阵 |
| SQLite 3 | [ddl.sql](database/sqlite/ddl.sql)、[dml.sql](database/sqlite/dml.sql) | CI 矩阵 + 契约验收 |
| openGauss 5/6 | [ddl.sql](database/opengauss/ddl.sql)、[dml.sql](database/opengauss/dml.sql) | 仅静态审阅 |
| OceanBase 4（MySQL 模式） | [ddl.sql](database/oceanbase/ddl.sql)、[dml.sql](database/oceanbase/dml.sql) | 仅静态审阅 |
| GoldenDB 6 | [ddl.sql](database/goldendb/ddl.sql)、[dml.sql](database/goldendb/dml.sql) | 仅静态审阅 |

- 业务编码 `id` 既是主键也是树位置：组织根节点 2 位、权限根节点 4 位，子节点在父编码后
  追加 2 位；同级顺序就是编码的字典序，没有排序列。改编码等于改身份。
- 权限身份是 `(type, path, action)`：PostgreSQL 用两个部分唯一索引保证，MySQL 与
  MariaDB 改用生成列 `action_key` 达到同样效果。
- 菜单就是数据库行：`sys_permission.name` 是默认名称，`sys_permission_i18n` 每种语言
  一行；`/auth/menus` 按 `Locale` 依次尝试精确语言、主语言和默认名称。前端不再携带
  菜单标题目录。
- `database/permissions.json` 是权限事实源。`pnpm run permissions:sync` 会重新生成
  七个方言 `dml.sql` 里的种子区块，任一文件都不会静默漂移。
- PostgreSQL、MySQL、MariaDB、SQLite 在 CI 中实际运行；openGauss、OceanBase、GoldenDB
  只有静态 SQL，没有运行时矩阵，不能算“已验证”。
- SQLite 的外键是连接级设置且默认关闭，`ddl.sql` 和 `dml.sql` 必须在同一个连接里依次执行。

## 文档入口

先读两篇公共文档，再进入要改的那套栈。

- [frontend/README.md](frontend/README.zh-CN.md)：三套前端共享的约定——路由、权限可见性、
  API 与 mock 切换、设计 token。
- [backend/README.md](backend/README.zh-CN.md)：六套后端共享的分层、响应包体、错误码与配置。
- 前端各栈：[React](frontend/react/README.zh-CN.md)、[Vue](frontend/vue/README.zh-CN.md)、
  [Angular](frontend/angular/README.zh-CN.md)。
- 后端各栈：[Spring Boot](backend/springboot/README.zh-CN.md)、
  [Go](backend/go-gin-gorm/README.zh-CN.md)、[NestJS](backend/node-nestjs/README.zh-CN.md)、
  [C#](backend/csharp/README.zh-CN.md)、[Rust](backend/rust-axum/README.zh-CN.md)、
  [FastAPI](backend/python-fastapi/README.zh-CN.md)。
- 每套栈的文档都有英文 `README.md` 和中文 `README.zh-CN.md`。

## 设计决策

- **path 即权限身份**：权限由 `type + path + action` 确定，没有单独的权限编码。页面路径
  是稳定契约，改路由名属于权限数据迁移，不是改显示。
- **菜单树由后端拥有**：`GET /api/v1/auth/menus` 返回全部启用的 `menu` 和 `directory`
  节点，同级按编码升序。前端只负责渲染与过滤，绝不用菜单树生成路由，因此菜单接口故障
  只会让侧边栏降级，不会让整个应用无路由可用。
- **业务编码决定同级顺序**：纯数字编码同时表达父编码前缀与兄弟位置，所以没有排序字段，
  也不支持运行时重排。
- **三层校验**：数据库对所有写入者保证不变量，后端把失败翻译成可读的业务错误，前端只做
  提交前预检、从不承担授权；同一条规则在三处重复是有意为之。
- **角色融合，切换只是视图**：有效权限是所有启用角色的并集加直属授权、再剔除禁用权限。
  角色切换只在前端过滤菜单与按钮，从不缩减后端授权。
- **可见性不等于授权**：目录权限只控制菜单是否显示，接口仍需匹配的 `menu` 或 `action`
  授权；权限禁用后两者同时失效。
- **注解生成文档，行为才是契约**：每个后端用自己的注解生成 `/openapi.json`；前端的
  `openapi.json` 是冻结的消费方快照。六套实现由跨栈契约测试对齐，而不是共享一份运行时
  spec 文件。

## 验证与 CI

先跑改动栈的命令（见上面的矩阵），再跑根目录检查：`pnpm run docs:check`
（本地相对链接检查）。

[.github/workflows/main.yml](.github/workflows/main.yml) 在向 `main` 提 PR、push 到
`main` 以及手动触发时运行：

- `docs`：跑 docs:check。
- `frontend-react`、`frontend-vue`、`frontend-angular`：安装、lint、类型检查（React 与
  Vue）、测试、构建；React 在 push 时额外产出 Pages 工件。
- `backend`：六个栈的测试与构建矩阵；push 时同一个 job 还会跑 SQLite 上的契约验收。
- `deploy`：只把 React 构建发布到 GitHub Pages，另外两套前端不部署。

CI 没有路径过滤，只改文档也会触发全部 job。PR 阶段不跑契约验收和 Pages 发布，
所以“PR 通过”不等于后端行为已经验证。

## 许可证与行为准则

Orange 采用 MIT 许可证，见 [LICENSE](LICENSE)。参与贡献须遵守
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 中的 Contributor Covenant。
