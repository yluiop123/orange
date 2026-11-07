# 修改接口契约的正确顺序

本页规定改 `contracts/openapi.json` 的顺序与配套动作；要新增/修改端点、字段、错误码或认证行为的维护者按此执行，避免六个后端与三个前端各自漂移。

## 0. 先判断是不是契约变更

- **是**：新增或删除端点、改请求/响应字段、改错误码或 HTTP 状态、改分页结构、改认证方式。
- **不是**：只改某个栈的内部实现；只新增菜单与操作权限数据（走第 4 节的权限目录）；只改样式或文案。

契约变更的判定标准是“客户端可观察到的行为是否变化”，不是“代码是否难写”。

## 1. 先改 `contracts/openapi.json`

该文件是 OpenAPI 3.1.0，人工维护，仓库里没有生成契约本身或校验契约的脚本。改动时保持：

- `paths` 写全 `/api/v1/...`，`security` 仍是 `bearerAuth`。
- 新端点归入现有 tag（`用户管理`、`操作日志`、`组织管理`、`角色管理`、`权限管理`、`login-controller`、`菜单`）；不要为省事新建同义 tag。
- 响应仍是 `{code, message, data, timestamp, traceId}`，分页仍是 `{total, list, page, size, totalPages}`。
- 旧路由继续标 `deprecated`，不要顺手复活；只有 Spring 参考实现保留旧路由映射，其余五个后端不暴露它们。
- 字段名、必填、长度/正则约束与后端 DTO 对齐；契约里写了但实现不校验，等于没有契约。

至少做一次 JSON 可解析检查：

```bash
node -e "JSON.parse(require('fs').readFileSync('contracts/openapi.json','utf8')); console.log('ok')"
```

同一次提交里同步改 [API 参考](../reference/api.md)；端点数量与清单只在那里维护。

## 2. 六个后端一起改

| 栈 | 路由与 DTO 位置 | 最低验证 |
| --- | --- | --- |
| Spring Boot | `controller/**`、`domain/**`、`service/**` | `mvn -B test` |
| Go | `internal/http/*_handler.go`、`internal/http/router.go`、`internal/domain/` | `go test ./...` |
| NestJS | `src/<area>/*.controller.ts`、`src/<area>/dto/`、`src/policies/` | `pnpm test` |
| .NET | `Controllers/*.cs`、`Contracts/{Requests,Responses}.cs`、`Domain/` | `dotnet test Orange.slnx --no-build` |
| Rust | `src/routes/*.rs`、`src/domain/`、`src/response.rs` | `cargo test` |
| FastAPI | `app/routers/*.py`、`app/schemas/*.py`、`app/policies/` | `python -m pytest -q` |

Spring Boot 是行为基准，但基准不是最终裁判：出现分歧时以 `contracts/openapi.json` 与契约测试断言为准。错误码、响应包体、`X-Trace-Id` 回显、登录锁定与 40302 闸门都不能因改字段而变形。

## 3. 再改三个前端

React 的类型由契约生成，不要手写：

```bash
cd frontend/react
pnpm gen:api
```

它执行 `openapi-typescript ../../contracts/openapi.json -o src/api/schema.d.ts`；生成物要随契约一起提交，之后在 `src/api/types.ts`、`src/api/system/*.ts` 里按新类型调整调用。

Vue 与 Angular 没有生成脚本，类型是手写的：

- Vue：`src/api/types.ts` 与 `src/api/<area>.ts`。
- Angular：`src/app/core/models.ts` 与 `src/app/core/system-api.service.ts`。

三端都要检查 envelope 解包、分页字段、错误码分支与 refresh 流程；字段改名要全局搜索，不能只改页面。页面的新增/同步流程见 [同步一个页面](port-a-page.md)。

## 4. 权限目录与种子（仅当权限模型变化）

权限的权威数据是 `database/permissions.json`，不是各前端的副本：

```bash
npm run permissions:sync
```

它会更新 React/Vue 的 `src/config/permissions.json` 与 `database/postgres/dml.sql` 的生成块。两个必须知道的边界：

- `scripts/sync-permission-seed.mjs` 只写 PostgreSQL 的 `dml.sql`；`database/{mysql,mariadb,sqlite,opengauss,oceanbase,goldendb}/dml.sql` 里的生成块要手工同步，否则不同引擎的种子不一致。
- `npm run permissions:check` 只校验目录副本与 PostgreSQL 种子，不会发现其他引擎的漂移。

DDL 变化要同时改各引擎的 `database/<engine>/ddl.sql`，并更新 [数据模型](../reference/data-model.md)、[数据库方言](../reference/db-dialects.md) 与 [权限模型](../reference/permission-model.md)。

## 5. 跑契约与冒烟

按成本从低到高：

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:<后端端口>/api/v1   # 单栈快速自检
node scripts/ci/contract-test.mjs http://127.0.0.1:<端口>/api/v1     # 对已运行的服务跑完整断言
node scripts/ci/run-contract.mjs                                     # 六个后端，SQLite，自动起停
node scripts/ci/run-db-matrix.mjs <stack>                            # 改了 SQL/方言时跑四引擎
```

`run-contract.mjs` 要求目标栈都已构建；`run-db-matrix.mjs` 的前置与端口要求见 [数据库矩阵](run-database-matrix.md)。前端侧至少跑三栈的 typecheck、test 与 build，React 还要确认 `schema.d.ts` 与契约一致。

根检查：`node scripts/check-config.mjs`、`npm run permissions:check`、`npm run docs:check`（动了配置、权限或文档时）。

## 6. 文档同批更新

| 变化 | 必须更新 |
| --- | --- |
| 任何端点/字段/错误码 | [API 参考](../reference/api.md) |
| 表、列、索引、种子 | [数据模型](../reference/data-model.md)、[数据库方言](../reference/db-dialects.md) |
| 权限类型/身份/菜单语义 | [权限模型](../reference/permission-model.md)、[权限与菜单](../explanation/permission-and-menu.md) |
| 认证/刷新/吊销 | [登录与会话](../explanation/auth-lifecycle.md) |
| 新环境变量 | [配置参考](../reference/configuration.md)、[Backend 配置](../backend/configuration.md) |
| 新脚本或参数 | [脚本参考](../reference/scripts.md) |

## 7. 完成标准

- 契约、六个后端、三个前端、文档在同一个 PR 里改完，没有“下个 PR 再补”的栈。
- 没有未登记的 error code，没有未标 `deprecated` 的旧路由。
- 六栈契约验收通过；改方言时四引擎矩阵通过。
- PR 描述写明是否 breaking、旧客户端会看到什么、回滚方式。

## 反模式

- 先改 Spring，再回头“同步”契约。
- 只改 React 的生成类型，漏掉 Vue/Angular 的手写类型。
- 改了 `database/permissions.json` 却没有重灌种子，或只同步了 PostgreSQL。
- 只跑单栈冒烟就宣布契约改完。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `contracts/openapi.json`、`frontend/react/package.json`、`frontend/react/src/api/schema.d.ts`、`frontend/vue/src/api/types.ts`、`frontend/angular/src/app/core/{models.ts,system-api.service.ts}`、`database/permissions.json`、`scripts/{sync-permission-catalog,sync-permission-seed}.mjs`、`scripts/ci/{http-smoke,contract-test,run-contract,run-db-matrix}.mjs`、`.github/workflows/main.yml`、六个后端的 `controller|handler|routes` 与 DTO 目录
