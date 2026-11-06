# ORANGE 后端 — Go + Gin + GORM

[English](./README.md) | 简体中文

ORANGE 系统管理 API 的 Go 移植实现。它按照
[`docs/API.zh-CN.md`](../../docs/API.zh-CN.md) 中的规范契约，对接
[`database/`](../../database) 中已提交的表结构，并通过一个 `DB_DRIVER` 开关支持
PostgreSQL、MySQL、MariaDB 和 SQLite。`../springboot` 中的 Spring Boot 实现是行为基准。

- 基础路径：`/api/v1`
- 默认端口：**8081**
- 响应封装：`{ code, message, data, timestamp, traceId }`
- `X-Trace-Id` 会被接受；缺省时自动生成，并在响应体和响应头中回传。

## 环境要求

- Go **1.23+**（开发与测试使用 Go 1.24.3）
- 一个已加载对应 `database/` 脚本的数据库：
  PostgreSQL 12+、MySQL 8+、MariaDB 10.6+ 或 SQLite 3.35+
- SQLite 使用 `github.com/glebarez/sqlite`（纯 Go），无需 cgo 或 C 编译器，
  `CGO_ENABLED=0` 也能构建。
- 本项目不安装数据库服务，只使用仓库中已有的 SQL 文件。

## 目录结构

```text
cmd/server              进程入口、优雅关闭、日志保留
internal/config         环境配置
internal/auth           JWT access/refresh token、BCrypt、refresh cookie
internal/domain         纯策略：编码形状、权限形状、有效权限、树索引、
                        登录限流、操作日志策略
internal/store          GORM 模型与查询
internal/service        业务规则（RBAC 守卫、树/引用守卫）
internal/http           Gin 路由、中间件、处理器、响应封装
```

策略与业务逻辑位于 Gin 之外，单元测试直接覆盖这些包。

## 数据库初始化

应用不会创建表。按所选引擎加载一次已提交的 SQL：

```powershell
# PostgreSQL
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f ../../database/postgres/ddl.sql
psql -U postgres -d orange -f ../../database/postgres/dml.sql

# MySQL
mysql -uroot -proot -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -proot orange < ../../database/mysql/ddl.sql
mysql -uroot -proot orange < ../../database/mysql/dml.sql

# MariaDB
mysql -uroot -proot -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -proot orange < ../../database/mariadb/ddl.sql
mysql -uroot -proot orange < ../../database/mariadb/dml.sql

# SQLite（无服务端，应用不建表，脚本只执行一次）
sqlite3 orange-go.db ".read ../../database/sqlite/ddl.sql"
sqlite3 orange-go.db ".read ../../database/sqlite/dml.sql"
```

种子数据包含演示账号 `super` / `super`、`admin` / `admin`、`user` / `user`。
哈希使用 Spring 的 `{bcrypt}` 前缀；本服务同时接受带前缀和裸 BCrypt 哈希，并写出带前缀的哈希。

## 环境变量

连接串通过一个开关选择：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DB_DRIVER` | `postgres` | `postgres`、`mysql`、`mariadb` 或 `sqlite`；也接受 `postgresql`/`pg`、`sqlite3` |
| `DATABASE_URL` | 空 | 完整连接串，优先于所有离散 `DB_*` |
| `DB_HOST` | `localhost` | PostgreSQL/MySQL/MariaDB 主机 |
| `DB_PORT` | `5432`（PostgreSQL）、`3306`（MySQL/MariaDB） | 端口 |
| `DB_NAME` | `orange` | 数据库名 |
| `DB_USER` | `postgres`（PostgreSQL）、`root`（MySQL/MariaDB） | 用户 |
| `DB_PASSWORD` | `postgres`（PostgreSQL）、`root`（MySQL/MariaDB） | 密码 |
| `DB_SSLMODE` | `disable` | PostgreSQL `sslmode` |
| `DB_TIMEZONE` | `UTC` | PostgreSQL 会话时区 |
| `DB_PATH` | `orange-go.db` | SQLite 文件（别名 `SQLITE_PATH`），其他驱动忽略 |

优先级：`DATABASE_URL` > 离散 `DB_*`/`DB_PATH` > 驱动默认值。只设置
`DATABASE_URL` 时，驱动从 URL scheme 推断（`postgres://`、`mysql://`、
`mariadb://`）；没有 scheme 的值按 SQLite 文件处理。

`DATABASE_URL` 可用形式：

```text
postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable
mysql://root:root@localhost:53306/orange_go
mariadb://root:root@localhost:53307/orange_go
orange-go.db
sqlite:orange-go.db
```

`mysql://` / `mariadb://` 会转换为 go-sql-driver 语法，并追加
`parseTime=true&loc=UTC`。SQLite 路径会在每个连接池连接上追加
`_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)`；SQLite 的外键按连接生效，
因此必须这样设置。

