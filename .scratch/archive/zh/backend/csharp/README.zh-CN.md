# ORANGE — C# / ASP.NET Core 后端

[English](./README.md) | 简体中文

将 ORANGE 权限管理 API 移植到 **.NET 10 + ASP.NET Core + EF Core**，与
[`backend/springboot`](../springboot) 的 Java 参考实现以及
[`docs/API.zh-CN.md`](../../docs/API.zh-CN.md) 的契约保持一致。

- 基础路径：`/api/v1`
- 默认端口：**8082**
- 数据库：**PostgreSQL**（默认）、**MySQL**、**MariaDB**、**SQLite**，
  同一个二进制通过 `DB_DRIVER` / `DATABASE_URL` 切换
- 表结构：共享的 `database/<engine>/ddl.sql` + `dml.sql`，没有迁移
- 密码：BCrypt（兼容种子数据，包括 Spring `{bcrypt}` 前缀）
- Token：HS256 JWT access token + 轮换的 HttpOnly refresh cookie

## 环境要求

- .NET SDK **10.0**（`dotnet --version`）
- PostgreSQL 14+、MySQL 8+、MariaDB 10.11+ 或 SQLite 3.35+
- 仅在加载表结构时需要对应引擎的命令行客户端（应用不建表）

## 数据库初始化

在仓库根目录为所选引擎加载共享表结构和种子数据：

```bash
# PostgreSQL
cd database/postgres
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f ddl.sql
psql -U postgres -d orange -f dml.sql

# MySQL
cd database/mysql
mysql -uroot -proot -e "CREATE DATABASE orange;"
mysql -uroot -proot orange < ddl.sql
mysql -uroot -proot orange < dml.sql

# MariaDB
cd database/mariadb
mysql -uroot -proot -e "CREATE DATABASE orange;"
mysql -uroot -proot orange < ddl.sql
mysql -uroot -proot orange < dml.sql

# SQLite
cd database/sqlite
sqlite3 orange-csharp.db < ddl.sql
sqlite3 orange-csharp.db < dml.sql
```

种子账号：

| 用户名 | 密码 |
| --- | --- |
| `super` | `super` |
| `admin` | `admin` |
| `user` | `user` |

种子哈希格式为 `{bcrypt}$2a$...`；应用在 BCrypt 校验前会去掉 Spring 前缀。
没有迁移工具；`ddl.sql` 只应在新数据库上执行。

## 配置

所有配置都来自环境变量；未知或空值使用下方默认值。真实环境变量优先于
`.env.local`，后者只补齐缺失值。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DB_DRIVER` | `postgres` | 引擎：`postgres`、`mysql`、`mariadb` 或 `sqlite` |
| `DATABASE_URL` | 空 | 单行连接 URL，**优先于离散 `DB_*`** |
| `DB_HOST` | `localhost` | 数据库主机（非 SQLite） |
| `DB_PORT` | `5432`（postgres）/ `3306`（mysql、mariadb） | 数据库端口 |
| `DB_NAME` | `orange` | 数据库名；SQLite 下仅当以 `.db` 结尾时作为文件名 |
| `DB_USER` | `postgres`（postgres）/ `root`（MySQL 家族） | 数据库用户 |
| `DB_PASSWORD` | `postgres`（postgres）/ `root`（MySQL 家族） | 数据库密码 |
| `SQLITE_PATH` | `orange-csharp.db` | 未设置 `DATABASE_URL` 时的 SQLite 文件 |
| `JWT_SECRET` | 仅开发用常量 | access/refresh token 的 HMAC 密钥，**生产必须设置** |
| `CORS_ORIGINS` | `http://localhost:5173` | 逗号分隔的允许来源（允许 credentials），`CORS_ALLOWED_ORIGINS` 可回退 |
| `PORT` | `8082` | HTTP 监听端口 |
| `APP_PORT` | `PORT` 或 `8082` | HTTP 监听端口（优先于 `PORT`） |
| `ACCESS_TOKEN_SECONDS` | `900` | access token 有效期 |
| `REFRESH_TOKEN_SECONDS` | `604800` | refresh token / cookie 有效期 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单用户失败阈值 |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败阈值 |
| `LOGIN_LOCK_MINUTES` | `15` | 窗口与锁定时长 |
| `COOKIE_SECURE` | `false` | HTTPS 下设为 `true` |
| `COOKIE_SAME_SITE` | `Lax` | `Lax`、`Strict` 或 `None` |
| `COOKIE_DOMAIN` | 空 | 可选 cookie 域 |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | 审计日志保留天数 |

### 连接优先级

1. 设置了 `DATABASE_URL` 时以它为准。支持：
   - `postgres://user:password@host:port/database`（也支持 `postgresql://`）
   - `mysql://...`
   - `mariadb://...`
   - `sqlite:///absolute/path.db`、`sqlite:relative.db` 或 `file:path.db`
