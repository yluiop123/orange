[English](README.md) | 简体中文

# 后端

六套 API 实现共享同一份行为契约与同一套数据库 schema。Spring Boot 是行为基准，
其余五套跟随它。实现之间不共享运行时库，也互不调用。每个后端从自己的注解生成
OpenAPI 文档；前端另行维护一份冻结快照，供类型与 Swagger 页面使用。

| 技术栈 | 目录 | 默认端口 | 文档 |
| --- | --- | --- | --- |
| Java 25 + Spring Boot 4 | `backend/springboot` | 8080 | [springboot/README.zh-CN.md](springboot/README.zh-CN.md) |
| Go + Gin + GORM | `backend/go-gin-gorm` | 8081 | [go-gin-gorm/README.zh-CN.md](go-gin-gorm/README.zh-CN.md) |
| NestJS 11 | `backend/node-nestjs` | 3000 | [node-nestjs/README.zh-CN.md](node-nestjs/README.zh-CN.md) |
| ASP.NET Core / .NET 10 | `backend/csharp` | 8082 | [csharp/README.zh-CN.md](csharp/README.zh-CN.md) |
| Rust + Axum | `backend/rust-axum` | 8083 | [rust-axum/README.zh-CN.md](rust-axum/README.zh-CN.md) |
| Python + FastAPI | `backend/python-fastapi` | 8000 | [python-fastapi/README.zh-CN.md](python-fastapi/README.zh-CN.md) |

## 请求处理流程

每个请求都走同一条路径，顺序本身也是契约的一部分：

```text
请求
  → trace id（接收或生成，响应头 X-Trace-Id）
  → CORS 白名单
  → 认证（JWT 签名、jti 吊销、token_version）
  → 强制改密闸门（must_change_password）
  → 授权（Authority = type#path[:action]）
  → 控制器 / handler，DTO 校验
  → service（业务规则、事务边界）
  → 数据访问（方言分支在这一层）
  → 统一包体 { code, message, data, timestamp, traceId }
  ↘ 任意异常 → 统一映射 → 同样的包体
  ↘ 响应之后 → 操作日志（写日志失败不影响请求）
```

授权先于 DTO 校验，未授权的调用方无法探测参数规则。错误映射在控制器之外，任何
handler 都不自己写错误包体。操作日志在响应之后写入。

| 层 | 职责 |
| --- | --- |
| 控制器 / 路由 | 绑定参数、声明 Authority、调用 service、包装包体 |
| DTO | 字段结构与格式约束 |
| 认证 / 授权 | JWT 校验、`token_version`、`must_change_password`、Authority |
| Service | 存在性、唯一性、树规则、授权边界、事务 |
| Repository | 查询、写入、方言分支 |
| 错误映射 | 业务消息或异常 → 业务码 + HTTP 状态 |
| 操作日志 | 记录非 GET 写操作 |

Go、ASP.NET Core、FastAPI 包裹整个请求，因此被拒绝的请求也会记录；Spring、NestJS、
Rust 在认证之后安装记录器，只记录到达 handler 的请求。“Repository”是逻辑层，不是
必须存在的目录。

## 统一响应与错误码

所有 `/api/v1` 响应（包括错误与未知路由）形状一致：