其余配置：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `PORT` | `8081` | HTTP 监听端口 |
| `JWT_SECRET` | 开发回退值 | HS256 签名密钥；非本地环境必须设置 |
| `JWT_PRIVATE_KEY_PATH` | 空 | RSA 私钥（PKCS#1/PKCS#8 PEM），启用 RS256 |
| `JWT_PUBLIC_KEY_PATH` | 空 | RSA 公钥（PKIX/PKCS#1 PEM） |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | 空 | 内联 PEM，替代路径 |
| `JWT_ISSUER` | `orange` | JWT issuer |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `900` | access token 有效期 |
| `REFRESH_TOKEN_EXPIRE_SECONDS` | `604800` | refresh token / cookie 有效期 |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 逗号分隔的允许来源（允许 credentials） |
| `COOKIE_SECURE` | `false` | HTTPS 下设为 `true` |
| `COOKIE_SAME_SITE` | `Lax` | `Lax`、`Strict` 或 `None` |
| `COOKIE_DOMAIN` | 空 | 可选的 refresh cookie 域 |
| `COOKIE_PATH` | `/api/v1/auth` | refresh cookie 路径 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单账号失败次数阈值 |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败次数阈值 |
| `LOGIN_LOCK_MINUTES` | `15` | 失败窗口与锁定时长 |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 |

配置了 RSA 密钥时使用 RS256，`JWT_SECRET` 被忽略。

## 运行

```powershell
cd backend/go-gin-gorm
$env:JWT_SECRET = "replace-with-a-long-random-value"

# PostgreSQL（默认）
go run ./cmd/server

# MySQL
$env:DB_DRIVER = "mysql"
$env:DATABASE_URL = "mysql://root:root@localhost:3306/orange"
go run ./cmd/server

# MariaDB
$env:DB_DRIVER = "mariadb"
$env:DATABASE_URL = "mariadb://root:root@localhost:3306/orange"
go run ./cmd/server

# SQLite
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "orange-go.db"
go run ./cmd/server
```

API 地址为 `http://localhost:8081/api/v1`。`GET /healthz` 返回轻量存活响应
（不在业务响应封装内）。

构建二进制：

```powershell
go build -o bin/orange-server ./cmd/server
```

## 测试

```powershell
go test ./...
go vet ./...
```

单元测试覆盖：

- 用户组和权限的树业务编码形状；
- 权限 `type`/`action` 形状与权限字符串渲染；
- 有效权限（启用角色 + 直接授权 − 禁用权限）；
- 登录限流阈值、窗口重置与过期；
- 操作日志记录、脱敏与截断；
- 连接优先级与各驱动 DSN 渲染；
- PostgreSQL、MySQL、SQLite 文本时间戳解析；
- JWT access/refresh 类型与篡改拒绝；
- BCrypt 临时密码与 `{bcrypt}` 种子兼容；
- 路由封装、trace 头、CORS preflight 与 404/401。

### 可选的数据库冒烟测试

冒烟测试需要显式开启；配置的数据库不可达时会自动跳过。支持所有驱动：

```powershell
$env:ORANGE_SMOKE = "1"

# PostgreSQL
$env:DB_DRIVER = "postgres"
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:55432/orange_go?sslmode=disable"

# MySQL / MariaDB
$env:DB_DRIVER = "mysql"
$env:DATABASE_URL = "mysql://root:root@localhost:53306/orange_go"

# SQLite
$env:DB_DRIVER = "sqlite"
$env:DATABASE_URL = "orange-go.db"

$env:SMOKE_USERNAME = "super"   # 可选
$env:SMOKE_PASSWORD = "super"   # 可选
go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v
```

它会检查未认证 401 封装、登录 token + HttpOnly refresh cookie、`user-info`、
`menus`、每类资源的一个列表端点，以及 `user` 角色访问系统接口时的 403。

## 端点

`docs/API.zh-CN.md` 中的规范端点全部实现（34 条路由）。已废弃的旧路由
（`/add`、`/edit`、`/addChild`、`/detail/{id}` 等）有意不提供。

| 区域 | 路由 |
| --- | --- |
| 认证 | `POST /auth/login`、`POST /auth/refresh`、`POST /auth/logout`、`GET /auth/user-info`、`POST /auth/change-password`、`GET /auth/menus` |
| 用户组 | `GET /system/groups`、`GET /system/groups/{id}`、`POST /system/groups/children`、`PATCH /system/groups/{id}`、`PATCH /system/groups/{id}/status`、`DELETE /system/groups/{id}`、`DELETE /system/groups?ids=a,b` |
| 权限 | `GET /system/permissions`、`GET /system/permissions/{id}`、`POST /system/permissions/children`、`PATCH /system/permissions/{id}`、`DELETE /system/permissions/{id}`、`DELETE /system/permissions?ids=a,b` |
| 角色 | `GET /system/roles`、`GET /system/roles/{id}`、`POST /system/roles`、`PATCH /system/roles/{id}`、`DELETE /system/roles/{id}`、`DELETE /system/roles?ids=a,b` |
| 用户 | `GET /system/users`、`GET /system/users/{id}`、`POST /system/users`、`PATCH /system/users/{id}`、`PATCH /system/users/{id}/status`、`POST /system/users/{id}/reset-password`、`DELETE /system/users/{id}`、`DELETE /system/users?ids=a,b` |
| 操作日志 | `GET /system/operation-logs` |

