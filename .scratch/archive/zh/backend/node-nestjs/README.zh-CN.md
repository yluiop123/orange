# ORANGE 后端 — Node.js + NestJS

[English](./README.md) | 简体中文

将 Spring Boot 参考实现移植到 **Node.js LTS + NestJS 11**，使用 TypeORM、
`@nestjs/jwt`、BCrypt 和轮换的 HttpOnly refresh cookie。通过一个连接开关支持
PostgreSQL、MySQL、MariaDB 和 SQLite。实现
[`docs/API.zh-CN.md`](../../docs/API.zh-CN.md) 的规范契约；已废弃的旧路由有意不提供。

- 基础 URL：`http://localhost:3000/api/v1`
- 响应封装：所有响应（包括错误）都使用
  `{ code, message, data, timestamp, traceId }`
- Trace id：接受 `X-Trace-Id`（也接受 `X-Request-Id`），始终在响应体和
  `X-Trace-Id` 响应头中回传

## 环境要求

| 工具 | 版本 |
| --- | --- |
| Node.js | 20 或 22 LTS（开发使用 24） |
| pnpm | 9+（`npm` 也可） |
| PostgreSQL | 13+（可选） |
| MySQL / MariaDB | 8.0.16+ / 10.4+（可选） |
| SQLite | 通过 `better-sqlite3` 内置 |

`bcrypt` 和 `better-sqlite3` 是原生模块，新版 pnpm 需要批准一次安装脚本：

```bash
pnpm install          # pnpm 12：构建批准记录在 pnpm-workspace.yaml
# 如果 pnpm 询问：
pnpm approve-builds bcrypt better-sqlite3
```

使用 npm 时会自动执行：`npm install`。

## 环境变量

复制 `.env.example` 为 `.env.local`；应用通过 `dotenv`
（`src/config/env.ts`）加载它，真实环境变量优先。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP 端口 |
| `DB_DRIVER` | 从 `DATABASE_URL` 推断，否则 `postgres` | `postgres`、`mysql`、`mariadb` 或 `sqlite` |
| `DATABASE_URL` | 未设置 | 完整连接 URL，优先于离散 `DB_*` |
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `5432`（PostgreSQL）、`3306`（MySQL/MariaDB） | 数据库端口 |
| `DB_NAME` | `orange`（SQLite 为 `orange.db`） | 数据库名或 SQLite 文件 |
| `DB_USER` | `postgres`（PostgreSQL）、`root`（MySQL/MariaDB） | 数据库用户 |
| `DB_PASSWORD` | `postgres`（PostgreSQL）、`root`（MySQL/MariaDB） | 数据库密码 |
| `DB_SSL` | `false` | `true` 开启 TLS（PostgreSQL/MySQL） |
| `JWT_SECRET` | `orange-dev-secret-change-me` | access/refresh JWT 的 HMAC 密钥 |
| `JWT_ACCESS_EXPIRE` | `900` | access token 有效期（秒） |
| `JWT_REFRESH_EXPIRE` | `604800` | refresh token 有效期（秒） |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 逗号分隔的精确来源，允许 credentials |
| `COOKIE_SECURE` | `false` | HTTPS 下设为 `true` |
| `COOKIE_SAME_SITE` | `lax` | `lax`、`strict` 或 `none` |
| `COOKIE_DOMAIN` | 未设置 | 可选的 cookie 域 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单用户失败阈值 |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败阈值 |
| `LOGIN_LOCK_MINUTES` | `15` | 窗口与锁定时长 |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 |

### 数据库选择

所有引擎共用一个开关，按以下顺序解析：

1. 设置了 `DB_DRIVER` 时使用它（`postgres` / `mysql` / `mariadb` / `sqlite`）。
2. 否则从 `DATABASE_URL` scheme 推断（`postgres://`、`postgresql://`、
   `mysql://`、`mariadb://`、`sqlite:`、`sqlite3:`、`file:`）。
3. 否则使用 `postgres`（历史默认值）。

`DATABASE_URL` 优先于离散 `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/
`DB_PASSWORD`；离散值是回退。

| 驱动 | `DB_DRIVER` | `DATABASE_URL` 示例 |
| --- | --- | --- |
| PostgreSQL | `postgres` | `postgres://postgres:postgres@localhost:5432/orange` |
| MySQL | `mysql` | `mysql://root:root@localhost:3306/orange` |
| MariaDB | `mariadb` | `mysql://root:root@localhost:3306/orange` |
| SQLite | `sqlite` | `sqlite:./orange.db` |

MariaDB 通过 TypeORM 的 `mysql` 驱动和 `mysql2` 客户端访问，不需要额外原生包；
`DB_DRIVER=mariadb` 记录目标引擎，URL 仍可使用 `mysql://`。

## 数据库初始化

