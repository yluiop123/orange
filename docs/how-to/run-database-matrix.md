# 跑数据库矩阵

本页解决：在本地或 CI 里让一个后端依次跑 PostgreSQL、MySQL、MariaDB、SQLite，并做契约验收。
读者：改了 SQL、驱动、连接层或准备发版的后端开发者。

## 1. 前置条件

| 依赖 | 要求 |
| --- | --- |
| PostgreSQL | `127.0.0.1:5432`，用户 `postgres` / 密码 `postgres` |
| MySQL | `127.0.0.1:3306`，用户 `root` / 密码 `root` |
| MariaDB | `127.0.0.1:3307`，用户 `root` / 密码 `root` |
| CLI | `psql`、`mysql`、`python3`、Node 都在 `PATH` |
| 后端 | 已经能构建/启动；矩阵脚本负责起停进程 |

最省事的方式是用 Docker 起三个库：`scripts/test-databases.ps1` 默认就用 `orange-test-pg` / `orange-test-mysql` / `orange-test-mariadb` 三个容器。

## 2. 准备测试库

```powershell
# 起容器并加载各引擎的 ddl.sql / dml.sql（默认栈：spring,go,nest,csharp,fastapi）
powershell -File scripts/prepare-stack-databases.ps1

# 只准备指定栈
powershell -File scripts/prepare-stack-databases.ps1 -Stacks spring,rust
```

每个栈会得到独立库 `orange_<stack>`，避免互相污染。

其他开关：

```powershell
powershell -File scripts/test-databases.ps1            # 起容器（可选加载 schema）
powershell -File scripts/test-databases.ps1 -SkipLoad  # 只起容器
powershell -File scripts/test-databases.ps1 -Stop      # 停止并删除容器
```

## 3. 跑矩阵

```bash
# 一个栈跑全部四个引擎
node scripts/ci/run-db-matrix.mjs go

# 指定引擎子集
node scripts/ci/run-db-matrix.mjs fastapi postgres sqlite
```

栈名与 CI 矩阵一致：`spring`、`go`、`nest`、`csharp`、`rust`、`fastapi`。

脚本做的事：按引擎准备 DSN → 启动该栈 → 等健康检查 → 跑同一组 HTTP 检查 → 停进程 → 汇总每个引擎的结果。任一引擎失败即非零退出。

## 4. 跑契约验收（SQLite）

```bash
# 全部后端
node scripts/ci/run-contract.mjs

# 指定后端
node scripts/ci/run-contract.mjs spring rust
```

它在 SQLite 上启动每个后端，并用 `contracts/openapi.json` 校验实现：端点存在性、响应包体、错误码、分页结构，并确认 15 个 deprecated 端点**未**被暴露。

单后端快速验证（后端已在跑）：

```bash
node scripts/ci/contract-test.mjs http://127.0.0.1:8080/api/v1
node scripts/ci/http-smoke.mjs    http://127.0.0.1:8080/api/v1
```

## 5. 在 CI 里的位置

`.github/workflows/main.yml` 的 `backend` job：

- 每个栈都跑测试与构建；
- **只在 push 到 main 时**额外跑 `run-db-matrix` 与 `run-contract`（PR 上不跑，节省时间）；
- service 容器提供 PostgreSQL/MySQL/MariaDB。

因此“PR 绿”不代表矩阵绿；改 SQL 或连接层时请在本地按本页跑一遍。

## 6. 常见失败

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 连接被拒 | 库没起 / 端口不对 | `test-databases.ps1` 检查容器；确认 5432/3306/3307 |
| SQLite 外键不生效 | 连接未执行 `PRAGMA foreign_keys = ON` | 见 [数据库方言](../reference/db-dialects.md) |
| MySQL 约束被忽略 | 版本低于 8.0.16 | 升级或接受差异并登记 |
| 矩阵只在某引擎失败 | 方言差异（时间类型、自增、标识符引号） | 对照方言差异表改 SQL |
| 脚本找不到栈 | 栈名拼写与 CI 矩阵不一致 | 用 `spring/go/nest/csharp/rust/fastapi` |

> Last verified: 24826bb · 2026-11-07
> 事实来源: scripts/prepare-stack-databases.ps1、scripts/test-databases.ps1、scripts/ci/run-db-matrix.mjs、scripts/ci/run-contract.mjs、scripts/ci/contract-test.mjs、scripts/ci/http-smoke.mjs、.github/workflows/main.yml
