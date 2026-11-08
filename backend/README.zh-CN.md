[English](README.md) | 简体中文

# 后端

六套 API 实现共享同一份行为契约与同一套数据库 schema。Spring Boot 是行为基准，
跨栈契约测试是最终裁判；六套实现之间不共享运行时库，也互不调用。每个后端从自己的
注解生成 OpenAPI 文档；前端另行维护一份冻结快照，供类型与 Swagger 页面使用。

仓库结构与快速开始见 [../README.md](../README.zh-CN.md)。前端快照是
[../frontend/openapi.json](../frontend/openapi.json)，表结构与种子数据在
[../database/](../database/)，跨栈检查脚本在 [../scripts/](../scripts/)，前端约定见
[../frontend/README.md](../frontend/README.zh-CN.md)。

| 栈 | 目录 | 角色 |
| --- | --- | --- |
| Java 25 + Spring Boot | [springboot/README.md](springboot/README.zh-CN.md) | 行为基准 |
| Go + Gin + GORM | [go-gin-gorm/README.md](go-gin-gorm/README.zh-CN.md) | 第二实现 |
| NestJS | [node-nestjs/README.md](node-nestjs/README.zh-CN.md) | 第三实现 |
| ASP.NET Core (.NET 10) | [csharp/README.md](csharp/README.zh-CN.md) | 第四实现 |
| Rust + Axum | [rust-axum/README.md](rust-axum/README.zh-CN.md) | 第五实现 |
| Python + FastAPI | [python-fastapi/README.md](python-fastapi/README.zh-CN.md) | 第六实现 |

## 1. 共同分层与职责

每个请求都走同一条路径，顺序本身也是契约的一部分：

```text
请求
  → trace id（读取或生成，响应回显 X-Trace-Id）
  → CORS 白名单
  → 认证（JWT 签名、jti 吊销、token_version）
  → 强制改密闸门（must_change_password）
  → 授权（Authority = type#path[:action]）
  → 控制器或 handler + DTO 校验
  → service（业务规则、事务边界）
  → 数据访问（方言分支止步于此）
  → 包体 { code, message, data, timestamp, traceId }
  ↘ 任一异常 → 统一映射 → 同一个包体
  ↘ 响应之后 → 操作日志（写入失败不影响请求）
```

授权必须先于 DTO 校验，否则无权限的调用方能借参数错误探测规则。Spring 用
`HandlerInterceptor`、FastAPI 用 `Depends(...)` 权限依赖，两者都在请求体/参数校验之前执行。错误映射必须在
控制器之外，否则每个 handler 都要重复拼错误包体。操作日志必须在响应之后写，否则
日志失败会把成功请求变成失败。

| 层 | 只做 | 位置 |
| --- | --- | --- |
| 控制器 / 路由 | 绑定路径与查询参数、声明 Authority、调用 service、包响应 | Spring `controller/`；Go `internal/http/*_handler.go`；NestJS `src/<域>/*.controller.ts`；ASP.NET Core `Controllers/`；Rust `src/routes/`；FastAPI `app/routers/` |
| DTO | 字段形状与格式约束 | Spring `domain/<域>/req/`；Go 的 `*Request` 结构体与 `internal/http/bind.go`；NestJS `*.dto.ts`；ASP.NET Core `Contracts/Requests.cs`；Rust `src/domain/dto.rs`；FastAPI `app/schemas/` |
| 认证与授权 | JWT 校验、`token_version`、`must_change_password`、Authority 检查 | Spring `security/`；Go `internal/http/middleware_auth.go`；NestJS `src/auth/*.guard.ts`；ASP.NET Core `Security/AuthenticationMiddleware.cs`；Rust `src/auth/` 与 `src/middleware.rs`；FastAPI `app/security/dependencies.py` |
| service | 存在性、唯一性、树规则、授权边界、事务 | Spring `service/system/impl/`；Go `internal/service/`；NestJS `*.service.ts`；ASP.NET Core `Services/`；Rust `src/service/`；FastAPI `app/services/` |
| 数据访问 | 查询、写入、方言分支 | Spring `repository/system/`；Go `internal/store/`；NestJS 注入的 TypeORM `Repository`；ASP.NET Core `Data/OrangeDbContext.cs`；Rust `src/repository/`；FastAPI 的 SQLAlchemy `Session`（模型在 `app/models/`） |
| 异常映射 | 异常或业务消息 → 业务码 + HTTP 状态 | Spring `controller/GlobalExceptionHandler.java`；Go `internal/http/response.go` 与 `internal/domain/errors.go`；NestJS `src/common/all-exceptions.filter.ts`；ASP.NET Core `Middleware/ExceptionHandlingMiddleware.cs`；Rust `src/error.rs`；FastAPI `app/errors.py` |
| 操作日志 | 记录非 GET 写操作 | Spring `config/OperationLogInterceptor.java`；Go `internal/http/middleware.go`；NestJS `src/operation-log/operation-log.interceptor.ts`；ASP.NET Core `Middleware/OperationLogMiddleware.cs`；Rust `src/operation_log.rs`；FastAPI `app/middleware.py` |

