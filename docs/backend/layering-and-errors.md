# 后端分层与错误码参考

本页查六套后端的分层职责、响应包体、业务错误码、校验与分页约定、操作日志拦截规则。动手加端点看 [加一个端点](./add-an-endpoint.md)，设计取舍看 [后端架构](./architecture.md)。

## 1. 分层职责

| 层 | 职责 | Spring Boot | Go | NestJS | ASP.NET Core | Rust | FastAPI |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 路由/控制器 | 绑定路径与参数、声明授权 Authority、把 service 结果包成包体 | `controller/` | `internal/http/*_handler.go` | `src/<域>/*.controller.ts` | `Controllers/` | `src/routes/` | `app/routers/` |
| 请求 DTO | 字段形状与格式校验，不写业务规则 | `domain/<域>/req/` | handler 内的 `*Request` 结构体 + `internal/http/bind.go` | `src/<域>/*.dto.ts` | `Contracts/Requests.cs` | `src/domain/dto.rs` | `app/schemas/` |
| 鉴权 | 校验 JWT、`token_version`、`must_change_password`、Authority | `security/` | `internal/http/middleware_auth.go` | `src/auth/*.guard.ts` | `Security/AuthenticationMiddleware.cs` | `src/auth/` + `src/middleware.rs` | `app/security/dependencies.py` |
| 业务 | 存在性、唯一性、树结构、授权边界等规则 | `service/system/impl/` | `internal/service/` | `src/<域>/*.service.ts` | `Services/` | `src/service/` | `app/services/` |
| 数据访问 | 查询与持久化，方言差异只在这一层 | `repository/system/` | `internal/store/` | TypeORM `Repository`（无独立目录） | `Data/OrangeDbContext.cs` | `src/repository/` | SQLAlchemy `Session`（无独立目录，模型在 `app/models/`） |
| 异常映射 | 把异常与业务消息映射成业务 code + HTTP 状态 | `controller/GlobalExceptionHandler.java` | `internal/http/response.go` + `internal/domain/errors.go` | `src/common/all-exceptions.filter.ts` | `Middleware/ExceptionHandlingMiddleware.cs` | `src/error.rs` | `app/errors.py` |
| 操作日志 | 记录非 GET 写操作的审计行 | `config/OperationLogInterceptor.java` | `internal/http/middleware.go` | `src/operation-log/operation-log.interceptor.ts` | `Middleware/OperationLogMiddleware.cs` | `src/operation_log.rs` | `app/middleware.py` |

“repository”是逻辑层不是目录要求：NestJS 通过依赖注入拿 TypeORM `Repository`，C# 与 FastAPI 在 service 里直接用 `DbContext`/`Session`。层可以折叠，职责不能混：格式校验不进 service，业务规则不进 controller。

## 2. 响应包体

所有 `/api/v1` 端点（含错误、含未知路由）都返回同一形状：

