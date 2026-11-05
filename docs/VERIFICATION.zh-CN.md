> [English](./VERIFICATION.md) | 简体中文

# 验证

> 日期：2026-11-05
> 本页记录实际执行过的内容。此处未列出的项目只是静态审查，不构成运行时保证。

## 1. 技术栈

| 技术栈 | 构建 | 测试 | 运行时冒烟 |
| --- | --- | --- | --- |
| `backend/springboot` | `mvn compile` | 54 个测试（含 19 个 Testcontainers） | PostgreSQL、MySQL、MariaDB、SQLite：登录、菜单、CRUD、审计 |
| `backend/go-gin-gorm` | `go build ./...`、`go vet ./...` | `go test ./...` | PostgreSQL、MySQL、MariaDB、SQLite：完整 HTTP 冒烟 |
| `backend/node-nestjs` | `pnpm build` | 42 个 Jest 测试 | PostgreSQL、MySQL、MariaDB、SQLite：各 78 项 HTTP 检查 |
| `backend/csharp` | `dotnet build`（0 条警告） | 69 个 xUnit 测试 | PostgreSQL、MySQL、MariaDB、SQLite：认证、RBAC、409、审计 |
| `backend/rust-axum` | `cargo check`、`cargo build` | 40 个单元测试 | PostgreSQL、MySQL、MariaDB、SQLite：完整 CRUD 冒烟 |
| `backend/python-fastapi` | 导入 + uvicorn 启动 | 71 个 pytest 测试 | PostgreSQL、MySQL、MariaDB、SQLite：认证/CRUD/审计 |
| `frontend/react` | `pnpm build:github` | `tsc` + 43 个 Vitest 测试 | Mock E2E 14/14，真实 E2E 14/14 |
| `frontend/angular` | `npm run build` | 26 个 Vitest 测试，lint 无问题 | Mock E2E 15/15，真实 E2E 15/15 |
| `frontend/vue` | `pnpm build` | 20 个 Vitest 测试，lint 无问题 | Mock E2E 15/15，真实 E2E 15/15 |

Windows 上的 Rust：该机器没有 Visual Studio Build Tools。验证使用
`stable-x86_64-pc-windows-gnu` 配合 MSYS2 UCRT64 的 `gcc` 链接器。`sqlx`
功能增加后，链接可能耗尽 Windows 页面文件；若链接失败，用无调试信息的方式构建：

```powershell
$env:CARGO_PROFILE_TEST_DEBUG='0'
$env:RUSTFLAGS='-C link-arg=-Wl,--no-keep-memory'
cargo +stable-x86_64-pc-windows-gnu test
```

## 2. 数据库

| 引擎 | 验证 |
| --- | --- |
| PostgreSQL 16 | 每个后端：对 `orange_<stack>` 做完整冒烟 |
| MySQL 8.4 | 每个后端：对 `orange_<stack>` 做完整冒烟 |
| MariaDB 11.8 | 每个后端：对 `orange_<stack>` 做完整冒烟 |
| SQLite 3.49 | 每个后端：对独立的 SQLite 文件做完整冒烟 |
| openGauss | 静态兼容性审查；未执行 |
| OceanBase | MySQL 兼容脚本；未执行 |
| GoldenDB | MySQL 兼容脚本；未执行 |

每个技术栈的权威结果见 `docs/DB-MATRIX.md`。在 PostgreSQL、MySQL、MariaDB
和 SQLite 上校验了种子数据的一致性：7 个分组、48 项权限、67 条角色授权。

## 3. 契约与授权

- `docs/API.md` 是规范契约；`contracts/openapi.json` 是机器可读的快照。
- 全部五个非 Java 后端都实现了 34 个规范端点，并省略了已废弃的旧路由。
- `ControllerAuthorityCoverageTest` 保证 `@PreAuthorize` 的权限标识与 `permissions.json` 保持一致。
- 每个前端都将访问令牌保存在内存中，并通过 HttpOnly 刷新 Cookie 恢复会话。

### 3.1 跨栈契约验收

`scripts/ci/contract-test.mjs` 在全新的 SQLite 数据库上执行完整 API 契约，
每个后端单轮 **327 项断言**。