Go、ASP.NET Core 与 FastAPI 包住整个请求，被拒绝的请求（401/403/400）也会记录；
Spring、NestJS、Rust 在认证之后才安装记录器，只记录进入处理器的请求。

“repository”是逻辑层而非目录要求：NestJS 注入 TypeORM `Repository`，ASP.NET Core
与 FastAPI 在 service 里直接用 `DbContext` / `Session`。层可以折叠，职责不能混：
格式校验不进 service，业务规则不进控制器。

## 2. 响应包体与错误码

所有 `/api/v1` 响应——包括错误和未知路由——形状一致：

```json
{ "code": 200, "message": "success", "data": null, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

`code` 是业务码（成功固定 `200`），`timestamp` 是服务端毫秒时间戳，`traceId` 与响应头
`X-Trace-Id` 相同，`data` 是载荷；校验失败时是 `{字段: 消息}` 映射。成功时字符串载荷
会同时写进 `message` 与 `data`，六套实现一致。

| code | HTTP | 含义 | 典型触发点 |
| --- | --- | --- | --- |
| `40001` | 400 | 请求错误 | JSON 不合法、缺少必填查询参数、类型无法转换 |
| `40002` | 400 | 校验失败 | DTO 格式违规，或业务消息没有命中映射关键词 |
| `40101` | 401 | 未登录 | token 缺失/无效/过期、jti 已吊销、`token_version` 不匹配、账号禁用、密码错误 |
| `40301` | 403 | 无权限 | 已登录但缺少端点要求的 Authority |
| `40302` | 403 | 请先修改初始密码 | `must_change_password=true` 且路径不在白名单 |
| `40401` | 404 | 数据不存在 | 按 ID 查不到记录，或路由不存在 |
| `40501` | 405 | 方法不允许 | 路径存在，但方法不匹配 |
| `40901` | 409 | 数据冲突 | 唯一键或外键冲突、乐观锁失败、受保护的删除 |
| `429` | 429 | 登录次数过多 | 账号或 IP 命中锁定阈值 |
| `50000` | 500 | 系统异常 | 未捕获异常 |

映射表位于 Spring 的 `domain/common/ErrorCode.java`、Go 的
`internal/domain/errors.go`、NestJS 的 `src/common/error-code.ts`、ASP.NET Core 的
`Domain/ErrorCodes.cs`、Rust 的 `src/error.rs`、FastAPI 的 `app/errors.py`。新端点
复用这些码，不得自造数字。

Spring、Rust、ASP.NET Core 按业务消息关键词判定 `40401` 与 `40901`：`不存在` →
`40401`；`已存在`、`已被`、`不能删除`、`请先禁用子组织` → `40901`；其余 → `40002`。
因此改文案可能改变 HTTP 状态，改之前先搜关键词。

`429` 是唯一不在 Spring `ErrorCode` 枚举里的码：`LoginController` 直接写这个字面量；
NestJS、Go、ASP.NET Core、Rust 各自定义常量，FastAPI 在 auth 路由里按同一锁定规则
直接返回。

分页固定为 `{ total, list, page, size, totalPages }`。`page` 默认 1，`size` 默认 10，
`totalPages` 向上取整；超过最后一页返回空 list 而不是报错。排序只接受白名单字段，
白名单外静默回退默认字段。

## 3. 配置与环境变量

配置来自进程环境变量，启动时可选读入本地文件。跨栈共享的只有优先级规则；完整变量
表在各栈的 `.env.example` 或 YAML 文件及其 README 里，本文不复制。

- 数据库连接：完整 URL 覆盖所有离散值。五套实现读 `DATABASE_URL`；Spring Boot 的
  顺序是 `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url`，三处 URL 都未设置
  时才用 `DB_HOST`/`DB_PORT`/`DB_NAME` 拼 JDBC URL；凭据是
  `SPRING_DATASOURCE_USERNAME/PASSWORD > DB_USER/DB_PASSWORD`。URL 一旦设置，只改
  `DB_PASSWORD` 不会生效。
- 引擎：先看 `DB_DRIVER`，其次由 URL scheme 决定，仍判断不出就用 PostgreSQL。
  MariaDB 与 MySQL 共用协议，`mariadb://` 与 `mysql://` 都能连；Spring 会把
  `jdbc:mariadb:` 改写成 `jdbc:mysql:`。