```json
{ "code": 200, "message": "success", "data": null, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | int | 业务码，成功固定 `200`；失败见第 3 节 |
| `message` | string | 成功文案或错误文案；错误时非空 |
| `data` | any | 成功载荷；校验失败时是 `{字段: 消息}` 映射 |
| `timestamp` | int64 | 服务端毫秒时间戳 |
| `traceId` | string | 与响应头 `X-Trace-Id` 相同的链路 ID |

成功时 `message` 的跨栈差异：

| 后端 | 对象/数组 `data` 的 `message` | 字符串 `data` 的处理 | 出处 |
| --- | --- | --- | --- |
| Spring Boot | `""` | `Response.ok("操作成功")` 把文本同时写进 `message` 与 `data` | `domain/common/Response.java` |
| Go | `""` | `success(c, "操作成功")` 同上 | `internal/http/response.go` |
| NestJS | `"success"` | `ApiResult.message(m)` 把文本同时写进两者 | `src/common/response.ts` |
| ASP.NET Core | `""` | `ApiResponseFactory.Ok("操作成功")` 同上 | `Security/Envelope.cs` |
| Rust | `"success"` | `ApiResponse::ok_text` 同上 | `src/response.rs` |
| FastAPI | `"success"` | `success("操作成功")` 只设置 `data`，`message` 仍是 `"success"`；要改 `message` 必须显式传 `message=` | `app/envelope.py` |

FastAPI 这一处是唯一不把字符串 `data` 自动复制进 `message` 的实现，跨栈对齐时以显式 `message=` 为准。

所有栈都接受入站 `X-Trace-Id`（部分栈兼容 `X-Request-Id`）并回显 `X-Trace-Id`；入站值不合法时重新生成。

## 3. 业务错误码

定义文件：Spring `domain/common/ErrorCode.java`、Go `internal/domain/errors.go`、NestJS `src/common/error-code.ts`、C# `Domain/ErrorCodes.cs`、Rust `src/error.rs`、FastAPI `app/errors.py`。

| code | HTTP | 默认 message | 触发条件与出处 |
| --- | --- | --- | --- |
| `40001` | 400 | 参数错误 | 请求体不是合法 JSON、缺少必填查询参数、参数类型无法转换。Spring `GlobalExceptionHandler.handleBadRequest`；Go `bind.go` 的非校验错误；Nest `all-exceptions.filter.ts` 的 `codeForHttpStatus(400)`；C# `ValidationFilter` 的 `conversionFailed` 与 `ExceptionHandlingMiddleware` 的 `BadRequestException`/`JsonException`；Rust `routes/mod.rs` 的 `parse_json`/`parse_query`；FastAPI `errors.py` 的 `json_invalid` 与 Starlette 400 映射 |
| `40002` | 400 | 校验失败 | DTO 格式校验失败，或业务异常消息不含第 4 节关键词。Spring `MethodArgumentNotValidException` 与 `resolveBusinessError` 兜底；Go `domain.Validation`/`fieldError`；Nest `ValidationException`/`BusinessException.validate`；C# `ValidationFailedException`/`BusinessException.ResolveCode`；Rust `AppError::validation`/`business`；FastAPI `RequestValidationError`/`invalid()` |
| `40101` | 401 | 未登录 | 缺少/无效/过期 access token、jti 已吊销、`token_version` 不匹配、账号被禁用；登录密码错误也用它（message 为“用户名或密码错误”）。Spring `JwtRequestFilter` + `JwtAuthenticationEntryPoint`；Go `requireAuth`；Nest `JwtAuthGuard`；C# `AuthenticationMiddleware`；Rust `require_auth`；FastAPI `get_auth_context` |
| `40301` | 403 | 无权限 | 已登录但缺少端点要求的 Authority。Spring `GlobalExceptionHandler.handleAuthorizationDeniedException`；Go `requireAuthority`；Nest `AuthoritiesGuard`；C# `AuthenticationMiddleware` 的 Authority 检查；Rust `AuthUser::require`；FastAPI `require()` |
| `40302` | 403 | 请先修改初始密码 | `must_change_password=true` 且请求不在白名单（`change-password`/`user-info`/`menus`/`logout`）。Spring `JwtRequestFilter`；Go `requireAuth`；Nest `JwtAuthGuard`；C# `AuthenticationMiddleware`；Rust `require_auth`；FastAPI `get_auth_context` |
| `40401` | 404 | 数据不存在 | 按 ID 查不到记录，或路由不存在。Spring `resolveBusinessError` 的“不存在”与 `NoResourceFoundException`；Go `NotFound`/`NoRoute`；Nest `BusinessException.notFound` 与 `FallbackController`；C# `BusinessException.ResolveCode` 与 `UseStatusCodePages`；Rust `not_found`/`business` 与 `fallback`；FastAPI `not_found()` 与 Starlette 404 映射 |
| `40501` | 405 | 方法不允许 | 路径存在但方法不匹配。Spring `HttpRequestMethodNotSupportedException`；Go `NoMethod`；Nest `FallbackController` 按 `CANONICAL_ROUTES` 区分 405/404；C# `UseStatusCodePages`；Rust `method_not_allowed_fallback`；FastAPI Starlette 405 映射 |
| `40901` | 409 | 数据冲突 | 唯一键/外键冲突、乐观锁失败，或业务消息含“已存在/已被/不能删除/请先禁用子组织（权限）”。Spring `DataIntegrityViolationException`、`ObjectOptimisticLockingFailureException`；Go service 的 `domain.Conflict`；Nest `QueryFailedError`（`23505`/`23503`/`23502`）与 `OptimisticLockVersionMismatchError`；C# `DbUpdateException`/`DbUpdateConcurrencyException`；Rust `integrity_conflict` 与 `AppError::conflict`；FastAPI `IntegrityError`/`StaleDataError` 与 `conflict()` |
| `429` | 429 | 登录失败次数过多，请稍后再试 | 登录锁定阈值命中。注意它不是 Spring `ErrorCode` 枚举成员：`LoginController.rateLimited` 直接写 `429`；NestJS/Go/C#/Rust 有对应常量，FastAPI 在 `routers/auth.py` 直接返回 `failure(429, …)` |
| `50000` | 500 | 系统异常 | 未捕获异常。Spring `GlobalExceptionHandler.handleException`；Go `Recovery`/`SystemError`；Nest `AllExceptionsFilter` 兜底；C# `ExceptionHandlingMiddleware` 兜底；Rust `AppError::system`；FastAPI `_unhandled_error` |

约定：业务码是契约的一部分，新端点只能复用上表，不要自造数字；错误文案可以带上下文（如“组织不存在”），但 `code` 与 HTTP 状态由上表决定。

## 4. 校验的关键词规则

Spring、Rust、C# 都按业务消息里的关键词决定 40401/40901，而不是按异常类型：

| 关键词 | 结果 | 出处 |
| --- | --- | --- |
| `不存在` | 40401 | Spring `GlobalExceptionHandler.resolveBusinessError`；Rust `AppError::business`；C# `BusinessException.ResolveCode` |
| `已存在` / `已被` / `不能删除` | 40901 | 同上 |
| `请先禁用子组织` | 40901 | 仅 Spring 关键词表；Rust/C#/Nest/Go/FastAPI 在该场景显式返回冲突码 |
| 其他 | 40002 | Spring/Rust/C# 兜底 |

这条规则解释了为什么 service 里写 `throw new BusinessException("组织不存在")` 就够了；也意味着改文案可能改变 HTTP 状态，改之前先搜关键词。

## 5. 参数校验与分页约定

校验发生在 DTO/绑定层（见第 1 节），跨栈共享的主要约束：

| 项 | 约束 | 出处 |
| --- | --- | --- |
| 用户名 | `^[A-Za-z0-9_]{4,50}$` | Spring `QueryUserReq`/`AddUserReq`、Nest `users.dto.ts`、C# `Requests.cs`、Go `bind.go`、Rust `validate.rs`、FastAPI `schemas/user.py` |
| 手机号 | `^1[3-9]\d{9}$` | 同上 |
| 邮箱 | 非空 + 邮箱格式 | 同上 |
| 密码 | 新密码 8–64 位，且同时含字母和数字 | `ChangePasswordReq`/`change-password` DTO/`validate.rs` |
| 状态 | `0` 或 `1`；列表过滤额外接受 `all` | `StatusReq`/`StatusIn`/`StatusRequest`/`validate_status` |
| 组织/权限业务编码 | 纯数字，组织 `^[0-9]{2,}$`，权限 `^[0-9]{2,}$` | `AddChildGroupReq`、`AddChildPermissionReq`、`tree_code` 策略 |
| 权限类型 | `menu`/`action`/`directory`；action 必须有 `action`，menu/directory 必须没有 | `PermissionShapePolicy`/`permission_shape.py`/`permission_shape.rs` |
| 角色 ID | `^[A-Za-z0-9_-]{2,32}$` | `AddRoleReq`、`validate.rs` |
| 排序方向 | `asc`/`desc`，空表示默认 | `QueryUserReq`/`QueryRoleReq` |

分页：

| 项 | 约定 |
| --- | --- |
| 参数 | `page` 默认 `1`；`size` 默认 `10` |
| 上限 | 用户/角色：`page` 1–10000、`size` 1–100；操作日志：`page` ≥1、`size` 1–100 |
| 返回 | `{total, list, page, size, totalPages}`，`totalPages` 向上取整；空结果时 `total=0`、`list=[]` |
| 越界 | 超过最后一页返回空 `list`，不报错；`page`/`size` 越界由 DTO 或参数解析拒绝（Spring/Nest/C#/Go/FastAPI 为 40002，Rust 的 `parse_page`/`parse_size` 为 40001） |
| 排序 | 只接受白名单字段（用户 `id`/`name`/`username`/`email`/`status`/`createTime`/`updateTime` 等）；不在白名单时回退默认字段 |
| 操作日志 | 固定按 `id desc`；用户/角色默认按 `createTime desc` |

“行数上限”来自各栈的 DTO 或查询参数声明，不是数据库 `LIMIT` 的副作用。

## 6. 操作日志拦截规则

| 规则 | 值 | 出处 |
| --- | --- | --- |
| 记录范围 | 方法不是 GET/OPTIONS，且路径以 `/api/v1/system/` 开头或等于 `/api/v1/auth/change-password` | Spring `OperationLogPolicy.shouldRecord`；Go `domain.ShouldRecord`；Nest `operation-log.policy.ts`；C# `OperationLogPolicy.ShouldRecord`；Rust `operation_log.rs`；FastAPI `services/operation_logs.py` |
| 不记录 body | 路径以 `/login`、`/refresh`、`/change-password`、`/reset-password` 结尾 | 各栈 `isSensitivePath` |
| 脱敏 | JSON 中键名含 `password`/`token`/`secret` 的字符串值替换为 `"***"` | 各栈同名正则 |
| 截断 | `queryString` 500 字符；`requestBody` 4000 字符 | `OperationLogBodyLimit`/`QUERY_LIMIT` 等常量 |
| 操作人 | 认证用户 `username`；取不到时 `anonymous` | 各栈日志中间件 |
| 客户端 IP | `X-Forwarded-For` 第一段，否则远端地址 | `OperationLogPolicy.clientIp` 等 |
| 写入失败 | 只记警告，不影响原请求 | Spring `OperationLogInterceptor`、Go `middleware.go`、Nest `operation-log.interceptor.ts`、C# `OperationLogMiddleware`、Rust `operation_log.rs`、FastAPI `middleware.py` |
| 查询 | `GET /api/v1/system/operation-logs`，按用户/路径/状态/时间过滤，分页 | 各栈 operation-log controller |

日志只记录“已发生的请求”，不含响应体；排查接口问题时用 `traceId` 关联响应头与日志行。

> Last verified: 24826bb · 2026-11-07
> 事实来源: backend/{springboot,go-gin-gorm,node-nestjs,csharp,rust-axum,python-fastapi} 的 controller/handler/router、DTO、错误码与 operation-log 源码、contracts/openapi.json