表结构和种子数据由共享的 `database/<engine>` 目录维护，需要手工加载
（没有迁移工具，与参考实现一致）。TypeORM 使用 `synchronize: false`，不会修改表结构。

PostgreSQL：

```bash
createdb orange
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -v ON_ERROR_STOP=1 -f ../../database/postgres/dml.sql
```

MySQL / MariaDB（`database/mysql` 或 `database/mariadb`）：

```bash
mysql -h 127.0.0.1 -u root -proot orange < ../../database/mysql/ddl.sql
mysql -h 127.0.0.1 -u root -proot orange < ../../database/mysql/dml.sql
```

SQLite（`database/sqlite`）：

```bash
sqlite3 orange.db < ../../database/sqlite/ddl.sql
sqlite3 orange.db < ../../database/sqlite/dml.sql
```

`better-sqlite3` 在每个连接上开启 `PRAGMA foreign_keys = ON`，因此
`ON DELETE RESTRICT/CASCADE` 与 PostgreSQL 行为一致。

### 列类型兼容

实体对所有引擎保持一套类型：

| PostgreSQL | MySQL / MariaDB | SQLite |
| --- | --- | --- |
| `timestamptz` | `datetime(6)` | `TEXT`（ISO-8601 UTC），TypeORM `datetime` codec |
| `varchar` | `varchar(255)` | `TEXT` |
| `boolean` | `tinyint(1)` | `INTEGER` 0/1 |
| `bigserial` | `bigint AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |

`src/entities/column-types.ts` 根据 `DB_DRIVER` 选择时间戳类型
（PostgreSQL 为 `timestamptz`，其他为 `datetime`）。

## 运行

```bash
pnpm install
export JWT_SECRET=change-me
# PostgreSQL（默认）
pnpm build && pnpm start:prod

# 其他引擎
export DB_DRIVER=mysql
export DATABASE_URL=mysql://root:root@localhost:3306/orange
pnpm start:prod

# SQLite
export DB_DRIVER=sqlite
export DATABASE_URL=sqlite:./orange.db
pnpm start:prod
```

PowerShell：

```powershell
$env:JWT_SECRET = "change-me"
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "sqlite:./orange.db"
pnpm build
node dist/main.js
```

服务监听 `PORT`（默认 **3000**）。验证：

```bash
curl http://localhost:3000/api/v1/auth/menus          # 401 封装
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super","password":"super"}'
```

## 测试与构建

```bash
pnpm test      # Jest 单元测试
pnpm build     # 类型检查并输出 dist/
npm test       # npm 也可运行同一组脚本
npm run build
```

单元测试覆盖编码策略（使用共享 fixture）、权限形状、有效权限和登录限流状态机，
不需要数据库。

### 端到端冒烟测试

目标数据库已加载种子且 API 运行在 3000 端口时：

```bash
pnpm smoke
# 或：SMOKE_BASE_URL=http://localhost:3000/api/v1 node scripts/smoke.mjs
```

脚本会以 `super` 登录，覆盖每类资源列表、refresh 轮换/重放、强制修改密码流程、
编码/权限/树守卫、操作日志脱敏、退出撤销和登录限流。它创建临时行并在结束时删除。
当前结果：PostgreSQL、MySQL、MariaDB、SQLite 均 **78 项检查，0 失败**
（见 `scripts/smoke.mjs`）。

## 端点覆盖

`docs/API.zh-CN.md` 中的 **34** 个规范端点全部实现：

| 资源 | 数量 | 端点 |
| --- | --- | --- |
| 认证 | 6 | `POST /auth/login`、`/refresh`、`/logout`、`/change-password`；`GET /auth/user-info`、`/auth/menus` |
| 用户组 | 7 | `GET /system/groups`、`GET /:groupId`、`PATCH /:groupId`、`PATCH /:groupId/status`、`POST /children`、`DELETE /:groupId`、`DELETE ?ids=` |
| 权限 | 6 | `GET /system/permissions`、`GET /:permissionId`、`PATCH /:permissionId`、`POST /children`、`DELETE /:permissionId`、`DELETE ?ids=` |
| 角色 | 6 | `GET /system/roles`、`GET /:roleId`、`POST /`、`PATCH /:roleId`、`DELETE /:roleId`、`DELETE ?ids=` |
| 用户 | 8 | `GET /system/users`、`GET /:userId`、`POST /`、`PATCH /:userId`、`PATCH /:userId/status`、`POST /:userId/reset-password`、`DELETE /:userId`、`DELETE ?ids=` |
| 操作日志 | 1 | `GET /system/operation-logs` |

Java 的废弃路由（`*/add`、`*/edit`、`*/addChild`、`*/detail/{id}`、
`/users/reset/{id}`）未实现。

## 行为说明

- **Token**：HS256 access token（`jti`、`typ=access`、`ver`、`username`、
  `sub=user.id`）和 refresh token（`typ=refresh`）。refresh token 只通过
  HttpOnly cookie（`refresh_token`，路径 `/api/v1/auth`）传递，每次刷新轮换；
  旧 `jti` 原子写入 `sys_revoked_token`，重放返回 401。
- **失效**：`sys_user.token_version` 写入 `ver`。修改密码、重置密码、禁用用户和
  退出登录都会递增它。
- **强制修改密码**：`must_change_password=true` 时只允许 `user-info`、`menus`、
  `change-password`、`logout`，其他请求返回 `40302`。
- **登录限流**：按 `user:<小写用户名>` 和 `ip:<地址>` 在 `sys_login_attempt` 计数；
  15 分钟内 5/20 次失败锁定该键 15 分钟。成功登录只清除用户计数。
  返回 HTTP 429 / code 429，与参考实现一致。
- **密码**：BCrypt，使用 Spring `{bcrypt}` 前缀，种子用户可直接使用，
  Java 后端也能读取这里写入的哈希。新建/重置密码为 12 位，使用相同字母表，
  并设置 `must_change_password=true`。
- **RBAC**：权限标识为 `type#path` 或 `type#path:action`；有效权限为
  启用角色 ∪ 直接授权 − 禁用权限。`super` 判断还会读取 principal 中的角色 id。
  菜单/目录权限控制菜单树；API 调用按匹配的权限字符串检查。
