> [English](./ARCHITECTURE.md) | 简体中文

# 后端架构

## 形态

同一个 API 的六个实现。它们不共享代码，只共享契约、表结构和种子数据。
Spring Boot 是行为基准。

```text
backend/
  springboot/     Java 25 + Spring Boot 4   :8080  基准
  go-gin-gorm/    Go + Gin + GORM           :8081
  csharp/         .NET 10 + EF Core         :8082
  rust-axum/      Rust + Axum + SQLx        :8083
  node-nestjs/    Node.js + NestJS 11       :3000
  python-fastapi/ Python 3.13 + FastAPI     :8000
  docs/           本文档
```

## 分层

无论框架如何命名，每个技术栈都遵循相同的四层：

| 层 | 职责 |
| --- | --- |
| HTTP 适配 | 路由、状态码、响应头、请求解析 |
| 校验 | DTO/请求规则；结构约束与 `database/<engine>/ddl.sql` 一致 |
| 服务 | 业务规则：RBAC、树码、密码策略、登录限流、操作日志 |
| 仓储 | ORM 或 SQL 访问；不做业务判断 |

跨层规则见 [`../../docs/validation-rules.md`](../../docs/validation-rules.md)。
规范约束在 DDL 中；DTO 不能另造一套冲突的规则。

## 响应封装

所有响应（包括错误）统一为：

```json
{ "code": 0, "message": "ok", "data": {}, "timestamp": "...", "traceId": "..." }
```

`X-Trace-Id` 接受客户端传入，缺省时生成，并在响应体和响应头中回传。
分页、错误码和认证头定义见 [`../../docs/API.zh-CN.md`](../../docs/API.zh-CN.md)。

## 认证与 RBAC

1. `POST /auth/login` 校验密码并返回 access JWT。
2. Refresh token 轮换后写入 HttpOnly cookie，作用域限制在认证路径。
3. `POST /auth/refresh` 轮换 token；并发请求不能同时签发两个有效 refresh token。
4. `POST /auth/logout` 撤销 access token 并清除 cookie。
5. `GET /auth/menus` 返回已按用户授权路径过滤的菜单树。

RBAC 基于路径：菜单路径就是权限标识。角色授予路径，用户组组织用户与角色，
最终菜单是菜单树与授权路径的交集。树顺序与树码遵循仓库统一的 `TreeCodePolicy`
（`docs/adr/0001`、`0002`、`0003`）。

登录限流、强制修改初始密码（`40302`）、操作日志和 `403` 消息契约属于共享行为，
不是某个技术栈的专属功能。

## 数据库可移植性

- `database/<engine>/ddl.sql` 与 `dml.sql` 是唯一的表结构和种子来源。
- 任何技术栈都不在启动时建表或执行迁移。
- 通过驱动开关选择 PostgreSQL、MySQL、MariaDB 或 SQLite；不同引擎的 SQL 不通用。
- openGauss、OceanBase、GoldenDB 只维护静态 SQL，因为本地没有可用于真实矩阵的实例。
- 连接串、引号和布尔处理属于适配层细节；服务层必须保持引擎无关。

## 错误与校验契约

- DTO 对非法输入的字段名和消息在各技术栈之间保持一致。
- 数据库约束是最后一道防线；技术栈不能只依赖应用层校验。
- 错误码与 HTTP 状态码只在 API 契约中定义一次，然后复用。
- 错误路径也必须携带 `traceId`，供前端展示。

## 测试

- 各技术栈的单元测试（Spring、Go、C#、Rust、Nest、FastAPI）。
- `scripts/test-databases.ps1` 运行 PostgreSQL/MySQL/MariaDB/SQLite 的真实矩阵。
- 327 项接口契约检查记录在
  [`../../docs/VERIFICATION.zh-CN.md`](../../docs/VERIFICATION.zh-CN.md)。
- `contracts/openapi.json` 是客户端生成与契约检查的机器可读来源。
