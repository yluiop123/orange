# 后端架构：六套实现，一份行为

本页解释六个后端为什么按同一套分层组织、为什么 Spring Boot 被当作行为基准、以及语言差异被限制在哪一层。要给某个栈加功能，读完再看 [加一个端点](./add-an-endpoint.md)。

## 1. 六套实现共享什么

六个后端不是微服务，彼此不调用，也不共享运行时库。它们共享三样东西：

- 接口契约：`contracts/openapi.json` 定义的路径、方法、请求/响应结构。
- 数据模型：`database/<engine>/ddl.sql` 定义的 10 张表与约束。
- 行为判据：`scripts/ci/http-smoke.mjs` 与 `scripts/ci/contract-test.mjs` 断言的可观测结果（包体、错误码、Cookie 轮换、排序、审计）。

其余全部独立：语言、框架、ORM、目录名、并发模型。这样任一栈可以单独启动、单独部署、单独教学，代价是同一功能要写六遍。

## 2. 一次请求的固定路径

```text
HTTP 请求
  → traceId（读取或生成，写入响应头）
  → CORS（按 allowlist 回显来源）
  → 认证（JWT 签名、jti 吊销、token_version）
  → 强制改密闸门（must_change_password）
  → 授权（Authority = type#path[:action]）
  → 控制器与 DTO 校验（格式、必填、范围）
  → service（业务规则、事务边界）
  → 数据访问（方言差异）
  → 响应包体（code/message/data/timestamp/traceId）
  ↘ 任一环节抛异常 → 统一异常映射 → 同一包体
  ↘ 请求结束 → 操作日志（写入失败不影响响应）
```

顺序不能换。授权在 DTO 校验之前，避免无权限用户探测参数规则；异常映射在控制器之外，避免每个 handler 重复写错误包体；操作日志在响应之后，避免日志失败把成功请求变成失败。

## 3. 为什么这样分层

| 层 | 只做 | 不做的理由 |
| --- | --- | --- |
| 控制器/路由 | 解析路径与查询参数、声明 Authority、调用 service、包响应 | 一旦写业务判断，六栈就会出现六份略有差异的规则 |
| DTO | 字段形状与格式约束 | 业务规则需要查库，放 DTO 会迫使校验层依赖数据访问 |
| service | 存在性、唯一性、树结构、授权边界、事务 | 这些规则要被多个端点复用（例如组织删除与禁用共享子树判断） |
| 数据访问 | 查询、写入、方言分支 | 把方言写进 service 会让换库变成改业务代码 |
| 异常映射 | 异常/消息 → 业务码 + HTTP 状态 | 集中一处才能保证六栈错误码一致 |
| 操作日志 | 记录非 GET 写操作 | 放在 handler 里会漏掉新增端点，也容易把敏感 body 写进库 |

校验为什么放在最外层，见 [ADR 0004](../adr/0004-validation-layering.md)；权限为什么用 `type#path[:action]` 而不是 ID，见 [ADR 0001](../adr/0001-path-as-permission-identity.md)。本页不重复推导。

## 4. 为什么 Spring Boot 是行为基准

“基准”指行为以它为准，不是指它更正确：

- 错误码枚举、HTTP 状态与中文文案在 `ErrorCode.java` 中定义为一张表，其余五栈逐条复制同一张表。
- 响应包体 `{code,message,data,timestamp,traceId}`、分页 `{total,list,page,size,totalPages}`、操作日志字段都从 Spring 实现派生。
- 其他实现主动对齐它：NestJS 的配置注释写明“Mirrors the Spring Boot `application.yaml` defaults”，Rust 的 `src/error.rs` 写明“mirror docs/API.md and the Spring Boot `ErrorCode` enum”，C# 与 Go 的错误码注释指向同一份契约。
- 若干细节来自基准实现并被其余栈复制：`Response.ok(String)` 把同一文本同时放进 `message` 和 `data`；业务消息含“不存在/已存在/已被/不能删除”时映射到 40401/40901；登录限流用 429 业务码而不是 `ErrorCode` 成员。

但基准不是最终裁判。出现分歧时，`contracts/openapi.json` 与 `scripts/ci/contract-test.mjs` 的断言优先；两者也说不清时，先改契约、再让六栈跟上，而不是让某一栈“就地正确”。

## 5. 语言习惯差异被限制在哪

| 维度 | 表现 | 是否影响契约 |
| --- | --- | --- |
| 依赖注入 | Spring 注解扫描、NestJS provider、C# DI 容器、FastAPI `Depends` | 否 |
| 校验实现 | Jakarta Bean Validation、class-validator、DataAnnotations、go-playground/validator、手写 `validate.rs`、Pydantic | 否，约束值必须一致 |
| 数据访问 | JPA Repository、GORM、TypeORM、EF Core、sqlx、SQLAlchemy | 否，方言分支留在数据层 |
| 错误传递 | Java 异常、Go `error` 返回值、TS 异常、C# 异常、Rust `Result`、Python 异常 | 否，最终都进统一映射 |
| 横切机制 | Spring 拦截器/过滤器、Gin 中间件、Nest 拦截器/守卫、ASP.NET 中间件/过滤器、Axum middleware、ASGI 中间件 | 否，记录字段与顺序一致 |
| 树与顺序 | 各栈都有 `TreeIndex`/`TreeCodePolicy` 的对应实现 | 否，业务编码决定同级顺序 |

差异必须止步于“怎么实现”；一旦某栈改了 path、Authority 字符串、包体字段、错误码、分页字段或日志字段，就不是语言差异，而是契约破坏。

## 6. 取舍

代价：

- 同一功能写六遍，新增一个端点要改六个目录、六份测试，成本约为单栈的六倍。
- 漂移风险高：一处文案改动就可能改变 HTTP 状态（见第 4 节的关键词规则）。
- 没有共享代码，只有共享契约，编译器帮不上跨栈的忙。

收益：

- 任一栈可独立运行，适合按语言选型或替换某一栈而不动其他部分。
- 契约测试与数据库矩阵把“行为一致”变成可执行断言，而不是口头约定。
- 每套实现都足够小，可作为该语言生态里“一个完整 CRUD 后端”的样本。

不抽共享 SDK 是刻意选择：六种运行时之间做公共库，会把序列化、错误码和构建链耦合在一起，反而让单栈无法独立升级。共享的边界停在 JSON 契约与 SQL 结构。

## 7. 稳定的边界

维护者可以自由改：目录结构、ORM 选型、日志实现、缓存策略、连接池参数。

不能单方面改：路径与方法、Authority 字符串、包体字段、业务码与 HTTP 状态的对应、分页字段、操作日志字段、`X-Trace-Id` 语义。这些改动必须同时更新契约、六栈实现、契约测试与 [API 参考](../reference/api.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、backend/*/src 分层与注释、backend/{node-nestjs,rust-axum,csharp,go-gin-gorm,python-fastapi} 错误码/配置源码、scripts/ci/{contract-test,http-smoke}.mjs、docs/adr/0001、docs/adr/0004
