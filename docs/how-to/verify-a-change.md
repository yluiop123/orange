# 提交前验证与读 CI 失败

本页列出各栈在提交前该跑的命令、根目录的只读检查，以及 CI 失败时从哪里看；准备提 PR 或正在排查红叉的人按改动范围取用。

## 1. 按改动选命令

| 改动 | 命令（在对应栈目录） |
| --- | --- |
| React | `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`（发布用 `pnpm build:github`） |
| Vue | `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` |
| Angular | `npm run lint`、`npm test -- --watch=false`、`npm run build` |
| Spring Boot | `mvn -B test`、`mvn -B -DskipTests package` |
| Go | `gofmt -l .`（输出必须为空）、`go vet ./...`、`go test ./...`、`go build ./...`、`go build -o bin/server ./cmd/server` |
| NestJS | `pnpm typecheck`、`pnpm test`、`pnpm build` |
| .NET | `dotnet build Orange.slnx`、`dotnet test Orange.slnx --no-build`、`dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` |
| Rust | `cargo test`、`cargo build` |
| FastAPI | `python -m pytest -q` |

Angular 没有单独的 `typecheck` 脚本，`ng build` 会做类型检查。安装依赖用各栈锁文件对应的包管理器：React 用 pnpm 10.28.2、Vue 用 pnpm 12.15.0、Angular 用 npm。

## 2. 根目录只读检查

任何改动都先跑：

```bash
node scripts/check-config.mjs
npm run permissions:check
npm run docs:check
```

- `check-config.mjs` 校验五个后端的 `.env.example`（`JWT_SECRET`、`JWT_ISSUER`、`JWT_ACCESS_EXPIRE`、`JWT_REFRESH_EXPIRE`，且不得出现旧变量名）、Spring 的 `application-local.example.yaml`（issuer 与两个有效期），以及三个前端的 API 前缀是否都是 `/api/v1`。它不校验端口。
- `permissions:check` 校验 React/Vue 的权限目录副本与 `database/postgres/dml.sql` 的生成块是否最新。失败时先跑 `npm run permissions:sync`，再复查；其他引擎的种子它不管。
- `docs:check` 校验所有 Markdown 的相对链接是否存在，不校验内容；它目前不在 CI 里，属于本地自查。

## 3. 契约与冒烟

| 目的 | 命令 |
| --- | --- |
| 单栈快速自检 | `node scripts/ci/http-smoke.mjs http://127.0.0.1:<port>/api/v1` |
| 对已运行服务跑完整断言 | `node scripts/ci/contract-test.mjs http://127.0.0.1:<port>/api/v1` |
| 六栈契约验收（SQLite） | `node scripts/ci/run-contract.mjs [stack...]` |
| 四引擎矩阵 | `node scripts/ci/run-db-matrix.mjs <stack> [engines...]` |

后两条要求目标栈已构建，前置条件见 [数据库矩阵](run-database-matrix.md)。契约改动的完整顺序见 [修改契约](change-the-contract.md)。

## 4. 前端 E2E 与视觉校验

```bash
cd scripts/e2e
npm install
node mock-react.mjs      # 或 mock-vue.mjs / mock-angular.mjs
node real-react.mjs      # 需关 mock 并指向真实后端
node parity.mjs          # 三端截图 + diff
```

这些脚本不在 CI 里跑，属于发布前本地验证；Angular 跑 mock/parity 前要把 `environment.local.ts` 的 `mock` 设为 `true`。

## 5. CI 有哪些 job

`.github/workflows/main.yml` 在 `pull_request` 到 `main`、`push` 到 `main` 和手动触发时运行：

| job | 做什么 | 备注 |
| --- | --- | --- |
| `config` | `check-config.mjs` + `permissions:check` | 5 分钟超时 |
| `frontend-react` | install → lint → typecheck → test → `build:github` | push 时上传 Pages 产物 |
| `frontend-angular` | `npm ci` → lint → test → build | — |
| `frontend-vue` | install → typecheck → lint → test → build | — |
| `backend` | 六栈矩阵：各自 test + build | push 时再跑数据库矩阵与契约验收 |
| `deploy` | 部署 React 到 GitHub Pages | 仅 push，依赖 `frontend-react` |

没有路径过滤：只改文档也会触发全部 job。PR 阶段不跑数据库矩阵、契约验收和 Pages 部署，所以“PR 通过”不等于后端行为已验证。

## 6. 读失败

1. **先看 job 名**：`backend (go)` 这类名字里的括号就是矩阵栈名，对应 `Test and build` 里的 `case` 分支。
2. **再看 step 名**：`install`、`lint`、`typecheck`、`test`、`build`、`Database matrix`、`Contract acceptance` 各自独立。
3. **后端看第一条错误**：命令块用 `set -euo pipefail`，第一个失败的命令就中止，后面的步骤不会执行。
4. **区分 PR 与 push**：`Database clients`、`Database matrix`、`Contract acceptance` 只存在于 push 运行；PR 上缺失是正常的。
5. **本地复现**：进到 workflow 里写的同一个 `working-directory` 跑同一条命令。Linux CI 与 Windows 本地的差异主要在路径大小写、`python3` 是否存在、SQLite 路径与换行符。

常见原因：

- `pnpm install --frozen-lockfile` 失败：锁文件没跟着 `package.json` 更新，本地补跑 `pnpm install` 并提交锁文件。
- `gofmt -l .` 有输出：Go 文件没格式化，跑 `gofmt -w .`。
- `check-config` 失败：`.env.example` 的 JWT 变量或前端 API 前缀被改动，按报错文件逐项对齐。
- `permissions:check` 失败：权限目录或种子过期，跑 `npm run permissions:sync` 并检查其他引擎种子。
- `mvn test` 里 Testcontainers 跳过：本机没有 Docker 时的正常行为，不算失败。
- Pages 部署失败：只在 push 到 `main` 时发生，先确认 `frontend-react` 的 `build:github` 通过。

## 7. 提交前清单

- 改动范围内的命令全部通过，且是最近一次修改之后跑的。
- 根目录三条只读检查通过。
- 契约/数据库/权限改动补跑了对应的契约与矩阵。
- 新增或改名的文档相对链接指向存在的文件（`npm run docs:check`）。
- `git status` 里没有 `node_modules`、构建产物、本地 `.env*`、密钥或 `*.db`。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `frontend/{react,vue,angular}/package.json`、`backend/*/README.md`、`.github/workflows/main.yml`、`scripts/check-config.mjs`、`scripts/check-docs-links.mjs`、根 `package.json`、`scripts/ci/{http-smoke,contract-test,run-contract,run-db-matrix}.mjs`、`scripts/e2e/package.json`