- 端口：六套实现都读 `APP_PORT`。Spring 只读 `APP_PORT`；其余五套未设置时回退
  `PORT`，再回退各自默认端口。
- JWT：六套实现同一规则。`JWT_PRIVATE_KEY` 与 `JWT_PUBLIC_KEY` 同时配置时用
  RS256，值可以是内联 PEM 或文件路径；否则回退到 `JWT_SECRET` 的 HS256。只配一半
  会在启动时报错。生产环境应配置 RSA 密钥对（推荐），或使用非默认且至少 32 字节的
  secret。
- 密码：六套实现都用 bcrypt（cost 10），入库格式为 `{bcrypt}$2a$...` /
  `{bcrypt}$2b$...`；每套实现也接受不带前缀的旧 bcrypt 行，因此某一栈改过的密码在
  另一栈仍能验证。
- 开发密钥在仓库根目录生成：`pnpm run jwt:keys`（写入已被 gitignore 的
  `keys/jwt-private.pem` 与 `keys/jwt-public.pem`；`--force` 会轮换并使旧 token
  失效）。后端按 `JWT_PRIVATE_KEY=../../keys/jwt-private.pem`、
  `JWT_PUBLIC_KEY=../../keys/jwt-public.pem` 指过去，或使用绝对路径。六栈随后都会
  签发 `alg: RS256` 的 token。
- 本地覆盖文件不入库：Spring 用 `application-local.yaml`（需
  `SPRING_PROFILES_ACTIVE=local`），Go、NestJS、ASP.NET Core 用 `.env.local`，
  Rust、FastAPI 用 `.env`。

| 栈 | 入库的配置文件 | 本地文件 |
| --- | --- | --- |
| Spring Boot | `src/main/resources/application.yaml`、`application-prod.yaml` | `application-local.yaml` |
| Go、NestJS、ASP.NET Core | `.env.example` | `.env.local` |
| Rust、FastAPI | `.env.example` | `.env` |

应用一律不建表：Spring 设 `ddl-auto: none`，NestJS 设 `synchronize: false`，其余
四套只读现有 schema。表结构归 [../database/](../database/) 管理。

## 4. 切库

PostgreSQL 是基准，另支持 MySQL、MariaDB、SQLite。切换前先按引擎建库（SQLite 是
文件，不需要服务），再依次执行对应 [../database/](../database/) 引擎目录下的
`ddl.sql` 与 `dml.sql`。空 SQLite 文件能连上，但没灌 schema 时所有查询都会报表
不存在。[../scripts/](../scripts/) 里的 `test-databases.ps1` 会启动本地的
PostgreSQL、MySQL、MariaDB 容器并灌入 schema；CI 矩阵改用 GitHub Actions 的
service containers。

