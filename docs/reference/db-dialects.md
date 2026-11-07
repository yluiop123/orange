# 数据库方言与引擎矩阵

本页解决：同一套 10 张表在 7 种引擎上的差异、各自的加载方式和验证状态。
读者：需要换库、加引擎或排查方言问题的开发者与维护者。

## 1. 引擎矩阵

所有引擎共享同一逻辑模型，DDL 以 [`database/postgres/ddl.sql`](../../database/postgres/ddl.sql) 为源，其余目录是它的移植。

| 引擎 | 目录 | 目标版本 | 语法族 | 加载工具 | 验证状态 |
| --- | --- | --- | --- | --- | --- |
| PostgreSQL | [`database/postgres`](../../database/postgres) | PostgreSQL 16 | PostgreSQL | `psql` | CI 实测（含矩阵与契约测试） |
| MySQL | [`database/mysql`](../../database/mysql) | 8.0.16+（CHECK 约束从 8.0.16 起生效） | MySQL | `mysql` | CI 实测 |
| MariaDB | [`database/mariadb`](../../database/mariadb) | 11.x（CHECK 从 10.2 起生效） | MySQL 兼容 | `mariadb` / `mysql` | CI 实测 |
| SQLite | [`database/sqlite`](../../database/sqlite) | 3.x | SQLite | `sqlite3` | CI 实测 |
| openGauss | [`database/opengauss`](../../database/opengauss) | 5.x / 6.x，行存（astore），非分区表 | PostgreSQL 兼容 | `gsql` | 仅静态审阅，未执行 |
| OceanBase | [`database/oceanbase`](../../database/oceanbase) | 4.x MySQL 模式 | MySQL 兼容 | `mysql` 客户端 | 仅静态审阅，未执行 |
| GoldenDB | [`database/goldendb`](../../database/goldendb) | 6.x（MySQL 5.7 兼容） | MySQL 兼容 | `mysql` 客户端 | 仅静态审阅，未执行 |

四个 CI 实测引擎由 [`scripts/ci/run-db-matrix.mjs`](../../scripts/ci/run-db-matrix.mjs) 覆盖；三个国产引擎只有静态 SQL，没有运行时矩阵，不要把它们写成“已验证”。

## 2. 逻辑模型（10 张表）

`sys_group`、`sys_permission`、`sys_role`、`sys_role_permission`、`sys_user`、`sys_user_permission`、`sys_user_role`、`sys_revoked_token`、`sys_login_attempt`、`sys_operation_log`。

表结构、字段语义与不变量见 [数据模型](./data-model.md)。本页只讲方言差异。

每个引擎目录固定两个文件：

- `ddl.sql`：建表、主外键、索引、CHECK、默认值、注释
- `dml.sql`：种子数据，按“子表在前”的顺序插入（`sys_group` 的 `'00'` 根节点被引用时尚未插入）

## 3. 加载方式

| 引擎 | 命令 |
| --- | --- |
| PostgreSQL | `psql -d orange -v ON_ERROR_STOP=1 -f database/postgres/ddl.sql`，再执行 `dml.sql` |
| MySQL | `mysql -u root -p orange < database/mysql/ddl.sql`，再执行 `dml.sql` |
| MariaDB | `mariadb -u root -p orange < database/mariadb/ddl.sql`；或在客户端内 `SOURCE database/mariadb/ddl.sql;` 后接 `dml.sql` |
| SQLite | `sqlite3 app.db < database/sqlite/ddl.sql`，再执行 `dml.sql` |
| openGauss | `gsql -d app_db -p 5432 -U omm -v ON_ERROR_STOP=1 -f database/opengauss/ddl.sql` |
| OceanBase | 用 MySQL 客户端导入 `ddl.sql` / `dml.sql` |
| GoldenDB | 用 MySQL 客户端导入 `ddl.sql` / `dml.sql` |

脚本化准备见 [`scripts/prepare-stack-databases.ps1`](../../scripts/prepare-stack-databases.ps1)，全矩阵验证见 [跑数据库矩阵](../how-to/run-database-matrix.md)。

## 4. 方言差异

| 维度 | PostgreSQL / openGauss | MySQL / MariaDB / OceanBase / GoldenDB | SQLite |
| --- | --- | --- | --- |
| schema | `public.` 前缀 | 无 schema，库内平铺 | 无 schema，`main` |
| 主键自增 | `bigserial` / identity | `BIGINT AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| 变长字符串 | `varchar(n)` 强制长度 | `varchar(n)` 强制长度 | `TEXT`，长度意图只写在注释里，不强制 |
| 时间 | `timestamptz`，默认 `now()` | `datetime` / `timestamp` | `TEXT` 存 ISO-8601 UTC，默认 `CURRENT_TIMESTAMP` |
| 布尔 | `bool` | `tinyint(1)` | `INTEGER` + `CHECK (col IN (0,1))` |
| CHECK 约束 | 原生支持 | MySQL ≥8.0.16、MariaDB ≥10.2 生效；OceanBase/GoldenDB 声明但可能被忽略 | 原生支持 |
| 标识符引用 | 双引号 `"name"` | 反引号 `` `name` `` | 双引号或方括号 |
| 字符集 | 数据库级 UTF-8 | `utf8mb4` / `utf8mb4_general_ci`（GoldenDB/MySQL 5.7 无 `utf8mb4_0900_*`） | 无（默认 UTF-8） |
| 外键 | 默认生效 | 默认生效 | **按连接生效**，默认关闭 |

### SQLite 的两个坑

1. **外键默认关闭**：`ddl.sql` 顶部的 `PRAGMA foreign_keys = ON;` 只对执行它的那一个连接有效。每个接触该库的连接都必须先执行同名 PRAGMA，否则约束不生效。
2. **种子数据顺序**：`dml.sql` 在导入期间显式 `PRAGMA foreign_keys = OFF;`，导入后恢复为 `ON`。该文件必须作为单个脚本、单连接执行。

### MySQL 系的两个坑

1. **CHECK 约束版本门槛**：MySQL 8.0.16 之前会静默忽略 CHECK；MariaDB 10.2 之前同样。目标版本写在各引擎 README 与本节矩阵里。
2. **默认值写法**：`CURRENT_TIMESTAMP` 在 GoldenDB（MySQL 5.7 兼容）上的精度与 MySQL 8 不同，迁移时不要依赖毫秒级默认时间。

## 5. 加一个新引擎

1. 复制 `database/postgres/ddl.sql` 与 `dml.sql` 到 `database/<engine>/`。
2. 按 §4 逐项改写：schema、自增、时间类型、位置引用的引号、CHECK 与字符集。
3. 在 §1 矩阵与 [Reference: 栈矩阵](../reference/stacks.md) 中登记目标版本和加载工具。
4. 用 `scripts/ci/run-db-matrix.mjs` 能覆盖的引擎补进 CI；不能覆盖的在矩阵里标“仅静态审阅”。
5. 同步 [数据模型](./data-model.md) 里的方言差异说明。

> Last verified: 24826bb · 2026-11-07
> 事实来源: database/*/ddl.sql 头部注释、database/*/dml.sql 头部注释、.github/workflows/main.yml
