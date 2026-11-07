# ORANGE

[![CI](https://github.com/yluiop123/orange/actions/workflows/main.yml/badge.svg)](https://github.com/yluiop123/orange/actions/workflows/main.yml)

<img height="80" src="./readme/images/orange.png">

ORANGE 是一个全栈权限管理演示项目。同一个产品实现了三个前端（React、Vue、
Angular）、六个后端（Spring Boot、Go、NestJS、C#、Rust、FastAPI），并支持多种
数据库引擎。所有技术栈提供相同的 API 契约和相同的外壳：登录、RBAC 菜单树、
仪表盘、图表、地图、三维场景、组件库和系统管理。

项目地址：https://yluiop123.github.io/orange

[English](./README.md) | 简体中文

<img height="500" src="./readme/images/dashboard-zh-CN.png">
<img height="500" src="./readme/images/disaster-command-zh-CN.png">
<img height="500" src="./readme/images/form-zh-CN.png">
<img height="500" src="./readme/images/rechart-zh-CN.png">

## 包含内容

- **认证**：JWT access token、轮换的 HttpOnly refresh cookie、登录限流、
  首次登录强制修改密码。
- **RBAC**：基于路径的菜单与权限树，用户、角色、用户组、权限和操作日志。
- **演示页面**：6 个仪表盘，ECharts/Recharts/AntV/D3 图表，Leaflet/
  OpenLayers/deck.gl/Cesium 地图，Three.js/Babylon.js 三维场景，以及
  shadcn 组件库。
- **两种数据模式**：浏览器内 Mock 用于演示；通过开发代理连接真实后端。
- **一致性**：React 是页面内容基准；Vue 和 Angular 对齐其路由、菜单树、图标、
  主题变量和页签样式。

## 目录结构

```text
.
├── frontend/                 # 前端实现，一个框架一个目录
│   ├── react/                # React 19 + Vite + shadcn/Base UI（部署到 Pages）
│   ├── angular/              # Angular 21 + Angular Material
│   ├── vue/                  # Vue 3 + Vuetify
│   └── docs/                 # 前端启动、配置、架构文档
├── backend/                  # 后端实现，一个技术栈一个目录
│   ├── springboot/           # Java 25 + Spring Boot（行为基准）
│   ├── go-gin-gorm/          # Go + Gin + GORM
│   ├── node-nestjs/          # Node.js + NestJS
│   ├── csharp/               # C# + ASP.NET Core
│   ├── rust-axum/            # Rust + Axum
│   ├── python-fastapi/       # Python + FastAPI
│   └── docs/                 # 后端启动、配置、架构文档
├── database/                 # DDL 与种子数据，一个引擎一个目录
│   ├── postgres/ mysql/ mariadb/ sqlite/
│   └── opengauss/ oceanbase/ goldendb/
├── contracts/                # 跨栈契约
│   └── openapi.json          # 机器可读 API 契约
├── docs/                     # 与技术栈无关的公共文档
│   ├── README.md             # 文档地图与阅读路径
│   ├── FEATURES.md API.md DATABASE.md STACKS.md
│   ├── validation-rules.md VERIFICATION.md PORTING.md
│   ├── adr/ security/ agents/
└── scripts/                  # 跨栈脚本（种子同步、E2E、JWT 密钥）
```

目录规则：

- `docs/`、`contracts/`、`database/` 和根目录 README 与技术栈无关。
- 前端专项设计在 `frontend/docs/`；后端专项设计在 `backend/docs/`。
- 配置跟随代码：`frontend/<stack>/.env*`、
  `frontend/angular/src/environments/`、`backend/<stack>/.env.example` /
  `application-local.example.yaml`。
- `database/<engine>` 只放 DDL 和种子数据；运行时连接配置属于各后端。
- 只有 `frontend/react` 部署到 GitHub Pages。

## 技术栈矩阵

### 前端

| 技术栈 | 目录 | 端口 | 说明 |
| --- | --- | --- | --- |
| React 19 + Vite 8 + shadcn/Base UI | `frontend/react` | 5173 | 基准实现，部署到 Pages |
| Vue 3.5 + Vuetify 3 | `frontend/vue` | 5174 | 20 个单元测试 |
| Angular 21 + Angular Material | `frontend/angular` | 4200 | 26 个单元测试 |

### 后端

| 技术栈 | 目录 | 端口 | 数据库支持 |
| --- | --- | --- | --- |
| Java 25 + Spring Boot | `backend/springboot` | 8080 | PostgreSQL、MySQL、MariaDB、SQLite |
| Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | PostgreSQL、MySQL、MariaDB、SQLite |
| C# + ASP.NET Core | `backend/csharp` | 8082 | PostgreSQL、MySQL、MariaDB、SQLite |
| Rust + Axum | `backend/rust-axum` | 8083 | PostgreSQL、MySQL、MariaDB、SQLite |
| Node.js + NestJS | `backend/node-nestjs` | 3000 | PostgreSQL、MySQL、MariaDB、SQLite |
| Python + FastAPI | `backend/python-fastapi` | 8000 | PostgreSQL、MySQL、MariaDB、SQLite |

### 数据库

| 引擎 | 目录 | 运行时矩阵 |
| --- | --- | --- |
| PostgreSQL | `database/postgres` | 已测试 |
| MySQL | `database/mysql` | 已测试 |
| MariaDB | `database/mariadb` | 已测试 |
| SQLite | `database/sqlite` | 已测试 |
| openGauss / OceanBase / GoldenDB | `database/<engine>` | 仅静态 SQL |

数据库设计是公共的、与引擎无关的：见
[docs/DATABASE.md](./docs/DATABASE.md)。

## 文档

完整文档地图见 [docs/README.md](./docs/README.md)，包含新人、前端、后端、Agent 四条阅读路径。

- **产品与运行**：[docs/FEATURES.md](./docs/FEATURES.md)、[docs/STACKS.md](./docs/STACKS.md)
- **前端**：[frontend/docs/README.md](./frontend/docs/README.md)、[frontend/docs/CONFIGURATION.zh-CN.md](./frontend/docs/CONFIGURATION.zh-CN.md)
- **后端 / API**：[backend/docs/README.md](./backend/docs/README.md)、[docs/API.md](./docs/API.md)、[docs/DATABASE.md](./docs/DATABASE.md)
- **领域词汇**：[CONTEXT.md](./CONTEXT.md)
- **历史快照**：[.scratch/archive/](./.scratch/archive/)

深入文档以英文为主；中文保留本 README 以及前/后端的 `GETTING-STARTED`、`CONFIGURATION`。

## 快速开始（React + Spring Boot + PostgreSQL）

```bash
# 1. 数据库
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql

# 2. 后端配置
cp backend/springboot/src/main/resources/application-local.example.yaml \
   backend/springboot/src/main/resources/application-local.yaml
# 如果 PostgreSQL 不在 localhost:5432，修改 datasource

# 3. 启动后端
cd backend/springboot
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# 4. 启动前端
cd frontend/react
pnpm install
pnpm dev            # http://localhost:5173
```

使用 `super / super`、`admin / admin` 或 `user / user` 登录。

其他技术栈见
[frontend/docs/GETTING-STARTED.zh-CN.md](./frontend/docs/GETTING-STARTED.zh-CN.md)
和
[backend/docs/GETTING-STARTED.zh-CN.md](./backend/docs/GETTING-STARTED.zh-CN.md)。

## 🧾 License

[MIT 协议](./LICENSE)