- **树**：纯数字编码，根为 2/4 位，子 = 父 + 2 位，不可修改。删除子树从最深层开始
  并带引用守卫；禁用父节点前必须先禁用全部后代。文本过滤会返回祖先。
- **菜单**：`/auth/menus` 返回按编码排序的启用 `menu`/`directory` 节点；
  父节点被禁用时整个分支隐藏，不会提升到根。
- **操作日志**：对 `/api/v1/system/*` 和 `/auth/change-password` 的非 GET 请求，
  在响应结束后记录。`login`、`refresh`、`change-password`、`reset-password`
  的 body 不记录；其他 body 脱敏 `password`/`token`/`secret` 并截断到 4000 字符；
  query string 截断到 500。默认保留 90 天。

## 目录结构

```text
src/
  main.ts                  bootstrap、全局前缀、CORS、cookie、trace 中间件
  app.module.ts            TypeORM、全局守卫/拦截器/过滤器/管道
  common/                  响应封装、错误、trace、校验、树策略、密码
  config/                  基于环境的 AppConfig、DB 驱动 + TypeORM 选项
  auth/                    登录/刷新/退出/user-info/改密、JWT、限流
  menus/                   /auth/menus 菜单树
  users/ roles/ groups/ permissions/    DTO、服务、控制器
  operation-log/           拦截器、策略、记录/查询
  entities/                共享表结构的 TypeORM 实体
  policies/                权限形状 + 有效权限
scripts/smoke.mjs          端到端冒烟测试
```

## 已知差异

- **不提供废弃旧路由**，符合 `docs/API.zh-CN.md §7`。
- **没有 OpenAPI/Swagger 生成或 UI**；契约在 `contracts/openapi.json`。
- **没有迁移工具**。共享 DDL/DML 需手工加载，`synchronize` 已关闭。
- **MariaDB 使用 TypeORM 的 `mysql` 驱动**（`mysql2` 客户端），不使用独立的
  `mariadb` 包；查询行为相同，但不使用 MariaDB 专属驱动特性。
- **SQLite 没有原生日期类型**。`timestamptz` 列按共享 DDL 使用 ISO-8601 UTC
  `TEXT`；由 `CURRENT_TIMESTAMP` 默认值写入的行精度为秒，应用写入保留微秒。
  SQLite 不强制 `varchar(n)` 长度和数值范围。
- **没有 i18n 消息包**。接受 `Locale` 头，但消息只有参考实现中的中文。
- **没有邮件发送**；临时密码只在重置响应体中返回一次（`Cache-Control: no-store`）。
- **单元测试不启动 Nest 或数据库**。数据库行为由 `scripts/smoke.mjs` 验证，
  不是 Jest e2e 测试。
- **进程内维护**：操作日志保留清理在启动时执行一次，之后每个进程每天执行一次；
  幂等但不是分布式调度器。过期的 `sys_login_attempt` 行会被忽略，但不会定期删除。
- **除登录限流外没有全局速率限制**。
- **不接受旧兼容参数**（`filterField`、`filterValue`、`orderField`、
  `orderValue`）；请使用 `keyword`/`sort`。
- **时间戳序列化为 ISO-8601 UTC**（`...Z`），而不是 Java 的
  `yyyy-MM-dd HH:mm:ssXXX` 字符串；表示同一时刻，`Date`/dayjs 可解析。
- **并发冲突映射为 `40901`**，但没有自动乐观锁重试。
