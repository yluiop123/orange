# 本地与 CI 跑数据库矩阵

本页说明如何让一个后端依次跑 PostgreSQL、MySQL、MariaDB、SQLite，以及三个本地脚本与 CI 各自的前置条件；要在提交前验证方言差异的维护者读这一页。

## 1. 矩阵是什么

矩阵 = 一个已构建的后端 × 四个引擎。每个引擎都会重建 schema、灌种子、启动服务、跑同一套 HTTP 冒烟。CI 在 `push` 到 `main` 时对六个后端各跑一遍；`pull_request` 阶段不跑。

引擎与方言差异（类型、自增、部分唯一索引、时间戳）见 [数据库方言](../reference/db-dialects.md)；各栈的启动与构建命令见 [技术栈参考](../reference/stacks.md)。

## 2. 三个脚本的分工

| 脚本 | 作用 | 依赖 |
| --- | --- | --- |
| `scripts/test-databases.ps1` | 用 Docker 起三个容器并灌好 schema，打印四个引擎的连接串 | Docker Desktop |
| `scripts/prepare-stack-databases.ps1` | 给每个后端建独立库 `orange_<stack>`，并复制一份 SQLite 文件 | 三个容器已在运行，且容器内已有 `/tmp/ddl.sql`、`/tmp/dml.sql` |
| `scripts/ci/run-db-matrix.mjs` | 按 CI 的方式重置 `orange` 库、启动一个已构建的后端、跑 HTTP 冒烟 | `psql`、`mysql`、`python3`、Node；库在标准端口 |

## 3. 本地起库

在仓库根执行（脚本用相对路径读 `database/`）：

```powershell
powershell -File scripts/test-databases.ps1
```

它会先删掉同名容器，再启动：

| 容器 | 镜像 | 宿主机端口 | 库 |
| --- | --- | --- | --- |
| `orange-test-pg` | `postgres:16` | 55432 | `orange` |
| `orange-test-mysql` | `mysql:8` | 53306 | `orange` |
| `orange-test-mariadb` | `mariadb:11` | 53307 | `orange` |

等待就绪后，它把 `database/{postgres,mysql,mariadb}/{ddl,dml}.sql` 复制进容器并执行，再用 Python 生成 SQLite 文件 `D:\User\Cache\Temp\opencode\orange-test.db`，最后打印四个连接串。`-SkipLoad` 只起容器不灌数据；`-Stop` 删除三个容器后退出。

这一步适合“手动启动一个后端，指到某个引擎”的调试：把打印出的 URL 设为 `DATABASE_URL` 即可。

## 4. 给每个后端分库

`prepare-stack-databases.ps1` 的默认栈是 `spring,go,nest,csharp,fastapi`（不含 `rust`），需要时用 `-Stacks` 显式指定：

```powershell
powershell -File scripts/prepare-stack-databases.ps1 -Stacks spring,go,nest,csharp,rust,fastapi
```

它按栈创建 `orange_<stack>`，SQLite 复制为 `orange-<stack>.db`。两个前置条件必须满足：

1. 三个容器已经在运行；
2. 容器内已有 `/tmp/ddl.sql` 与 `/tmp/dml.sql`——这两个文件由第 3 步的 `test-databases.ps1` 复制进去。只跑本脚本会因找不到 SQL 而失败。

脚本里的容器名与 `D:\User\Cache\Temp\opencode\...` 是写死的，换机器要改脚本或改用 CI 方式。

## 5. 跑 CI 方式的矩阵

`run-db-matrix.mjs` 不复用上面的容器端口，它写死 PostgreSQL `127.0.0.1:5432`、MySQL `3306`、MariaDB `3307`（`postgres`/`root` 凭据），并把 `orange` 库整个重建。要在本地跑，需要另起映射到这些标准端口的容器，或直接依赖 CI。

先构建目标栈（脚本只启动产物，不负责编译）：

```bash
cd backend/go-gin-gorm && go build -o bin/server ./cmd/server
cd backend/python-fastapi && pip install -r requirements-dev.txt
```

然后在仓库根：

```bash
node scripts/ci/run-db-matrix.mjs fastapi                 # 四个引擎
node scripts/ci/run-db-matrix.mjs go postgres sqlite      # 指定引擎
```

脚本对每个引擎执行：重置并灌 `database/<engine>/` → 以 `APP_PORT=8080`、`DB_DRIVER=<engine>`、`DATABASE_URL=<url>` 启动后端 → 跑 `node scripts/ci/http-smoke.mjs http://127.0.0.1:8080/api/v1` → 停止进程。产物位置是各栈的默认输出目录（Spring `target/*.jar`、Go `bin/server`、Nest `dist/main.js`、.NET `out/Orange.Api.dll`、Rust `target/debug/orange-rust-axum`、FastAPI 用 `python3 -m uvicorn`）。

Windows 注意：脚本用 `python3` 载入 SQLite，很多 Windows 环境只有 `python`；没有 `python3` 时先装别名或用 WSL/Git Bash。

## 6. 契约验收（SQLite）

`run-contract.mjs` 只跑 SQLite，但会跑完整契约而不是冒烟：

```bash
node scripts/ci/run-contract.mjs              # 六个后端
node scripts/ci/run-contract.mjs spring go    # 指定后端
```

每个后端用 `os.tmpdir()` 下的新 SQLite 文件，服务端口由 `CONTRACT_PORT` 控制（默认 18080），跑完即停。它同样要求产物已构建；FastAPI 会优先用 `backend/python-fastapi/.venv` 里的解释器，找不到再用 `PYTHON` 环境变量或 `python`/`python3`。Windows 上跑 Spring 产物要设置 `JAVA_HOME`，否则可能用到与编译时不同的 JDK。

## 7. 读失败

- 输出按 `=== <stack> / <engine> ===` 分段，失败会汇总成 `N engine(s) failed` 并以退出码 1 结束。
- 先看是“建库/灌种子失败”还是“服务没起来”还是“冒烟断言失败”：前者查客户端与 SQL 方言，其次看进程日志，最后看冒烟打印的 `FAIL` 行。
- 本地复现单个引擎：`node scripts/ci/run-db-matrix.mjs <stack> <engine>`，比整轮快。
- CI 上矩阵与契约都在 `push` 才跑；PR 通过不代表这两步通过，改后端行为时要本地补跑。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `scripts/test-databases.ps1`、`scripts/prepare-stack-databases.ps1`、`scripts/ci/run-db-matrix.mjs`、`scripts/ci/run-contract.mjs`、`scripts/ci/http-smoke.mjs`、`scripts/ci/README.md`、`.github/workflows/main.yml`、`database/*/{ddl.sql,dml.sql}`