权限标识使用 `type#path` 或 `type#path:action`（例如 `menu#/system/user`、
`action#/system/user:add`）。有效集合是所有启用角色与用户直接授权的并集，
再减去禁用权限；菜单/目录权限只控制可见性。

## 行为说明

- Access token 是短期 JWT，携带 `jti`、`token_version`（`ver`）和用户名。
  Refresh token 是 `HttpOnly` cookie，每次刷新都会轮换；旧的 `jti` 写入
  `sys_revoked_token`，重放返回 `401`。
- 退出登录会撤销当前 access `jti` 和 refresh `jti`，并递增 `token_version`
  （与参考实现一致，会使其他会话失效）；修改密码和重置密码同样递增。
- `must_change_password` 为真时，除 `user-info`、`menus`、`change-password`、
  `logout` 外全部返回业务码 `40302`。
- 登录失败计数持久化在 `sys_login_attempt` 的 `user:<name>` 与 `ip:<addr>` 行。
  15 分钟内 5 次用户失败或 20 次 IP 失败会锁定 15 分钟，返回 HTTP 429 / code 429。
- 新建和重置密码生成 12 位临时密码（去除易混淆字符），以 BCrypt 存储并标记
  `must_change_password`。
- 删除时从最深层开始遍历子树。引用守卫会拒绝删除仍包含用户的用户组子树、
  被角色或用户引用的权限子树，以及已分配给用户的角色。禁用父节点前必须先禁用全部后代。
- 对 `/api/v1/system/*` 和 `/api/v1/auth/change-password` 的非 GET 请求会写操作日志。
  登录/刷新/修改密码/重置密码的请求体不记录；其他 JSON body 会脱敏
  `password`/`token`/`secret` 并截断到 4000 字符；query string 截断到 500。
- 查询保持方言无关：LIKE 过滤使用 `ESCAPE '!'`（反斜杠不是可移植的 LIKE 转义）；
  token/限流 upsert 使用 GORM `clause.OnConflict`（PostgreSQL/SQLite 为
  `ON CONFLICT`，MySQL/MariaDB 为 `ON DUPLICATE KEY UPDATE`）；不使用
  `strpos`、`ILIKE`、`RETURNING` 或 PostgreSQL 强制类型转换。
- 时间戳使用 GORM serializer，因为 SQLite 以 `TEXT` 存储；它接受 `time.Time`、
  驱动文本格式和 NULL，因此同一套模型可从各引擎正确读取。
- CORS 允许配置的来源并开启 credentials（refresh cookie 需要），支持 preflight。
- 登录时间戳使用参考 bean 格式 `yyyy-MM-dd HH:mm:ss+offset`；操作日志时间戳使用 RFC 3339。

## 已知差异

- 不提供废弃旧路由，只实现 `docs/API.zh-CN.md` 的规范契约。
- 没有 OpenAPI/Swagger UI；`contracts/openapi.json` 仍是契约来源。
- `version` 列会读写，但不检测乐观锁冲突；后写覆盖先写，与 Spring Data 的
  `@Version` 检查不同。
- 操作日志保留任务是进程内每日 ticker，不是外部调度器；多实例会各自执行。
- 登录限流在 PostgreSQL/MySQL/MariaDB 上使用行锁（`SELECT ... FOR UPDATE`）；
  SQLite 没有行锁，改为单连接串行化，两个真正并发的首次失败仍可能丢失一次计数。
- SQLite 使用 `MaxOpenConns(1)` 避免 `SQLITE_BUSY`。适合开发和冒烟测试；
  高写入部署应使用服务端数据库或为 SQLite 设计的连接池。
- SQLite 的 `TEXT` 时间戳按字典序比较。本服务写入的行使用统一格式；
  种子数据中 `CURRENT_TIMESTAMP` 写入的行精度不同。日期范围过滤仍然正确，
  但两种格式之间的亚秒排序没有意义。
- 接受 `Locale: zh|en` 请求头，但消息只有中文；没有 i18n  catalog。
- 没有自动 schema 迁移。请按所用引擎手工执行 `ddl.sql`/`dml.sql`。
- 可选冒烟测试需要已加载种子数据的数据库；无数据库的 CI 只运行单元测试。
- CORS 默认值是开发来源；任何部署都应显式设置 `CORS_ORIGINS`。
- JWT 校验支持共享 HMAC 密钥或单对 RSA 密钥；未实现 JWKS 轮换。