| 引擎 | `DB_DRIVER` | `DATABASE_URL`（五套实现） | Spring JDBC URL |
| --- | --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@127.0.0.1:5432/orange` | `jdbc:postgresql://127.0.0.1:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@127.0.0.1:3306/orange` | `jdbc:mysql://127.0.0.1:3306/orange` |
| MariaDB | `mariadb` | `mariadb://root:root@127.0.0.1:3307/orange` | `jdbc:mysql://127.0.0.1:3307/orange` |
| SQLite | `sqlite` | `./orange.db` | `jdbc:sqlite:./orange.db` |

SQLite 路径按栈区分：Go 用 `DB_PATH`（别名 `SQLITE_PATH`），Rust 用 `DB_FILE`，
ASP.NET Core 用 `SQLITE_PATH`，NestJS 与 FastAPI 用 `DB_NAME` 或 URL 里的路径。
Spring 会自动开启外键并补 `date_class=text`，手写 JDBC URL 时要保留这些参数。
MariaDB 在 CI 用 3307，改 `DB_DRIVER` 时要连端口一起改。

验证切换：起服务后把 [../scripts/](../scripts/) 里的 `http-smoke.mjs` 指向它的
base URL；或用数据库矩阵脚本让单栈依次连四个引擎。已设置却被遗忘的 `DATABASE_URL`
是 `DB_HOST` “不生效”的常见原因。

## 5. 加端点流程

1. 先在参考实现里定行为：方法、路径、Authority、请求与响应 schema，以及可能返回的
   每个错误。给 Spring 控制器/DTO 补注解，让 springdoc 收录它，再在其余五栈镜像同样
   的注解。消费方结构变化时同步更新
   [../frontend/openapi.json](../frontend/openapi.json)，它驱动前端类型与 Swagger 页面。
2. 加 DTO 与格式约束。校验失败返回 `40002`，`data` 是 `{字段: 消息}`；body 不是
   合法 JSON 则是 `40001`。
3. 在 service 层实现规则：存在性、唯一性、树与授权边界、事务。抛业务消息前确认
   统一映射会得到预期错误码，不要在 service 里另写状态码判断。
4. 接控制器或 handler：声明 Authority（形如 `action#/system/role:edit`）、调用
   service、返回包体。Spring 的 `@PreAuthorize` 字符串必须存在于权限目录
   `database/permissions.json`，否则 Authority 覆盖测试失败。
5. 不要写日志代码。`/api/v1/system/` 下的非 GET 请求与
   `/api/v1/auth/change-password` 会自动记录；登录、刷新、改密路径不记录 body，
   键名含 `password`、`token`、`secret` 的值会脱敏；query 与 body 分别截断到 500
   和 4000 字符，日志写入失败只告警。
6. 按上面的分层表在六栈各改一遍。各栈 README 列出精确目录；Node 栈用
   `pnpm install` 安装、`pnpm test` 测试。
7. 合并前测试：service 单测、对运行中的服务跑 `http-smoke.mjs`、对同一 base URL
   跑 `contract-test.mjs`。两个脚本都在 [../scripts/](../scripts/)。契约测试覆盖
   固定行为集，不会自动发现新 path，必须显式补断言：写操作返回 `200`，再读一次
   确认新状态。

## 6. Swagger

文档入口在 `/api/v1` 之外，不套业务包体，由各框架自己生成：

| 栈 | 生成方式 | 入口 |
| --- | --- | --- |
| Spring Boot | springdoc-openapi 注解 | `/openapi.json`、`/swagger` |
| FastAPI | FastAPI/Pydantic 路由元数据 | `/openapi.json`、`/swagger` |
| NestJS | `@nestjs/swagger` + CLI 插件 | `/openapi.json`、`/swagger` |
| ASP.NET Core | Swashbuckle 控制器元数据 | `/openapi.json`、`/swagger` |
| Go | swaggo handler 注解 | `/openapi.json`、`/swagger` |
| Rust | utoipa derive 与 path 注解 | `/openapi.json`、`/swagger` |

不存在共享的运行时文档。文档反映代码：没有注解的 path 不会出现，因此改接口时要同步
更新各栈的注解。

> Last verified: c7b6531 · 2026-11-08
