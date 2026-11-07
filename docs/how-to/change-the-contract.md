# 修改契约

本页解决：改一个接口时，从机器契约到九套实现的正确顺序。
读者：维护者。核心规则是**一次改完，不允许任何一套实现单独漂移**。

## 1. 契约在哪

| 位置 | 作用 |
| --- | --- |
| [`contracts/openapi.json`](../../contracts/openapi.json) | 唯一机器可读契约（33 path / 49 operation / 15 deprecated） |
| [`docs/reference/api.md`](../reference/api.md) | 人工版契约，与 JSON 逐条对应 |
| [`docs/reference/data-model.md`](../reference/data-model.md) | 字段与约束（改 schema 时同步） |

## 2. 改动顺序

### 2.1 改机器契约

编辑 `contracts/openapi.json`：

- 新增端点：加 `paths` 条目，`operationId` 全局唯一，补 `summary`、请求/响应 schema。
- 修改端点：改 schema 或参数，**不要**复用旧 `operationId`。
- 废弃端点：加 `"deprecated": true`，不要直接删除（契约测试会核对“规范实现不暴露 deprecated 端点”）。
- 新错误码：先确认后端已有对应 `ErrorCode`，否则同时改后端枚举。

### 2.2 改人工契约

同步 `docs/reference/api.md` 的端点表、错误码表、请求体表；文末刷新 `Last verified`。

### 2.3 改六个后端

每个后端都要改，缺一不可：

| 后端 | 关注点 |
| --- | --- |
| Spring Boot | controller + DTO + `ErrorCode`；契约基准，先改它 |
| Go | handler + DTO + 错误映射 |
| NestJS | controller + DTO（class-validator）+ 异常过滤器 |
| .NET | controller + Contracts DTO + 异常中间件 |
| Rust | handler + 反序列化结构 + 错误类型 |
| FastAPI | router + Pydantic 模型 + 异常处理 |

同时更新各自单测；改了 SQL 还要跑 [数据库矩阵](./run-database-matrix.md)。

### 2.4 改三个前端

| 前端 | 类型来源 | 生成/更新方式 |
| --- | --- | --- |
| React | `src/api/schema.d.ts` | `cd frontend/react && pnpm gen:api`（由 openapi-typescript 生成，不要手改） |
| Vue | `src/api/types.ts` | 手写类型，按新契约更新 |
| Angular | `src/app/core/models.ts` | 手写类型，按新契约更新 |

然后改对应的 api 模块与页面调用；权限相关的字段变化还要同步 `access` 逻辑（React `src/lib/access.ts`、Angular `src/app/core/access.ts`）。

### 2.5 跑验证

```bash
# 单后端快速验证
node scripts/ci/http-smoke.mjs    http://127.0.0.1:8080/api/v1
node scripts/ci/contract-test.mjs http://127.0.0.1:8080/api/v1

# 全后端契约验收（SQLite）
node scripts/ci/run-contract.mjs

# 前端
cd frontend/react && pnpm typecheck && pnpm test
```

## 3. 验收清单

- [ ] `contracts/openapi.json` 与 `docs/reference/api.md` 一致
- [ ] 六个后端都实现/移除了对应行为
- [ ] 前端类型已重新生成/更新，`typecheck` 通过
- [ ] `run-contract.mjs` 全绿（含“未暴露 deprecated 端点”）
- [ ] 受影响的 reference 页刷新了 `Last verified`
- [ ] 同一个提交里完成，提交信息写明契约变更

## 4. 常见错误

| 错误 | 后果 |
| --- | --- |
| 只改一个后端 | 契约测试红，其他栈行为漂移 |
| 改 `openapi.json` 但没跑 `pnpm gen:api` | React 类型与实际响应不一致 |
| 直接删 deprecated 端点 | 契约测试把它当“规范端点缺失” |
| 新错误码只写在文档 | 其他后端无法对齐 |

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、frontend/react/package.json（gen:api）、frontend/react/src/api/schema.d.ts、frontend/vue/src/api/types.ts、frontend/angular/src/app/core/models.ts、scripts/ci/contract-test.mjs
