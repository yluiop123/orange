# 新增一套前端或后端

本页是维护者新增第 4 个前端或第 7 个后端时的完整清单：契约、数据库、CI、脚本、文档、测试六处都要接上，缺一处就不算完成。先读 [架构说明](../explanation/architecture.md) 的目录边界规则。

## 0. 先判定你加的是哪一类

- **新后端**：实现既有契约，不修改契约。契约是 `contracts/openapi.json`，规范 operation 的数量与清单见 [API 参考](../reference/api.md)。
- **新前端**：消费既有契约，页面路径、权限身份与现有三端保持一致。
- **新数据库引擎**：只有确实要新增运行时引擎时才动 `database/`；只提供静态 SQL 的引擎不算运行时支持。

## 1. 契约（两类新栈都适用）

新实现必须满足：

- `/api/v1` 前缀、`{code, message, data, timestamp, traceId}` 包体、分页 `{total, list, page, size, totalPages}`。
- `Authorization: Bearer <access token>`；refresh token 走 HttpOnly Cookie `refresh_token`，`Path=/api/v1/auth`。
- 错误码与 HTTP 状态映射、`X-Trace-Id` 回显、登录锁定与强制改密（40302）行为一致。
- 不实现 `contracts/openapi.json` 中标记 `deprecated` 的旧路由（Spring 参考实现为兼容旧前端仍保留它们，新实现不要跟随）。

契约不是为新实现让路的：如果实现与契约冲突，改实现；确需改契约，按 [修改契约](../how-to/change-the-contract.md) 的顺序一次改完六个后端与三个前端。

## 2. 数据库

- 复用 `database/<engine>/{ddl.sql,dml.sql}`，应用不建表、不做迁移；`ddl.sql` 建表，`dml.sql` 灌种子。
- 新引擎要新增 `database/<engine>/` 两件套，并在 [数据库方言](../reference/db-dialects.md) 登记差异（类型、自增、部分唯一索引、时间戳）。
- 连接配置沿用现有变量名：`DATABASE_URL` 优先，其次 `DB_DRIVER` 加 `DB_*`；Spring Boot 是 `SPRING_DATASOURCE_URL` / `DB_URL`。变量清单进 [配置参考](../reference/configuration.md)。

## 3. 新后端的代码与测试

按现有六栈的最小分层落目录：

```text
<entry>            进程入口、优雅关闭
<config>           环境变量、连接串、方言选择
<auth>             JWT、refresh Cookie、RBAC 守卫、登录锁定
<controllers>      HTTP 路由、请求校验、响应包体
<services>         业务规则、树与引用守卫、分页
<domain|policies>  纯策略：编码形状、权限形状、有效权限、菜单树
<tests>            单元测试 + 可被冒烟脚本覆盖的 HTTP 入口
```

现有位置可直接对照：Spring 的 `controller/` 与 `service/`、Go 的 `internal/http/` 与 `internal/domain/`、Nest 的 `src/<area>/`、C# 的 `Controllers/` 与 `Domain/`、Rust 的 `src/routes/` 与 `src/domain/`、FastAPI 的 `app/routers/` 与 `app/schemas/`。策略不要写进 HTTP 层，否则契约测试会先暴露分层问题。

测试至少要覆盖：登录/刷新/登出、RBAC 40301、强制改密 40302、用户/角色/组织/权限四类实体的 CRUD、权限身份冲突 40901、操作日志。HTTP 级行为可以直接复用 `scripts/ci/http-smoke.mjs` 与 `scripts/ci/contract-test.mjs`。

## 4. 新前端的代码与测试