```json
{ "code": 200, "message": "success", "data": null, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

`code` 是业务码，`timestamp` 是服务器毫秒时间，`traceId` 与响应头 `X-Trace-Id`
一致，`data` 是业务数据；校验失败时是 `{字段: 消息}`。

| 业务码 | HTTP | 含义 |
| --- | --- | --- |
| `40001` | 400 | 请求格式错误：JSON 非法、缺少参数、类型无法转换 |
| `40002` | 400 | 参数校验失败 |
| `40101` | 401 | 未登录：令牌缺失/无效/过期、`jti` 已吊销、`token_version` 不匹配、账号禁用、密码错误 |
| `40301` | 403 | 已登录但缺少接口要求的 Authority |
| `40302` | 403 | 需要先修改初始密码 |
| `40401` | 404 | 资源或路由不存在 |
| `40501` | 405 | 路径存在但不支持该方法 |
| `40901` | 409 | 冲突：唯一键/外键失败、乐观锁失败、受保护删除 |
| `429` | 429 | 达到登录失败锁定阈值 |
| `50000` | 500 | 未捕获异常 |

分页固定为 `{ total, list, page, size, totalPages }`。`page` 默认 1，`size` 默认
10；越界页返回空列表。排序字段使用白名单，白名单外静默回退默认字段。

## 认证与权限

- 密码使用 bcrypt（cost 10）；六套实现都接受 `{bcrypt}$2a$...`、`{bcrypt}$2b$...`
  和不带前缀的 bcrypt 行，因此某一栈改过的密码在另一栈仍能验证。
- 访问令牌短时效；refresh token 轮换并保存在 HttpOnly Cookie 中。每次请求都会检查
  已吊销的 `jti` 和 `token_version`。
- 权限身份是 `type + path + action`。有效权限是所有启用角色的并集加直属授权、再
  剔除禁用权限。角色切换只在前端生效，从不缩减后端 Authority。
- 菜单就是数据库行：`sys_permission.name` 是默认名称，`sys_permission_i18n` 每种
  语言一行。`/auth/menus` 按 `Locale` 依次尝试精确语言、主语言和默认名称。

## 配置

配置来自进程环境变量，启动时可从本地文件读取初始值。六套实现只共享优先级规则；
具体变量见各栈 README 与 `.env.example` / YAML。

- **数据库 URL**：完整 URL 覆盖所有离散值。五套实现读取 `DATABASE_URL`；Spring
  的优先级是 `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url`，只有都没有
  时才用 `DB_HOST` / `DB_PORT` / `DB_NAME` 拼 JDBC URL。
- **引擎**：`DB_DRIVER` 优先，其次看 URL scheme，最后默认 PostgreSQL。MariaDB 使用
  MySQL 协议，`mariadb://` 与 `mysql://` 都能连接；Spring 会把 `jdbc:mariadb:`
  改写为 `jdbc:mysql:`。
- **端口**：六套实现都读 `APP_PORT`。Spring Boot 只读 `APP_PORT`；其余五套再回退
  `PORT`，最后使用各自默认值。
- **JWT**：`JWT_PRIVATE_KEY` 与 `JWT_PUBLIC_KEY` 同时配置时使用 RS256，值可以是
  内联 PEM 或文件路径；否则使用 `JWT_SECRET` 的 HS256。只配一半会在启动时报错。
  生产环境应使用 RSA 密钥对（推荐），或至少 32 字节的非默认 secret。
- **本地覆盖**文件不入库：Spring 用 `application-local.yaml`（需
  `SPRING_PROFILES_ACTIVE=local`），Go、NestJS、ASP.NET Core 用 `.env.local`，
  Rust、FastAPI 用 `.env`。

### JWT 密钥

