[English](README.md) | 简体中文

# Orange

Orange 是一个以权限为核心的通用管理后台，同时作为“以行为为准”的跨技术栈参考：
同一套产品由三个前端（React、Vue、Angular）和六个后端（Spring Boot、Go、NestJS、
ASP.NET Core、Rust、FastAPI）实现，共用一份 HTTP 契约和一套数据模型，并提供七种
数据库方言的 SQL。

| 仪表盘 | 表单 |
| --- | --- |
| ![仪表盘](readme/images/dashboard-zh-CN.png) | ![表单](readme/images/form-zh-CN.png) |
| ![图表](readme/images/rechart-zh-CN.png) | ![地图](readme/images/disaster-command-zh-CN.png) |

## 功能

- **认证**：用户名/密码登录、短时效访问令牌、轮换的 HttpOnly refresh Cookie、
  登出、首次登录强制改密，以及基于数据库的登录锁定。
- **授权**：用户、角色、组织、权限四种资源，以及直属授权、角色融合和仅作用于前端
  视图的角色切换。
- **系统管理**：四种资源的 CRUD、按业务编码排序的树、菜单国际化，以及只读操作日志。
- **演示页面**：仪表盘、图表、地图、3D 场景和组件画廊；它们只用于展示布局与设计
  系统，不新增后端接口。
- **种子角色**：`super`（全部权限）、`admin`（不含 `super` 的系统管理）和
  `user`（只读演示页）。演示账号的密码与用户名相同。

## 架构与目录

运行时没有任何共享代码：前端之间不互相 import，后端之间也不共用包。共享的是可验证的
事实——前端冻结的接口快照 [frontend/openapi.json](frontend/openapi.json) 和
[database/](database/) 中的数据模型。

| 目录 | 作用 |
| --- | --- |
| [frontend/](frontend/README.zh-CN.md) | 前端共同约定与三套 SPA 实现 |
| [backend/](backend/README.zh-CN.md) | 后端共同约定与六套 API 实现 |
| [database/](database/README.zh-CN.md) | 表结构、种子数据和七种 SQL 方言 |
| [readme/images/](readme/images/) | 本 README 使用的截图 |
| [.github/workflows/main.yml](.github/workflows/main.yml) | CI：前端/后端矩阵与 GitHub Pages 部署 |

## 支持的技术栈

| 服务 | 技术栈 | 端口 | 启动命令 | 文档 |
| --- | --- | --- | --- | --- |
| 前端 | React 19 + Vite + shadcn/Base UI | 5173 | `pnpm dev` | [frontend/react](frontend/react/README.zh-CN.md) |
| 前端 | Vue 3 + Vuetify 3 + Vite | 5174 | `pnpm dev` | [frontend/vue](frontend/vue/README.zh-CN.md) |
| 前端 | Angular 21 + Material | 4200 | `pnpm start` | [frontend/angular](frontend/angular/README.zh-CN.md) |
| 后端 | Spring Boot 4 / Java 25 | 8080 | `mvn spring-boot:run` | [backend/springboot](backend/springboot/README.zh-CN.md) |
| 后端 | Go + Gin + GORM | 8081 | `go run ./cmd/server` | [backend/go-gin-gorm](backend/go-gin-gorm/README.zh-CN.md) |
| 后端 | NestJS 11 | 3000 | `pnpm start:dev` | [backend/node-nestjs](backend/node-nestjs/README.zh-CN.md) |
| 后端 | ASP.NET Core / .NET 10 | 8082 | `dotnet run --project src/Orange.Api` | [backend/csharp](backend/csharp/README.zh-CN.md) |
| 后端 | Rust + Axum | 8083 | `cargo run` | [backend/rust-axum](backend/rust-axum/README.zh-CN.md) |
| 后端 | Python + FastAPI | 8000 | `python -m app.main` | [backend/python-fastapi](backend/python-fastapi/README.zh-CN.md) |

运行时数据库：PostgreSQL（基线）、MySQL、MariaDB、SQLite。openGauss、OceanBase、
GoldenDB 只提供静态 SQL。详见 [database/](database/README.zh-CN.md)。