| 后端 | 结果 | 重点覆盖 |
| --- | --- | --- |
| Spring Boot | 327/327 | 响应信封 + `X-Trace-Id` 头、刷新令牌轮换、强制改密、全部 CRUD、RBAC、操作日志、CORS |
| Go | 327/327 | 同一套用例 |
| NestJS | 327/327 | 同一套用例 |
| C# | 327/327 | 同一套用例 |
| Rust | 327/327 | 同一套用例 |
| FastAPI | 327/327 | 同一套用例 |

运行全部六栈：`node scripts/ci/run-contract.mjs`（使用 `18080` 端口，每栈一个临时
SQLite 文件）。CI 的 `backend` 矩阵会在推送时执行同一脚本。

本轮发现并修复的不一致：

- Go、NestJS、Rust、Spring Boot 的请求体校验返回 `40001`；现在统一为 `40002`，
  与 FastAPI、C# 一致。
- Spring Boot 只在响应体里放 traceId，且响应头是 `X-Request-Id`；现在同时返回
  文档要求的 `X-Trace-Id`，成功响应也写入 traceId。
- 停用仍有启用子组织的父组织时，Vue、NestJS、C#、Spring Boot 返回 `40002`；
  现在六栈统一为 `40901`（冲突），与 Mock 一致。
- Rust 的 LIKE 过滤没有声明 `ESCAPE '\'`，导致包含 `_` 的用户名/角色编码在
  SQLite/PostgreSQL 上无法被 `keyword`/`id` 过滤命中。

## 4. CI 与部署

`.github/workflows/main.yml` 在推送到 `main` 和针对 `main` 的 PR 上运行：

- `frontend-react`、`frontend-angular`、`frontend-vue`：lint、类型检查、测试、构建。
- `backend` 矩阵（`spring`、`go`、`nest`、`csharp`、`rust`、`fastapi`）：各栈测试与
  构建；推送时再通过 `scripts/ci/run-db-matrix.mjs` 对 PostgreSQL、MySQL、MariaDB、
  SQLite 各跑一遍 HTTP 冒烟，然后用 `scripts/ci/run-contract.mjs` 在 SQLite 上执行
  完整契约验收。
- PR 跳过四数据库矩阵以加快反馈，单元测试仍会执行。
- 只有 React job 通过后才会把 `frontend/react/dist` 上传到 GitHub Pages。

Angular 和 Vue 已验证但不部署。后端托管不在该 workflow 内；GitHub Pages
不能运行服务端进程。

## 5. 前端 Mock 端到端

日期：2026-11-05。使用 Playwright 驱动三个开启 Mock 的开发服务器。

| 应用 | 检查项 | 结果 |
| --- | --- | --- |
| React | 14 | 14 通过 |
| Vue | 15 | 15 通过 |
| Angular | 15 | 15 通过 |

每轮覆盖：登录、刷新后恢复会话、菜单导航、用户搜索、全部系统页面、组织新增/删除、
状态开关及停用被拒后的回滚、权限动作校验、中英文切换、退出登录与受保护路由跳转、
受限角色跳转、强制修改密码。

脚本位于 `scripts/e2e/`（`mock-react.mjs`、`mock-vue.mjs`、`mock-angular.mjs`）。

## 6. 前端真实端到端

日期：2026-11-05。关闭 Mock，开发服务器代理把 `/api/v1` 转发到真实后端。

| 后端 | 数据库 | React | Vue | Angular |
| --- | --- | --- | --- | --- |
| FastAPI | PostgreSQL | 14/14 | 15/15 | 15/15 |
| Spring Boot | MySQL | 14/14 | 15/15 | 15/15 |
| Go | SQLite | 14/14 | 15/15 | 15/15 |

每轮覆盖：数据库账号登录、刷新后恢复会话、菜单导航、用户搜索、角色/权限/组织页面、
组织新增/状态/删除、这些写操作产生的真实操作日志、权限动作校验、中英文切换、
退出登录与受保护路由跳转、受限角色跳转。