- **页面与路由**：页面路径必须等于 `database/permissions.json` 里的 `path`；React 由文件树自动注册，Vue/Angular 要显式加路由（见 [同步一个页面](port-a-page.md)）。
- **权限**：菜单只渲染启用的 `menu`/`directory` 节点，并按当前账号的 `rolePermissions` 过滤；叶子用 `canView(path)`，操作按钮用 `canAct(path, action)`；无权限跳 `/forbidden`。
- **会话**：内存保存 access token，启动时用 refresh Cookie 恢复；401 只刷新一次；40302 打开不可关闭的改密对话框。
- **i18n 与主题**：zh/en 两套文案，主题切换与语言菜单要和现有三端一致（`scripts/e2e/check-controls.mjs` 校验这些共享控件）。
- **mock**：内置 `super/super` 等种子账号，能脱离后端走完登录、菜单、CRUD；mock 开关的写法参考 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)。

## 5. CI

后端（`.github/workflows/main.yml`）：

1. `backend.strategy.matrix.stack` 加栈名（现有 `spring`、`go`、`nest`、`csharp`、`rust`、`fastapi`）。
2. `Test and build` 的 `case` 加分支：测试命令 + 构建命令，失败即退出。
3. 工具链安装步骤按需加 `if: matrix.stack == '<name>'`。
4. 数据库矩阵与契约验收是 `push` 才跑的步骤，脚本支持后会自动覆盖新栈。

前端：新增 `frontend-<stack>` job，步骤与现有三个 job 对齐：安装（锁文件必须提交）→ lint → 测试 → 构建；如要发布 Pages，再加部署步骤。

## 6. 脚本

- `scripts/ci/run-db-matrix.mjs`：在 `url`、`jdbc`、`startCommand` 三处加新栈。
- `scripts/ci/run-contract.mjs`：在 `startCommand` 与默认 `stacks` 列表加新栈；SQLite 建库逻辑共用。
- `scripts/e2e/`：新前端要有 `mock-<stack>.mjs` 与 `real-<stack>.mjs`；`parity.mjs` 的 `APPS` 数组加一项（base、route、等待条件）。
- 若新前端消费权限目录，把路径加进 `scripts/sync-permission-catalog.mjs` 的 `targets`，否则 `npm run permissions:check` 管不到它。

## 7. 文档

- 新后端/前端目录下的 `README.md`：只写命令、目录、本栈偏差，不重抄端点与端口。
- [技术栈参考](../reference/stacks.md)：加一行端口/命令；这是端口的唯一事实源。
- [配置参考](../reference/configuration.md) 或 [Backend 配置](../backend/configuration.md)：加变量与默认值。
- 新引擎进 [数据库方言](../reference/db-dialects.md)；新脚本进 [脚本参考](../reference/scripts.md)；契约变了才动 [API 参考](../reference/api.md)。
- 需要从文档地图进入的，补 [文档索引](../index.md)。

## 8. 验收

- 该栈的测试与构建全部通过；Go 还要 `gofmt -l .` 为空与 `go vet ./...`。
- 后端：`http-smoke` 与 `contract-test` 通过；`run-db-matrix` 四引擎通过。
- 前端：lint/typecheck/test/build 通过；mock 与真实后端 E2E 通过；视觉改动跑 `parity.mjs`。
- 根检查：`node scripts/check-config.mjs`、`npm run permissions:check` 与 `npm run docs:check` 通过。
- 没有为了迁就新实现去改契约、改别人的目录或放宽已有断言。

## 反模式

- 先写实现，最后“补一下契约”。
- 把已标 `deprecated` 的旧路由重新暴露给新客户端。
- 在 README 里重抄端口表或端点表，制造第二份真相。
- 只加 CI job，不给矩阵/契约脚本加分支，CI 会静默跳过新栈。
- 新前端只做页面，不接权限、菜单与 refresh Cookie。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `contracts/openapi.json`、`database/*/{ddl.sql,dml.sql}`、`.github/workflows/main.yml`、`scripts/ci/{run-db-matrix,run-contract,http-smoke,contract-test}.mjs`、`scripts/e2e/parity.mjs`、`scripts/sync-permission-catalog.mjs`、`frontend/*/package.json`、`backend/*/README.md`