后端端口读取 `APP_PORT`，未设置时回退 `PORT`；Spring Boot 只读 `APP_PORT`。每套栈
各自维护锁文件或依赖清单。

## 环境要求

| 工具 | 本项目使用的版本 |
| --- | --- |
| Node.js | 20.19+ 或 22.12+（CI 使用当前 LTS） |
| pnpm | 12.15.0（各 Node 项目的 `packageManager`） |
| Java | 25（Spring Boot） |
| Go | 1.23+ |
| .NET | 10 |
| Rust | 1.75+ |
| Python | 3.13+ |

## 快速开始

从干净检出开始，用 React + FastAPI + SQLite 跑通：

```bash
# 终端 1：数据库与后端
cd backend/python-fastapi
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
sqlite3 orange.db < ../../database/sqlite/ddl.sql
sqlite3 orange.db < ../../database/sqlite/dml.sql
export DB_DRIVER=sqlite DB_NAME=orange.db           # Windows: $env:DB_DRIVER="sqlite"; $env:DB_NAME="orange.db"
python -m app.main                                  # http://127.0.0.1:8000
```

```bash
# 终端 2：前端
cd frontend/react
pnpm install
VITE_MOCK_ENABLE=false VITE_PROXY_TARGET=http://127.0.0.1:8000 pnpm dev
# http://127.0.0.1:5173
```

种子账号：`super` / `super`、`admin` / `admin`、`user` / `user`。

启动顺序是数据库 → 后端 → 前端。前端也可以单独启动：开发模式默认启用浏览器内
Mock，不需要后端即可浏览演示页面。

JWT 密钥不入库。把开发密钥对生成到 `backend/keys/`，并将 `JWT_PRIVATE_KEY` /
`JWT_PUBLIC_KEY` 指向它即可使用 RS256；未配置时后端回退到 `JWT_SECRET` 的 HS256。
OpenSSL 命令与变量优先级见[后端配置](backend/README.zh-CN.md#jwt-密钥)。

## 常用配置

| 配置项 | 默认值 | 修改位置 |
| --- | --- | --- |
| 前端端口 | React 5173、Vue 5174、Angular 4200 | `frontend/*/vite.config.ts`、`frontend/angular/angular.json` |
| 后端端口 | Spring 8080、Go 8081、NestJS 3000、ASP.NET Core 8082、Rust 8083、FastAPI 8000 | 各后端 `APP_PORT` / `PORT` |
| API 前缀 | `/api/v1` | 前端环境文件与 Angular `environment.*.ts`；后端全局前缀 |
| 开发代理目标 | `http://127.0.0.1:8080` | `vite.config.ts`、`frontend/angular/proxy.conf.json` |
| Mock | 开发模式开启 | `VITE_MOCK_ENABLE`、Angular `environment.local.ts` |
| 数据库 | PostgreSQL | `DB_DRIVER`、`DATABASE_URL` 与离散的 `DB_*` 变量 |
| JWT | 默认 `JWT_SECRET` 的 HS256；同时配置 RSA 密钥对时用 RS256 | 环境变量 |

完整的变量、优先级和各栈配置文件见 [backend/README.zh-CN.md](backend/README.zh-CN.md)
与 [frontend/README.zh-CN.md](frontend/README.zh-CN.md)。

## 文档入口

- [前端总览](frontend/README.zh-CN.md)：共同的 API、认证、权限、UI 与 Mock 约定，
  以及 React、Vue、Angular 的入口。
- [后端总览](backend/README.zh-CN.md)：统一响应、错误码、认证、配置与切库说明，
  以及六套实现的入口。
- [数据库](database/README.zh-CN.md)：表结构、初始化顺序与方言差异。

## 验证与 CI

改动哪套栈就运行哪套栈的命令。CI 对 React/Vue/Angular 运行 lint、类型检查、测试和
构建，对六个后端运行测试与构建矩阵。PR 阶段不部署；CI 不启动运行中的后端，也不启动
数据库服务。

## 许可证与行为准则

Orange 使用 MIT 许可证，见 [LICENSE](LICENSE)。
