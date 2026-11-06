> [English](./README.md) | 简体中文

# 后端文档

六个后端实现的代码设计与运维文档。接口契约、数据库设计和技术栈矩阵与技术栈无关，
位于 [`../../docs/`](../../docs/README.zh-CN.md)；本目录只描述 `backend/` 下的代码。

## 文档

| 文档 | 内容 |
| --- | --- |
| [GETTING-STARTED.zh-CN.md](./GETTING-STARTED.zh-CN.md) | 端口、环境要求、数据库初始化、启动与测试 |
| [CONFIGURATION.zh-CN.md](./CONFIGURATION.zh-CN.md) | 共享配置、生成的本地文件、JWT 与 Cookie |
| [ARCHITECTURE.zh-CN.md](./ARCHITECTURE.zh-CN.md) | 分层模型、响应封装、认证、RBAC、数据库可移植性 |

## 六个技术栈

| 技术栈 | 目录 | 默认端口 | 状态 |
| --- | --- | --- | --- |
| Java 25 + Spring Boot | [`../springboot`](../springboot/README.md) | 8080 | 基准实现 |
| Go + Gin + GORM | [`../go-gin-gorm`](../go-gin-gorm/README.md) | 8081 | 已实现 |
| C# + ASP.NET Core | [`../csharp`](../csharp/README.md) | 8082 | 已实现 |
| Rust + Axum | [`../rust-axum`](../rust-axum/README.md) | 8083 | 已实现 |
| Node.js + NestJS | [`../node-nestjs`](../node-nestjs/README.md) | 3000 | 已实现 |
| Python + FastAPI | [`../python-fastapi`](../python-fastapi/README.md) | 8000 | 已实现 |

六个实现都提供相同的 `/api/v1` 契约。实现之间出现分歧时，以 Spring Boot 的行为为准。

## 契约与数据

数据库设计是**公共的**，与技术栈无关。表结构、种子数据和模型说明属于仓库根目录；
后端文档只说明如何选择数据库以及如何启动各技术栈。

| 来源 | 用途 |
| --- | --- |
| [`../../docs/API.zh-CN.md`](../../docs/API.zh-CN.md) | 人类可读契约 |
| [`../../contracts/openapi.json`](../../contracts/openapi.json) | 机器可读契约 |
| [`../../database/<engine>/ddl.sql`](../../database) | 规范表结构 |
| [`../../database/<engine>/dml.sql`](../../database) | 规范种子数据 |
| [`../../docs/validation-rules.md`](../../docs/validation-rules.md) | 校验分层 |

后端不维护自己的迁移或引擎专属表结构副本。表结构变更只在 `database/<engine>` 修改一次，
所有技术栈都必须继续兼容。

## 测试矩阵

- 各技术栈的单元测试（见各自 README）。
- `scripts/test-databases.ps1` 对 PostgreSQL、MySQL、MariaDB、SQLite 运行真实矩阵。
- `scripts/sync-permission-seed.mjs` 保持种子数据与 React 权限常量同步。
- 每个技术栈都应通过 [VERIFICATION.zh-CN.md](../../docs/VERIFICATION.zh-CN.md) 中记录的
  327 项接口契约检查。

openGauss、OceanBase、GoldenDB 保持 `static`：SQL 继续维护，但本地没有可用于矩阵测试的实例。