2026-11-05 在 UI 对齐后复跑 FastAPI + PostgreSQL：React 14/14、Vue 15/15、
Angular 15/15。

脚本：`scripts/e2e/real-react.mjs`、`real-vue.mjs`、`real-angular.mjs`；
通过 `E2E_BACKEND`、`E2E_DB` 标记本轮组合。

本轮发现并修复：

- Vue/Angular 菜单标题直接使用后端返回的名称，而后端只返回中文；现在和 React
  一样按路径从共享权限目录取当前语言名称。
- Angular 操作日志把空的 `from`/`to` 筛选参数也发给后端，真实后端返回 400；
  现在只发送非空条件。
- Spring Boot 的 CORS 默认只允许 `localhost:5173`；现在与其他栈一致，允许
  5173、5174、4200。

## 7. 三端 UI 对齐

React 是三端视觉基准。三个前端的系统管理页现在使用同一套外壳：

- 去掉页面标题和筛选卡片；筛选、操作和列显隐菜单放在同一行工具栏；
- 页面高度锁定在 4rem 顶栏下方，只有表格主体滚动；
- 单个带边框表格，表头 40px 且吸顶，行高 40px，单元格使用纯文本；
- 底部左侧显示已选数量，右侧显示 `当前页 / 总页数` 与上一页/下一页；
- 状态开关 32×18，控件圆角 8px，表格字号 14px。

React 本轮修复：

- 用户/角色/权限/组织页的工具栏不再跟着页面滚动；
- 列选择器移入工具栏同一行；
- 权限/组织分页按展开后的可见行计数，展开节点后可出现更多页；
- 操作日志改为一个成对的日期时间范围控件，默认查询当天 00:00–23:59。

Vue 和 Angular 的列集合、状态渲染和底部分页已与 React 对齐。外壳也已对齐：

- 顶栏 4rem、侧栏 256px、60px 圆形品牌头像、32px 菜单行且间距 4px；
  子菜单行 32px、14px 字号、30px 缩进并带左侧竖线；默认浅色主题下选中菜单
  背景清晰可见；
- 24px 圆形颜色按钮与 4×2 调色板、32×18 主题开关、24px 语言按钮、GitHub
  控件；语言菜单行高 32px，并在当前语言旁显示勾选；
- 三端菜单路径与路由一致；Vue 使用 MDI outline 图标，Angular 使用 Material
  outlined 字体，与 React 的 lucide 线框图标一致；
- 组织与权限选择在三端均为树形下拉；Angular 使用 fixed 定位，避免对话框裁剪。

仍存在的差异：Angular 使用单月 Material 范围日历，而 React 使用双月日历。

## 8. 已知未验证项

- openGauss、OceanBase 和 GoldenDB 未启动；其脚本需要在目标版本上做冒烟测试。
- Rust 项目没有已提交的数据库集成测试，只有可复现的冒烟脚本
  （`backend/rust-axum/scripts/smoke-databases.ps1`）。
- Angular 的 Cesium 从 Cesium CDN 加载运行时资源；离线时回退为静态地球。
- Angular/Vue 的演示页面针对仅限 React 的库（Recharts、AntV G2、L7）使用了适合各自框架的替代方案。
- 三个 Mock E2E 脚本尚未纳入 CI。
- 真实浏览器端到端已跑 FastAPI+PostgreSQL、Spring+MySQL、Go+SQLite；其余后端/数据库
  组合由各栈 HTTP 冒烟和 CI 数据库矩阵覆盖，未跑浏览器。

## 9. 重新运行

```bash
# Java
cd backend/springboot && mvn test

# Go
cd backend/go-gin-gorm && go build ./... && go vet ./... && go test ./...

# NestJS
cd backend/node-nestjs && pnpm build && pnpm test

# C#
cd backend/csharp && dotnet build && dotnet test

# Rust
cd backend/rust-axum && cargo test

# FastAPI
cd backend/python-fastapi && .venv/Scripts/python -m pytest

# React
cd frontend/react && pnpm typecheck && pnpm test && pnpm build

# Angular
cd frontend/angular && npm test -- --watch=false && npm run lint && npm run build

# Vue
cd frontend/vue && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