2. 否则用 `DB_DRIVER` + 离散 `DB_*` 组装连接串。
3. `DB_DRIVER` 默认 `postgres`；未设置时由 URL scheme 判断。`DB_DRIVER`
   与 URL scheme 冲突时启动直接报错。
4. `DB_DRIVER=sqlite` 且没有 scheme 时，`DATABASE_URL` 按文件路径处理。

切换到 MySQL/MariaDB 时，如果使用离散变量，记得把 `DB_PORT` 从 `5432` 改为
`3306`（或直接使用 `DATABASE_URL`）。

示例：

```bash
# PostgreSQL
DB_DRIVER=postgres DATABASE_URL=postgres://postgres:postgres@localhost:5432/orange dotnet run --project src/Orange.Api

# MySQL
DB_DRIVER=mysql DATABASE_URL=mysql://root:root@localhost:3306/orange dotnet run --project src/Orange.Api

# MariaDB
DB_DRIVER=mariadb DATABASE_URL=mariadb://root:root@localhost:3306/orange dotnet run --project src/Orange.Api

# SQLite
DB_DRIVER=sqlite SQLITE_PATH=./orange-csharp.db dotnet run --project src/Orange.Api
```

### 代码处理的引擎差异

- PostgreSQL 全程保留 `timestamptz` 和 `DateTimeOffset`，搜索使用 `ILIKE`。
- MySQL/MariaDB 使用 `datetime(6)`；SQLite 存储 ISO-8601 UTC 文本。值转换器把
  `DateTimeOffset` 转为 UTC `DateTime`，读取时恢复 UTC 类型。
- 非 PostgreSQL 引擎的列表过滤使用 `lower(column) LIKE pattern ESCAPE '\'`。
- Upsert：PostgreSQL/SQLite 使用 `ON CONFLICT`，MySQL/MariaDB 使用
  `ON DUPLICATE KEY UPDATE` / `INSERT IGNORE`。

## 运行

```bash
cd backend/csharp
dotnet run --project src/Orange.Api
```

API 地址为 `http://localhost:8082/api/v1`。示例：

```bash
curl -i -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super","password":"super"}'
```

## 构建与测试

```bash
cd backend/csharp
dotnet build
dotnet test
```

`dotnet test` 运行 xUnit 套件（69 个测试），覆盖：

- 树编码策略（根长度、子长度、父前缀）；
- 权限形状策略（`action` 与 `menu`/`directory`）；
- 有效权限（启用角色 + 直接授权 − 禁用，权限字符串格式）；
- 登录限流（5/用户、20/IP、窗口重置、锁定过期、键规范化）；
- 与 PostgreSQL 种子哈希的 BCrypt 兼容；
- 操作日志记录/脱敏/截断规则；
- 树索引的子树/祖先/删除顺序规则。

## 端点

`docs/API.zh-CN.md` 中的 34 个规范端点全部实现，旧路由有意不提供。

| 区域 | 端点 |
| --- | --- |
| 认证 | `POST /auth/login`、`/refresh`、`/logout`、`/change-password`；`GET /auth/user-info`、`/auth/menus` |
| 用户 | `GET/POST /system/users`、`GET/PATCH/DELETE /system/users/{id}`、`PATCH /system/users/{id}/status`、`POST /system/users/{id}/reset-password`、`DELETE /system/users?ids=` |
| 角色 | `GET/POST /system/roles`、`GET/PATCH/DELETE /system/roles/{id}`、`DELETE /system/roles?ids=` |
| 用户组 | `GET /system/groups`、`GET/PATCH/DELETE /system/groups/{id}`、`PATCH /system/groups/{id}/status`、`POST /system/groups/children`、`DELETE /system/groups?ids=` |
| 权限 | `GET /system/permissions`、`GET/PATCH/DELETE /system/permissions/{id}`、`POST /system/permissions/children`、`DELETE /system/permissions?ids=` |
| 操作日志 | `GET /system/operation-logs` |

与参考实现一致的行为：

- 成功和错误都返回 `{ code, message, data, timestamp, traceId }` 封装；
  `X-Trace-Id` 同时出现在响应体和响应头。也接受并回传 `X-Request-Id`，
  兼容 Java 后端。
- 业务码 `200/40001/40002/40101/40301/40302/40401/40501/40901/50000`，
  以及 Java 兼容的 `429` 登录锁定响应。
- access token + HttpOnly `refresh_token` cookie（路径 `/api/v1/auth`）；
  刷新轮换会撤销旧 `jti`，重放返回 401。
- `sys_user.token_version` 写入 `ver` 并在每个请求校验。退出登录会撤销 access
  `jti` 并递增 token version。
- `must_change_password` 只允许 `user-info`、`menus`、`change-password`、`logout`；
  其他请求返回 `40302`。
- 登录失败计数以 `ip:<addr>` / `user:<name>` 行持久化在 `sys_login_attempt`。
- 新建用户和重置密码生成 12 位临时密码，并设置 `must_change_password = true`。
- 权限标识为 `type#path` / `type#path:action`；有效权限是启用角色与直接授权的并集
  减去禁用权限。