在仓库根目录用 OpenSSL 把开发密钥对生成到 `backend/keys/`：

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out backend/keys/jwt-private.pem
openssl rsa -pubout -in backend/keys/jwt-private.pem -out backend/keys/jwt-public.pem
```

后端按 `JWT_PRIVATE_KEY=../keys/jwt-private.pem`、
`JWT_PUBLIC_KEY=../keys/jwt-public.pem` 指向它即可（路径相对于各
`backend/<stack>` 目录）。

| 技术栈 | 入库配置 | 本地文件 |
| --- | --- | --- |
| Spring Boot | `src/main/resources/application.yaml`、`application-prod.yaml` | `application-local.yaml` |
| Go、NestJS、ASP.NET Core | `.env.example` | `.env.local` |
| Rust、FastAPI | `.env.example` | `.env` |

应用从不建表：Spring 设置 `ddl-auto: none`，NestJS 设置 `synchronize: false`，
其余四套只读现有 schema。表结构归 [../database/](../database/) 管理。

## 切库

PostgreSQL 是基线，另支持 MySQL、MariaDB、SQLite。切换前先按引擎建库（SQLite 是
文件，不需要服务），再依次执行对应 [../database/](../database/) 引擎目录下的
`ddl.sql` 与 `dml.sql`。空 SQLite 文件能连上，但没灌 schema 时所有查询都会报错。

| 引擎 | `DB_DRIVER` | `DATABASE_URL`（五套实现） | Spring JDBC URL |
| --- | --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@127.0.0.1:5432/orange` | `jdbc:postgresql://127.0.0.1:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@127.0.0.1:3306/orange` | `jdbc:mysql://127.0.0.1:3306/orange` |
| MariaDB | `mariadb` | `mariadb://root:root@127.0.0.1:3307/orange` | `jdbc:mysql://127.0.0.1:3307/orange` |
| SQLite | `sqlite` | `./orange.db` | `jdbc:sqlite:./orange.db` |

SQLite 路径按栈区分：Go 用 `DB_PATH`（别名 `SQLITE_PATH`），Rust 用 `DB_FILE`，
ASP.NET Core 用 `SQLITE_PATH`，NestJS 与 FastAPI 用 `DB_NAME` 或 URL 里的路径。
Spring 会自动开启外键并补 `date_class=text`，手写 JDBC URL 时要保留这些参数。
示例里 MariaDB 用 3307，改 `DB_DRIVER` 时要连端口一起改。

各栈的驱动、ORM 和文件位置见对应 README。验证切换：起服务后用种子账号实际操作一遍；
已设置却被遗忘的 `DATABASE_URL` 是 `DB_HOST`“不生效”的常见原因。

## 新增端点

1. 先在参考实现里定行为：方法、路径、Authority、请求/响应 schema，以及可能返回的
   每个错误。给 Spring 控制器和 DTO 补注解，让 springdoc 收录，再在其余五栈镜像
   同样的注解。消费方结构变化时同步更新
   [../frontend/openapi.json](../frontend/openapi.json)。
2. 添加 DTO 与格式约束。校验失败返回 `40002`，`data` 为 `{字段: 消息}`；JSON 非法
   返回 `40001`。
3. 在 service 层实现规则：存在性、唯一性、树与授权边界、事务。
4. 接控制器或 handler：声明 Authority（形如 `action#/system/role:edit`），调用
   service，返回统一包体。Spring 的 `@PreAuthorize` 字符串必须存在于
   `database/permissions.json`。
5. 不要写日志代码。`/api/v1/system/` 下的非 GET 请求与
   `/api/v1/auth/change-password` 会自动记录；敏感字段会脱敏，query/body 会截断。
6. 在六栈各改一遍。跑 service 单测，再起服务手工验证新端点：写操作返回 `200`，
   再读一次确认新状态。

## Swagger

文档端点位于 `/api/v1` 之外，不使用业务包体，由各框架生成：

| 技术栈 | 生成方式 | 端点 |
| --- | --- | --- |
| Spring Boot | springdoc-openapi 注解 | `/openapi.json`、`/swagger` |
| FastAPI | FastAPI/Pydantic 路由元数据 | `/openapi.json`、`/swagger` |
| NestJS | `@nestjs/swagger` + CLI 插件 | `/openapi.json`、`/swagger` |
| ASP.NET Core | Swashbuckle 控制器元数据 | `/openapi.json`、`/swagger` |
| Go | swaggo handler 注解 | `/openapi.json`、`/swagger` |
| Rust | utoipa derive 与 path 注解 | `/openapi.json`、`/swagger` |

没有共享的运行时文档。没有注解的路径不会出现，因此改端点时要在每套栈同步更新注解。

## 文档入口

- [前端总览](../frontend/README.zh-CN.md)
- [数据库](../database/README.zh-CN.md)
- [仓库 README](../README.zh-CN.md)
