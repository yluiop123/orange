> [English](./VERIFICATION.md) | 简体中文

# 验证

> 日期：2026-11-04
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
| `frontend/react` | `pnpm build:github` | `tsc` + 43 个 Vitest 测试 | 已部署的构建；Mock E2E 14/14 |
| `frontend/angular` | `npm run build` | 26 个 Vitest 测试，lint 无问题 | Mock E2E 15/15 |
| `frontend/vue` | `pnpm build` | 20 个 Vitest 测试，lint 无问题 | Mock E2E 15/15 |

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

## 4. CI 与部署

- `.github/workflows/main.yml` 编译并测试 Spring Boot 后端。
- 同一 workflow 对 `frontend/react` 执行 lint、类型检查、测试和构建。
- 仅 `frontend/react/dist` 会被上传到 GitHub Pages。
- Angular 和 Vue 未部署，且尚未纳入 CI workflow。

## 5. 前端 Mock 端到端

日期：2026-11-04。使用 Playwright 驱动三个开启 Mock 的开发服务器。

| 应用 | 检查项 | 结果 |
| --- | --- | --- |
| React | 14 | 14 通过 |
| Vue | 15 | 15 通过 |
| Angular | 15 | 15 通过 |

每轮覆盖：登录、刷新后恢复会话、菜单导航、用户搜索、全部系统页面、组织新增/删除、
状态开关及停用被拒后的回滚、权限动作校验、中英文切换、退出登录与受保护路由跳转、
受限角色跳转、强制修改密码。

脚本位于 `scripts/e2e/`（`mock-react.mjs`、`mock-vue.mjs`、`mock-angular.mjs`）。

## 6. 已知未验证项

- openGauss、OceanBase 和 GoldenDB 未启动；其脚本需要在目标版本上做冒烟测试。
- Rust 项目没有已提交的数据库集成测试，只有可复现的冒烟脚本
  （`backend/rust-axum/scripts/smoke-databases.ps1`）。
- Angular 的 Cesium 从 Cesium CDN 加载运行时资源；离线时回退为静态地球。
- Angular/Vue 的演示页面针对仅限 React 的库（Recharts、AntV G2、L7）使用了适合各自框架的替代方案。
- 三个 Mock E2E 脚本尚未纳入 CI。
- 真实后端端到端（前端 → 后端 → 数据库）尚未执行，计划记录在
  `.scratch/2026-11-04-real-e2e.md`。

## 7. 重新运行

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
