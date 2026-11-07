# 切换后端数据库

本页给六个后端在 PostgreSQL / MySQL / MariaDB / SQLite 之间切换的可执行步骤：先初始化什么、改哪些变量、失败时先查哪里；读者是要换库或排查连接问题的开发者。方言与建表语句的差异见 [数据库方言](../reference/db-dialects.md)，变量全表见 [后端配置](./configuration.md)。

## 1. 切换前必须做的两件事

1. 建库：PostgreSQL/MySQL/MariaDB 先创建数据库（示例名 `orange`）；SQLite 是文件，不需要建库服务。
2. 灌结构与种子：对目标引擎执行 `database/<engine>/ddl.sql`，再执行 `database/<engine>/dml.sql`。命令见 [数据库方言](../reference/db-dialects.md) 的“加载方式”；要一次准备多栈，用 [脚本参考](../reference/scripts.md) 里的 `prepare-stack-databases.ps1`。

六个后端都不建表：Spring `ddl-auto: none`，NestJS `synchronize: false`，Rust/C#/Go/Python 也只读现有 schema。没灌 DDL 就启动，第一个查询会报表不存在。

## 2. 六个后端的连接变量

| 后端 | 引擎 | 连接串（优先） | 离散连接 | SQLite 路径 |
| --- | --- | --- | --- | --- |
| Spring Boot | `DB_DRIVER` | `SPRING_DATASOURCE_URL`（次选 `DB_URL`） | `DB_HOST`/`DB_PORT`/`DB_NAME`，用户密码用 `DB_USER`/`DB_PASSWORD` | 写进 JDBC URL：`jdbc:sqlite:<path>` |
| Go | `DB_DRIVER` | `DATABASE_URL` | `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_SSLMODE`/`DB_TIMEZONE` | `DB_PATH`（兼容 `SQLITE_PATH`） |
| NestJS | `DB_DRIVER` | `DATABASE_URL` | `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_SSL` | `DB_NAME`，或 URL 里的路径 |
| ASP.NET Core | `DB_DRIVER` | `DATABASE_URL` | `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` | `SQLITE_PATH`（次选 `DB_NAME`） |
| Rust | `DB_DRIVER` | `DATABASE_URL` | `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` | `DB_FILE`（回退 `DB_NAME`） |
| FastAPI | `DB_DRIVER` | `DATABASE_URL` | `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` | `DB_NAME`，或 URL 里的路径 |

规则：`DATABASE_URL` 一旦设置就覆盖离散变量；不设 `DB_DRIVER` 时按 URL scheme 推断，仍推断不出就用 PostgreSQL；MariaDB 与 MySQL 共用协议，URL 写 `mariadb://` 或 `mysql://` 都能连。

## 3. 四个引擎的最小配置

PostgreSQL：

```bash
DB_DRIVER=postgres
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/orange
# Spring 用 JDBC（DB_DRIVER 可省略，由 URL 推断）：
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/orange
```

MySQL：

```bash
DB_DRIVER=mysql
DATABASE_URL=mysql://root:root@127.0.0.1:3306/orange
# Spring：
SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/orange
```

MariaDB（CI 与 `run-db-matrix.mjs` 把它映射到 3307）：

```bash
DB_DRIVER=mariadb
DATABASE_URL=mariadb://root:root@127.0.0.1:3307/orange
# Spring 两种 URL 都可以，jdbc:mariadb: 会被改写成 jdbc:mysql:
SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3307/orange
```

SQLite：

```bash
DB_DRIVER=sqlite
# Go：DB_PATH=./orange-go.db；Rust：DB_FILE=./orange.db；
# C#：SQLITE_PATH=./orange-csharp.db；Nest/Python：DB_NAME=./orange.db
DATABASE_URL=./orange.db
# Spring：
SPRING_DATASOURCE_URL=jdbc:sqlite:./orange.db
```

SQLite 文件必须提前用 `database/sqlite/ddl.sql` + `dml.sql` 初始化；空文件能连上，但所有查询都会因缺表失败。

## 4. 验证切换

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:8080/api/v1   # 换成实际端口
node scripts/ci/run-db-matrix.mjs <stack>                    # 单栈跑四个引擎，需已构建
node scripts/ci/run-contract.mjs <stack>                     # SQLite 契约验收，自动初始化
```

`run-db-matrix.mjs` 要求 PostgreSQL 在 `127.0.0.1:5432`、MySQL 在 `3306`、MariaDB 在 `3307`，且 `psql`、`mysql`、`python3` 在 `PATH` 上。栈名是 `spring`/`go`/`nest`/`csharp`/`rust`/`fastapi`。

## 5. 常见错误

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| Spring 报 `DB_DRIVER=... does not match the JDBC URL` | 驱动与 URL 不是同一引擎 | 统一二者，或删掉 `DB_DRIVER` 让 URL 决定 |
| Spring 报 `Cannot determine the database engine from JDBC URL` | URL 不是 `jdbc:postgresql:`/`jdbc:mysql:`/`jdbc:mariadb:`/`jdbc:sqlite:` 开头 | 显式设 `DB_DRIVER`，并检查 URL scheme |
| C# 报 `DB_DRIVER=... conflicts with DATABASE_URL scheme` | 两处指定了不同引擎 | 只留一处，或改成一致 |
| 连接串写了，密码却没生效 | `DATABASE_URL` 覆盖了 `DB_PASSWORD` | 改 URL 里的凭据，或删掉 URL 用离散变量 |
| SQLite 外键约束不生效 | 外键按连接开启，`ddl.sql` 顶部的 PRAGMA 只对那个连接有效 | 用各栈自带的处理：Spring 自动加 `foreign_keys=on`，Go/Python/Rust/C# 在连接时开启 |
| SQLite 时间列读出数字或字符串错位 | JDBC 默认把时间写成 epoch 毫秒，而 schema 是 TEXT | Spring 会自动补 `date_class=text`；手写 URL 时保留该参数 |
| MariaDB 认证失败但 `mysql://` 能连 | 端口或驱动名写成了 MySQL 默认值 | MariaDB 在 CI 用 3307；`DB_DRIVER` 与端口一起改 |
| 启动即报“表不存在” | 只建了库，没灌 `ddl.sql` | 先执行 DDL，再执行 DML |
| `database is locked`（SQLite 并发） | 多连接同时写，且没有等待 | Spring 自动加 `busy_timeout=5000`；Python 连接时设 15s；不要对同一文件起多个写进程 |

> Last verified: 24826bb · 2026-11-07
> 事实来源: backend/*/.env.example、backend/{springboot/src/main/resources/application.yaml,springboot/src/main/java/com/orange/config/DatabaseSettings.java,go-gin-gorm/internal/config/config.go,node-nestjs/src/config/{app-config,db-driver}.ts,csharp/src/Orange.Api/Configuration/AppOptions.cs,rust-axum/src/config.rs,python-fastapi/app/config.py}、scripts/ci/{run-db-matrix,run-contract}.mjs、database/*/ddl.sql
