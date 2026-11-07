# 脚本参考

本页解决：`scripts/` 下 17 个脚本各自做什么、怎么调用、CI 里用哪些。
读者：要跑全量验证、批量准备数据库、做跨栈对比的开发者与维护者。

所有脚本都可从仓库根执行；`.ps1` 面向 Windows 本地，`scripts/ci/*` 面向 Linux/CI。

## 1. 根目录脚本

| 脚本 | 用途 | 用法 |
| --- | --- | --- |
| `check-config.mjs` | 只读校验提交的配置模板是否自洽（端口/变量/文档引用） | `node scripts/check-config.mjs` |
| `generate-jwt-keys.mjs` | 生成 RSA 密钥对到 `backend/springboot/src/main/resources/keys/`；已存在时需 `--force` 才覆盖 | `node scripts/generate-jwt-keys.mjs [--force]` |
| `sync-permission-catalog.mjs` | 把权威权限目录同步到消费它的前端 | `node scripts/sync-permission-catalog.mjs [--check]` |
| `sync-permission-seed.mjs` | 同步权限种子数据 | `node scripts/sync-permission-seed.mjs [--check]` |
| `prepare-stack-databases.ps1` | 用 Docker 准备各栈测试库（PG/MySQL/MariaDB/SQLite） | `powershell -File scripts/prepare-stack-databases.ps1 -Stacks spring,go,nest,csharp,fastapi` |
| `test-databases.ps1` | 启动/停止测试库容器并可选加载 schema | `powershell -File scripts/test-databases.ps1 [-Stop] [-SkipLoad]` |

根 `package.json` 把两条同步脚本组合成：

```bash
npm run permissions:sync    # 写入
npm run permissions:check   # 只校验（CI 用）
```

## 2. `scripts/ci/`（Linux/CI）

| 脚本 | 用途 | 用法 |
| --- | --- | --- |
| `http-smoke.mjs` | 对任意后端跑同一组 HTTP 冒烟（登录 `super/super`、响应包体、user-info、菜单、用户列表、组织增删查、操作日志、登出；登录最多重试 90s） | `node scripts/ci/http-smoke.mjs <baseUrl>`，如 `http://127.0.0.1:8080/api/v1` |
| `contract-test.mjs` | 契约验收：按 `contracts/openapi.json` 校验某个后端的实现 | `node scripts/ci/contract-test.mjs <baseUrl>` |
| `run-contract.mjs` | 对单个或多个后端在 SQLite 上跑完整契约验收 | `node scripts/ci/run-contract.mjs [stack...]` |
| `run-db-matrix.mjs` | 让一个已构建后端依次跑 PostgreSQL/MySQL/MariaDB/SQLite | `node scripts/ci/run-db-matrix.mjs <stack> [engines...]`；栈名同 CI 矩阵：`spring`/`go`/`nest`/`csharp`/`rust`/`fastapi` |

`run-db-matrix.mjs` 的环境要求：PostgreSQL `127.0.0.1:5432`、MySQL `3306`、MariaDB `3307`（`postgres`/`root` 凭据），`psql`、`mysql`、`python3`、Node 在 `PATH` 上。

## 3. `scripts/e2e/`（Playwright）

依赖见 `scripts/e2e/package.json`（`playwright` 固定版本）。

| 脚本 | 用途 | 用法 |
| --- | --- | --- |
| `parity.mjs` | 三前端视觉一致性：截图 + diff，输出 MAE 与像素差异占比 | `node scripts/e2e/parity.mjs [--tabs=...] [--themes=...] [--colors=...] [--out=dir]` |
| `mock-react.mjs`、`mock-vue.mjs`、`mock-angular.mjs` | 以 mock 模式驱动对应前端跑 E2E | `node scripts/e2e/mock-<stack>.mjs` |
| `real-react.mjs`、`real-vue.mjs`、`real-angular.mjs` | 以真实后端驱动对应前端跑 E2E | `node scripts/e2e/real-<stack>.mjs` |
| `check-controls.mjs` | 校验共享头部/登录控件：语言菜单数据驱动、主题切换与持久化 | `node scripts/e2e/check-controls.mjs` |

parity 的截图协议（分辨率、locale、动画、滚动位置、diff 阈值）定义在 `.scratch/ui-parity/spec.md`，属于内部约定，不随文档发布。

## 4. 与 CI 的对应关系

| CI 步骤 | 脚本 |
| --- | --- |
| `config` job | `scripts/check-config.mjs` + `npm run permissions:check` |
| `backend` job（push 时） | `scripts/ci/run-db-matrix.mjs <stack>` |
| `backend` job（push 时） | `scripts/ci/run-contract.mjs <stack>` |

E2E 与 parity 不在 CI 里跑，属于发布前的本地验证。

> Last verified: 24826bb · 2026-11-07
> 事实来源: scripts/*.mjs、scripts/*.ps1、scripts/ci/*.mjs、scripts/e2e/*.mjs、scripts/e2e/package.json、.github/workflows/main.yml
