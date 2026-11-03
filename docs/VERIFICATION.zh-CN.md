> [English](./VERIFICATION.md) | 简体中文

# 验证

> 日期：2026-11-03
> 本页记录实际执行过的内容。此处未列出的项目只是静态审查，不构成运行时保证。

## 1. 技术栈

| 技术栈 | 构建 | 测试 | 运行时冒烟 |
| --- | --- | --- | --- |
| `backend/springboot` | `mvn compile` | 27 个单元测试 + 19 个 Testcontainers 集成测试 | 通过 Testcontainers 使用 PostgreSQL 16 |
| `backend/go-gin-gorm` | `go build ./...`、`go vet ./...` | `go test ./...`（domain/auth/http） | PostgreSQL 16：登录、40302、CRUD、409、守卫、审计 |
| `backend/node-nestjs` | `pnpm build` | 25 个 Jest 测试 | PostgreSQL 16：78 项 HTTP 检查 |
| `backend/csharp` | `dotnet build`（0 条警告） | 69 个 xUnit 测试 | PostgreSQL 16：认证、RBAC、409、审计 |
| `backend/rust-axum` | `cargo check`、`cargo build` | 40 个单元测试 | PostgreSQL 16：登录、user-info、6 个菜单根节点、用户 |
| `backend/python-fastapi` | 导入 + uvicorn 启动 | 67 个 pytest 测试 | PostgreSQL 16：完整的认证/CRUD/审计流程 |
| `frontend/react` | `pnpm build` | `tsc` + 40 个 Vitest 测试 | 已部署的构建；mock 与真实 API |
| `frontend/angular` | `npm run build` | 19 个 Vitest 测试，lint 无问题 | Playwright：所有路由，0 条控制台错误 |
| `frontend/vue` | `pnpm build` | 20 个 Vitest 测试，lint 无问题 | Playwright：全部 33 条路由、CRUD、强制修改密码 |

Windows 上的 Rust：该机器没有 Visual Studio Build Tools。验证使用
`stable-x86_64-pc-windows-gnu` 配合 MSYS2 UCRT64 的 `gcc` 链接器。在 Linux CI 上，
默认的 stable 工具链无需此变通即可构建。

## 2. 数据库

| 引擎 | 验证 |
| --- | --- |
| PostgreSQL 16 | 集成测试以及每个后端的冒烟测试 |
| MySQL 8.4 | Docker：加载 `ddl.sql` + `dml.sql`，约束探测，种子数据计数 |
| MariaDB 11.8 | Docker：与 MySQL 相同的检查 |
| SQLite 3.49 | Python `sqlite3`：加载、种子数据计数、约束接受/拒绝矩阵 |
| openGauss | 对照 6.0 文档的静态兼容性审查；未执行 |
| OceanBase | MySQL 兼容脚本；未执行 |
| GoldenDB | MySQL 兼容脚本；未执行 |

在 PostgreSQL、MySQL、MariaDB 和 SQLite 上校验了种子数据的一致性：7 个分组、48
项权限、67 条角色授权。

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

## 5. 已知未验证项

- openGauss、OceanBase 和 GoldenDB 未启动；其脚本需要在目标版本上做冒烟测试。
- Rust 项目没有已提交的数据库集成测试，只有一次手动冒烟运行。
- Angular 的 Cesium 从 Cesium CDN 加载运行时资源；离线时回退为静态地球。
- Angular/Vue 的演示页面针对仅限 React 的库（Recharts、AntV G2、L7）使用了适合各自框架的替代方案。
- 浏览器冒烟测试为手动执行，未纳入 CI。

## 6. 重新运行

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
