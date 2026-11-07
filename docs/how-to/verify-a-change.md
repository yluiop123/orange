# 提交前验证

本页解决：改完代码该跑哪些检查、每个命令覆盖什么、CI 红了怎么定位。
读者：准备提交改动的开发者与 review 者。

## 1. 按改动范围选检查

### 只改前端

```bash
cd frontend/react && pnpm lint && pnpm typecheck && pnpm test && pnpm build
cd frontend/vue   && pnpm lint && pnpm typecheck && pnpm test && pnpm build
cd frontend/angular && npm run lint && npm test -- --watch=false && npm run build
```

只跑你改的那一套即可，但**三前端同步的改动要三套都跑**（见 [同步一个页面](./port-a-page.md)）。

### 只改后端

```bash
# Spring
cd backend/springboot && mvn -B test

# Go
cd backend/go-gin-gorm && gofmt -l . && go vet ./... && go test ./...

# Nest
cd backend/node-nestjs && pnpm typecheck && pnpm test

# .NET
cd backend/csharp && dotnet build Orange.slnx && dotnet test Orange.slnx --no-build

# Rust
cd backend/rust-axum && cargo test

# FastAPI
cd backend/python-fastapi && python -m pytest -q
```

改了 HTTP 行为时加跑冒烟与契约验收（后端要先起起来）：

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:<port>/api/v1
node scripts/ci/contract-test.mjs http://127.0.0.1:<port>/api/v1
```

### 改配置模板 / 权限目录 / 文档

```bash
node scripts/check-config.mjs      # 配置模板自洽
npm run permissions:check          # 权限目录与种子同步
npm run docs:check                 # 文档相对链接全部可达
```

### 改契约或数据库

除了上面的检查，还要跑数据库矩阵与契约验收（至少 SQLite），见 [跑数据库矩阵](./run-database-matrix.md)。契约改动必须九套实现同步，见 [修改契约](./change-the-contract.md)。

## 2. CI 在跑什么

`.github/workflows/main.yml` 有这些 job：

| job | 内容 | 常见失败原因 |
| --- | --- | --- |
| `config` | `check-config.mjs` + `permissions:check` | 改了 `.env.example`/权限目录但没同步另一处 |
| `frontend-react` | lint → typecheck → test → build:github | 类型错误、未使用的导入、测试快照 |
| `frontend-angular` | `npm ci` → lint → test → build | 锁文件与 `package.json` 不一致 |
| `frontend-vue` | typecheck → lint → test → build | 同 React |
| `backend` | 矩阵 `[spring, go, nest, csharp, rust, fastapi]`，push 时加跑 `run-db-matrix` 与 `run-contract` | 某栈编译失败、方言 SQL 不兼容、契约行为漂移 |
| `deploy` | push 时把 React 产物发布到 Pages | 只在 main 上跑 |

## 3. 读 CI 失败

1. 先看 **job 名**定位栈：`frontend-*` 或 `backend (stack)`。
2. 再看**步骤名**：`lint`/`typecheck`/`test`/`build` 对应本地同一命令。
3. 数据库矩阵失败通常是 SQL 方言问题：对照 [数据库方言](../reference/db-dialects.md) 的差异表。
4. 契约验收失败是行为漂移：对照 [HTTP 契约](../reference/api.md) 的端点与错误码，确认是哪一套实现偏离。

## 4. 本地跑完整 CI 的边界

- 配置与权限校验可以完全本地跑（不需要服务）。
- 前端三套可以完全本地跑。
- 数据库矩阵需要本机有 PostgreSQL 5432 / MySQL 3306 / MariaDB 3307 与对应 CLI，见 [跑数据库矩阵](./run-database-matrix.md)。
- E2E 与视觉对比不在 CI 里，属于发布前本地验证（`scripts/e2e/*`）。

## 5. 提交前自检清单

- [ ] 改动的栈本地 lint/typecheck/test 全绿
- [ ] 改了 HTTP 行为：冒烟 + 契约验收通过
- [ ] 改了配置模板：`check-config.mjs` 通过
- [ ] 改了权限数据：`npm run permissions:check` 通过
- [ ] 改了文档：`npm run docs:check` 通过，且刷新了 `Last verified`
- [ ] 一次提交只做一类改动；契约改动一次改完

> Last verified: 24826bb · 2026-11-07
> 事实来源: .github/workflows/main.yml、frontend/*/package.json、backend/*/package.json|pom.xml|go.mod|Cargo.toml、package.json
