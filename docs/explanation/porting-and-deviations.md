# 移植与允许偏差

本页定义“同一产品在另一套栈里”到底要求什么：哪些行为必须完全一致、哪些差异可以接受、差异登记在哪里、如何证明一致性；要给仓库加栈或审查移植的维护者读这一页。

## 1. 一致性的判据

判据不是代码相似，也不是目录结构相同，而是**从 HTTP 与界面能观察到的行为一致**。同一请求在任意后端上应得到相同的状态码、业务码、响应包体形状与权限结果；同一页面在任意前端上应存在、可到达、受同一套权限语义约束。语言习惯、框架选型、内部类名都不属于一致性范围。

## 2. 必须完全一致的行为

| 领域 | 必须一致的内容 |
| --- | --- |
| 契约 | 34 个规范 operation 的路径、方法、参数、请求/响应结构与认证要求；`deprecated` 的 15 个旧接口可以省略 |
| 响应包体 | `{code, message, data, timestamp, traceId}`；分页 `{total, list, page, size, totalPages}`；`X-Trace-Id` 与包体 `traceId` 一致 |
| 错误码 | `40001`/400 参数错误、`40002`/400 校验失败、`40101`/401、`40301`/403、`40302`/403、`40401`/404、`40501`/405、`40901`/409、`50000`/500；登录限流用 HTTP 429 |
| 认证 | access token + HttpOnly 轮换 refresh cookie；令牌带 `token_version`；刷新重放返回 401；登出使该用户全部会话失效；锁定阈值 5/20/15 分钟 |
| 强制改密 | `must_change_password` 只放行 `user-info`、`menus`、`change-password`、`logout`，其余返回 40302 |
| 权限语义 | authority 形如 `type#path[:action]`；有效权限 = 启用角色并集 + 直属权限 − 禁用权限；目录权限只控制可见性；角色切换不改变后端授权 |
| 菜单 | `/auth/menus` 返回全部启用的 `menu`/`directory` 节点，按业务编码排序，不包含 `action`，不按用户过滤 |
| 数据结构 | 表名、列名、主键/外键/唯一索引与 CHECK 以 `database/<engine>/ddl.sql` 为准；权限身份、编码形状、状态枚举不可放宽 |
| 业务常量 | 新建/重置密码返回 12 位临时密码；密码哈希可验证；分页默认与上限、排序白名单一致 |

这些是“可观察契约”的硬边界。违反其中任何一条，客户端或另一个栈就会看到不同产品，而不是不同实现。

## 3. 允许的偏差

| 类别 | 允许的差异 | 前提 |
| --- | --- | --- |
| 语言与框架 | 目录布局、类名、ORM、HTTP 框架、构建工具 | 不影响第 2 节的行为 |
| JWT 算法 | Spring 用 RS256；Go 可配 RS256 或 HS256；其余后端多用 HS256 + 环境密钥 | 令牌只在本栈内验证，客户端不解析算法；密钥管理方式写进配置文档 |
| 数据库方言 | 同一 DDL 的方言写法、连接池参数、SQLite 的写串行化处理 | 结构约束等价；四个可执行引擎都要进入矩阵 |
| 校验错误载荷 | Java 在 `data` 里给 `{字段: 消息}`；Rust 只给单条 `message` | 业务码与 HTTP 状态不变；前端能降级显示 |
| 消息措辞 | 同义中文提示、字段名翻译差异 | 业务码不变；客户端不按消息文本分支 |
| 旧接口 | 不实现 `*/add`、`*/edit`、`*/addChild`、`*/detail/{id}` | 契约里已标 `deprecated`，规范 operation 完整 |
| 接口文档 UI | FastAPI 默认暴露 `/docs`；Spring 默认关闭 springdoc；其余无 UI | 契约仍以 `contracts/openapi.json` 为准 |
| 端口与启动 | 各栈默认端口不同、安装/构建命令不同 | 记录在 [各栈参考](../reference/stacks.md) |
| 前端实现 | 图表/地图/三维库不同、组件写法不同、像素不要求一致 | 页面存在、能力等价、权限与菜单语义一致 |
| 测试策略 | 内存 SQLite、真实库脚本、Docker 集成测试 | 声称覆盖的行为真的被覆盖 |

并发控制的差异需要单独说明：Spring、NestJS、C# 把 `version` 作为乐观锁比较；Python 会自增但不比较；Go 与 Rust 不维护该列的自增语义。并发编辑在部分栈上因此是后写覆盖。契约没有描述并发语义，所以它目前落在“允许但必须登记”的灰区；如果业务开始依赖“编辑冲突要报错”，它就必须升级为硬边界，而不是继续当作实现细节。

## 4. 不允许的偏差