- 菜单树只返回按编码排序的启用 `menu`/`directory` 节点；父节点禁用或缺失的分支隐藏。
- 覆盖编码策略、权限形状、`(type,path,action)` 唯一性、父节点存在、最深层删除、
  引用守卫、禁用守卫、自我/最后超级管理员守卫和授权守卫。
- 操作日志中间件记录 `/api/v1/system/*` 和 `/auth/change-password` 的非 GET 请求；
  敏感路径不记录 body；其他 body 脱敏 `password`/`token`/`secret` 并截断到
  4000 字符；query string 截断到 500；超过保留期的行会过期。
- CORS 允许配置的来源并开启 `AllowCredentials`。

## 目录结构

```text
backend/csharp/
├── Orange.slnx
├── src/Orange.Api/
│   ├── Program.cs                 # host、DI、中间件管道
│   ├── Configuration/             # 环境配置
│   ├── Contracts/                 # 请求/响应 DTO
│   ├── Controllers/               # 每类资源的控制器
│   ├── Data/                      # 驱动切换、方言辅助、DbContext 与映射
│   ├── Domain/                    # 策略、实体、异常、日志规则
│   ├── Middleware/                # trace、错误、校验、操作日志
│   ├── Security/                  # JWT、cookie、认证中间件、RBAC、限流
│   └── Services/                  # 业务逻辑
└── tests/Orange.Tests/            # xUnit 单元测试
```

## 已验证内容

- `dotnet build`：0 警告，0 错误。
- `dotnet test`：69 通过，0 失败。
- 四个引擎分别使用 `database/<engine>` 加载种子数据库并完成冒烟测试：
  `super`/`super` 登录、`user-info`、`menus`（6 个根节点、按编码排序、不含动作节点）、
  用户列表、过滤后的用户/用户组/操作日志列表、用户组创建 → 读取 → 删除，
  以及 refresh 轮换与重放拒绝。

  | 引擎 | 端点 | 结果 |
  | --- | --- | --- |
  | PostgreSQL 16 | `localhost:55432/orange_csharp` | 通过 |
  | MySQL 8 | `localhost:53306/orange_csharp` | 通过 |
  | MariaDB 11.8 | `localhost:53307/orange_csharp` | 通过 |
  | SQLite | `orange-csharp.db` | 通过 |

## 已知差异

- **EF Core 固定在 9.x**。`Pomelo.EntityFrameworkCore.MySql` 9.0.0 依赖 EF Core 9；
  Npgsql 和 SQLite provider 也固定同一主版本。升级到 EF Core 10 需要 Pomelo 10。
- **非 PostgreSQL 时间戳会丢失时区偏移**。MySQL/MariaDB `datetime(6)` 和 SQLite
  文本没有偏移；应用按 UTC 存储并输出 `+00:00`。
- **MySQL/MariaDB 默认排序规则不区分大小写**，因此 `username`、`jti` 等值比较
  与 PostgreSQL 不同；这是共享表结构的行为，不是代码差异。
- **SQLite `lower()` 只折叠 ASCII**；非 ASCII 文本的大小写过滤可能与 PostgreSQL 不同。
- **并发 token 和自增 id 依赖引擎默认值**（`bigserial`、`AUTO_INCREMENT`、
  `AUTOINCREMENT`）；应用不建表、不迁移。
- **没有 OpenAPI/Swagger UI**；`contracts/openapi.json` 仍是机器可读契约。
- **没有迁移，也不自动加载表结构/种子**；共享 SQL 必须手工执行。
- **JWT 算法与 Java 参考不同**。Java 使用 RSA PEM 的 RS256；本移植使用
  `JWT_SECRET` 的 HS256。Token claims（`jti`、`typ`、`ver`、`username`、`sub`）一致。
- **未实现 `Locale` 头**；消息为中文，与 Java 后端实际行为一致。
- **时间戳格式为 ISO-8601**（`2026-11-03T08:00:00+00:00`），符合 API 文档；
  Java bean 使用空格分隔格式，字符串比较的客户端可能注意到差异。
- **未填充 `created_by` / `updated_by`**；只写 `create_time` / `update_time`
  和乐观锁 `version`。
- **被拒绝的写请求也会审计**。操作日志中间件包住认证，因此以 401/403 结束的
  非 GET `/api/v1/system/*` 也会以 `anonymous`（或已认证用户）记录。
- **登录失败并发是尽力而为**；同一键的两个同时失败可能少计一次。
- **保留清理每 6 小时执行一次**，不是可配置的每日 cron。
- **没有提交数据库集成测试**；xUnit 是单元级，多引擎 HTTP 冒烟测试为手工执行。
- **没有乐观锁重试**；并发编辑返回 `40901`（数据冲突，请刷新后重试）。
- **旧路由按设计不提供**：`POST .../add`、`POST .../edit`、`POST .../addChild`、
  `GET .../detail/{id}`、`POST /system/permissions`（旧列表）均未实现。
