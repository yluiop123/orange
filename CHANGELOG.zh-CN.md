# 变更记录

## 未发布

### 变更

- 配置改为按技术栈独立维护。删除根目录 `config/` 与
  `scripts/sync-config.mjs`；前端/后端各自提供并说明示例配置
  （`frontend/<stack>/.env*`、`backend/<stack>/.env.example`、
  `application-local.example.yaml`）。
- 文档拆分为与技术栈无关的 `docs/`、`frontend/docs/` 和 `backend/docs/`。
  数据库设计只在 `docs/DATABASE.zh-CN.md` 中描述一次。
- 统一 React、Vue、Angular 的登录页、页签样式和深色背景 token。
  Vue/Angular 的页签内容移植仍在进行中。
- 每个后端都补充了中文 README（`README.zh-CN.md`）。

## 1.0.0 — 2026-11-04

首个全仓库功能对等版本。

### 新增

- 六套后端实现同一份 34 接口契约：Spring Boot、Go/Gin/GORM、NestJS、ASP.NET Core、
  Rust/Axum、FastAPI。
- 三个前端实现同一批 33 条路由：React、Angular、Vue。
- 七套数据库脚本：PostgreSQL、MySQL、MariaDB、SQLite、openGauss、OceanBase、GoldenDB。
- 配置单一来源：`config/app.example.env` + `scripts/sync-config.mjs`。
- 三端 Mock 模式，覆盖登录、菜单、CRUD、操作日志和错误处理。
- Mock 与真实后端的 Playwright 脚本（`scripts/e2e/`）。
- 全前端、全后端 CI 矩阵；每个后端在 PostgreSQL/MySQL/MariaDB/SQLite 上跑同一套
  HTTP 冒烟（`scripts/ci/`）。

### 变更

- 所有后端统一环境变量名（`APP_PORT`、`DB_*`、`JWT_*`、`CORS_ORIGINS`、
  `LOG_RETENTION_DAYS`）。
- React 固定使用 `HashRouter`，删除 `VITE_ROUTE`。
- Angular/Vue 菜单标题改为前端按路径翻译，与 React 一致。
- Spring Boot CORS 默认允许 `localhost:5173`、`5174`、`4200`，与其他栈一致。

### 修复

- React：运行态 40302 强制改密、角色切换跳转、权限类型校验、Mock 守卫、
  弹窗重置丢失未修改字段。
- Angular：Mock 模式、403 弹窗、语言刷新、自禁用、令牌预刷新、权限动作错误展示、
  操作日志空筛选参数。
- Vue：状态开关写入失败回滚。
- Rust：SQLx 查询改为兼容 PostgreSQL/MySQL/MariaDB/SQLite。

### 验证

- 六后端 × PostgreSQL/MySQL/MariaDB/SQLite：全部通过。
- Mock E2E：React 14/14、Vue 15/15、Angular 15/15。
- 真实 E2E：FastAPI+PostgreSQL、Spring+MySQL、Go+SQLite，三端均 14/15/15。
- openGauss、OceanBase、GoldenDB 仍为静态兼容目标，未使用实例。