以下做法经常被误当成“实现风格”，实际已经改变了产品：

- 用 HTTP 200 承载业务失败，只在 `code` 里报错；客户端会把它当成功。
- 换 refresh cookie 的名字、路径或去掉 `HttpOnly`；前端与安全模型同时失效。
- 刷新不轮换、不吊销旧 `jti`，或重放旧 refresh 仍成功。
- 不校验 `token_version`，导致改密、登出、禁用后旧令牌继续可用。
- 把目录权限当作 API 授权，或让菜单接口按用户裁剪。
- 跳过 40302 闸门，或把白名单扩大到业务接口。
- 放宽权限身份唯一性、允许空白 `path`、允许 `menu` 带 `action`。
- 改变分页字段名、错误包体结构或业务码数值。
- 把未实现的端点静默返回空数据，而不是返回 404 或在 README 里声明缺口。

## 5. 偏差登记在各栈 README

每个栈 README 都有“本栈偏差（Deviations）”一节，这是唯一的登记处；`docs/` 不重复维护逐栈差异清单。每条偏差写清五件事：

1. 与基准不同的具体行为，而不是“实现不同”。
2. 原因：语言限制、依赖缺失、部署约束，或有意取舍。
3. 可观察影响：客户端会看到什么，是否影响契约、错误码、权限语义。
4. 覆盖方式：哪条测试、哪次矩阵或哪个冒烟脚本证明它仍然可用。
5. 复核条件：什么情况下必须收敛（例如契约新增字段、并发要求提高）。

“偏差”与“缺口”要分开：偏差是有意为之且可解释的差异；缺口是尚未实现的能力，应单独声明为缺口，并让相关请求明确失败。把未实现写成偏差，等于用文档掩盖不一致。

## 6. 如何证明一致性

一致性靠三层证据，而不是靠代码审查时的直觉：

| 证据 | 覆盖什么 | 局限 |
| --- | --- | --- |
| 各栈单元测试 | 编码策略、权限形状、有效权限、登录锁定等纯规则 | 只证明本栈内部实现，不证明与其他栈一致 |
| 契约验收 `scripts/ci/contract-test.mjs` | 认证、刷新、登出、改密、用户/角色/组织/权限 CRUD、菜单、错误包体、分页、CORS | 跑在 SQLite 上；未覆盖演示页与并发 |
| 数据库矩阵 `scripts/ci/run-db-matrix.mjs` | 同一后端在 PostgreSQL、MySQL、MariaDB、SQLite 上的行为 | 不与契约验收全交叉；三个静态方言不在内 |
| 前端 E2E 与视觉对比 `scripts/e2e/*` | 三前端的关键流程、共享控件、视觉一致性 | 不在 CI 中运行，需要手动触发 |

CI 的映射见 [架构](./architecture.md)。契约验收在 push 时对六个后端各跑一遍，数据库矩阵也在 push 时执行；PR 只跑构建、静态检查与单元测试，因此“合并前必须绿”的保证比“合并后必须绿”弱一档。

## 7. 加栈时要证明什么

新增一个后端，至少要证明：34 个规范 operation 全部可达且状态码/业务码正确；刷新轮换与重放拒绝；40302 白名单；权限融合与禁用语义；四个可执行数据库方言的结构与查询一致；操作日志的记录范围与脱敏。新增一个前端，至少要证明：登录/刷新/登出/强制改密；菜单树渲染与容器跳转；`canView`/`canAct`/角色切换；系统管理五页的完整 CRUD；分页、取消请求与错误提示。具体交付顺序见 [加一套栈](../how-to/add-a-stack.md)，页面移植见 [移植页面](../how-to/port-a-page.md)。

## 8. 取舍

允许偏差是为了让每个栈保持本语言的写法，从而证明契约的可移植性；代价是一致性只能靠测试维持，而测试只覆盖被写出来的断言。最危险的不是已知偏差，而是“没测到所以看起来一致”的行为。登记偏差、明确缺口、把关键语义写进契约测试，是当前规模下成本最低的防线。

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、database/postgres/ddl.sql、.github/workflows/main.yml、scripts/ci/contract-test.mjs、scripts/ci/run-contract.mjs、scripts/ci/run-db-matrix.mjs、backend/springboot/README.md、backend/go-gin-gorm/README.md、backend/python-fastapi/README.md、backend/rust-axum/README.md、backend/springboot/src/main/java/com/orange/security/jwt/JwtUtil.java、backend/go-gin-gorm/internal/auth/token.go、backend/rust-axum/src/auth/jwt.rs、backend/python-fastapi/app/config.py、backend/node-nestjs/src/entities/user.entity.ts、backend/csharp/src/Orange.Api/Data/OrangeDbContext.cs
