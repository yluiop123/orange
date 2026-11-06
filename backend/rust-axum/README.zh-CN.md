# ORANGE 后端 — Rust + Axum

[English](./README.md) | 简体中文

将 `backend/springboot` 移植到 **Rust 2021 / Axum 0.8 / Tokio / SQLx**。
在 **8083** 端口提供 [`docs/API.zh-CN.md`](../../docs/API.zh-CN.md) 中的规范 API，
使用已有的 `database/{postgres,mysql,mariadb,sqlite}` 表结构和种子数据
（没有自己的迁移）。

> **构建状态：已在四种引擎上编译、测试并完成冒烟测试。**
> 使用 `stable-x86_64-pc-windows-gnu` 工具链和 MSYS2 UCRT64 `gcc` 链接器时，
> `cargo check`、`cargo build`、`cargo test` 均通过（40 个单元测试）。
> PostgreSQL 16、MySQL 8、MariaDB 和 SQLite 的真实冒烟测试通过：
> `super/super` 登录、`user-info`、`menus`、用户列表（普通与关键字过滤）、
> 按名称排序的角色列表、权限/用户组列表、用户组/用户/角色创建与删除、
> 操作日志列表（写入 + contains 过滤）。`scripts/smoke-databases.ps1`
> 可复现该矩阵。没有 Visual Studio Build Tools 的 Windows 用户应使用 GNU 工具链：
>
> ```bash
> rustup toolchain install stable-x86_64-pc-windows-gnu
> cargo +stable-x86_64-pc-windows-gnu build
> ```

## 实现内容

| 区域 | 行为 |
| --- | --- |
| 响应封装 | 包括错误在内，所有响应为 `{ code, message, data, timestamp, traceId }` |
| Trace | 接受 `X-Trace-Id`（也接受 `X-Request-Id`），缺省生成 16 位十六进制值并回传 `X-Trace-Id` |
| 认证 | HS256 access token + HttpOnly 轮换 refresh cookie `refresh_token`（`Path=/api/v1/auth`） |
| 失效 | `jti` 撤销写入 `sys_revoked_token`，token 携带 `token_version`，退出登录递增 |
| 强制改密 | `must_change_password` 时除 `user-info`、`menus`、`change-password`、`logout` 外返回 `40302` |
| 登录限流 | 5 次/用户、20 次/IP、15 分钟窗口与锁定，持久化在 `sys_login_attempt` |
| 密码 | BCrypt（cost 10）；接受种子 `{bcrypt}$2a$...` 前缀；12 位临时密码 |
| RBAC | 权限 `type#path[:action]`；启用角色 ∪ 直接授权 − 禁用权限 |
| 菜单 | 只返回启用的 `menu`/`directory` 节点，按编码排序；禁用分支不提升 |
| 树规则 | 编码形状、不可修改、父节点存在、禁用守卫、最深层删除、引用守卫 |
| 唯一性 | 权限 `(type, path, action)`（`NULL` action 视为一个值）；角色 id 和用户名检查 |
| 操作日志 | `/api/v1/system/*` 与 `/auth/change-password` 的非 GET 写入；脱敏 + 截断 |
| CORS | 允许配置来源，开启 credentials |

### 业务码

`200`、`40001`、`40002`、`40101`、`40301`、`40302`、`40401`、`40501`、
`40901`、`429`（登录锁定）、`50000`，与 `docs/API.zh-CN.md` 中的 HTTP 状态映射。
`429` 锁定响应遵循 Java 参考实现，使用业务码 `429`。

## 环境要求

- Rust 1.75+（edition 2021），只需要 `cargo`。
- PostgreSQL 13+、MySQL 8/MariaDB 10.6+ 或 SQLite 3.24+
  （SQLite 通过 `libsqlite3-sys` 的 `bundled` 链接，无需系统库）。
- 可访问的数据库和 JWT 密钥。

## 数据库初始化

表结构和种子数据来自共享的 `database/`。加载所选引擎，再把 `DATABASE_URL` 指向它。

```bash
# PostgreSQL
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql

# MySQL / MariaDB
mysql -u root -proot orange < database/mysql/ddl.sql
mysql -u root -proot orange < database/mysql/dml.sql

# SQLite
sqlite3 orange.db < database/sqlite/ddl.sql
sqlite3 orange.db < database/sqlite/dml.sql
```

种子使用 Spring `{bcrypt}` 前缀，Rust 密码校验器会去掉该前缀，因此同一份种子可直接使用。
`migrations/` 有意不存在：按 `docs/PORTING.zh-CN.md` 要求，`database/` 是唯一来源。

## 配置

所有配置来自环境变量。复制 `.env.example` 为 `.env`（应用通过 `dotenvy` 加载），
或直接导出变量。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/orange` | SQLx 连接串 |
| `DB_DRIVER` | 从 URL scheme 推断 | `postgres`、`mysql`、`mariadb` 或 `sqlite`；优先于 scheme |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | 引擎默认值 | 离散连接值，仅在未设置 `DATABASE_URL` 时使用 |
| `DB_FILE` | `DB_NAME` | SQLite 文件路径，仅在未设置 `DATABASE_URL` 时使用 |
| `JWT_SECRET` | 开发回退值（会告警） | access/refresh token 的 HMAC 密钥 |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 逗号分隔的允许来源 |
| `PORT` | `8083` | HTTP 端口 |
| `JWT_ACCESS_EXPIRE` | `900` | access token 有效期（秒） |
| `JWT_REFRESH_EXPIRE` | `604800` | refresh token 有效期（秒） |
| `COOKIE_SECURE` | `false` | refresh cookie 的 `Secure` 标志（生产为 true） |
| `COOKIE_SAME_SITE` | `Lax` | `SameSite` 值（`None` 要求 `COOKIE_SECURE=true`） |
| `COOKIE_DOMAIN` | 未设置 | 可选 cookie 域 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单用户失败阈值 |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败阈值 |
| `LOGIN_LOCK_MINUTES` | `15` | 窗口与锁定时长 |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | 日志清理期限 |

`JWT_SECRET` 有开发回退值，便于本地启动；对外暴露前必须设置真实密钥。
`CORS_ORIGINS` 也接受 `CORS_ALLOWED_ORIGINS`，兼容 Spring 配置名。

## 运行

```bash
cd backend/rust-axum
cargo run
```

服务监听 **http://0.0.0.0:8083**，API 基础地址为
**http://localhost:8083/api/v1**。一个进程连接一个引擎，通过 `DB_DRIVER` +
`DATABASE_URL` 选择：

```bash
# PostgreSQL
DB_DRIVER=postgres DATABASE_URL=postgres://postgres:postgres@localhost:5432/orange cargo run

# MySQL
DB_DRIVER=mysql DATABASE_URL=mysql://root:root@localhost:3306/orange cargo run

# MariaDB（同一 MySQL 驱动）
DB_DRIVER=mariadb DATABASE_URL=mysql://root:root@localhost:3307/orange cargo run

# SQLite
DB_DRIVER=sqlite DATABASE_URL=sqlite:./orange.db cargo run
```

`DB_DRIVER` 优先于 URL scheme，因此必须与 `DATABASE_URL` 一致。也接受裸 SQLite 路径
（`DATABASE_URL=D:\data\orange.db`）。

冒烟检查：

```bash
curl -i -X POST http://localhost:8083/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"super","password":"<种子密码>"}'
```

响应会设置 HttpOnly `refresh_token` cookie；之后发送
`Authorization: Bearer <token>`。

## 测试

```bash
cd backend/rust-axum
cargo test
```

`#[cfg(test)]` 测试是纯逻辑，不需要数据库：

- `domain/tree_code.rs`：编码形状（根宽度、子 = 父 + 2、数字、前缀）。
- `domain/permission_shape.rs`：`action` 必须带 action；`menu`/`directory` 禁止带 action。
- `domain/effective.rs`：禁用角色/权限、与直接授权求并集、权限字符串。
- `domain/tree.rs`：祖先、启用后代、最深层删除。
- `auth/lockout.rs`：失败累积、窗口重启、锁定与解锁。
- `operation_log.rs`：记录策略、敏感路径、脱敏、截断。

跨引擎冒烟测试是脚本：

```powershell
cargo build
pwsh -File scripts/smoke-databases.ps1                  # 四种引擎
pwsh -File scripts/smoke-databases.ps1 -Engine sqlite
```

它要求按 `docs/DB-MATRIX.md` 加载各引擎数据库，并且只创建/删除自己的行
（`0088` 用户组、`smoketest1` 用户、`smokerole` 角色）。

## API 覆盖

34 个规范操作（`docs/API.zh-CN.md` 全部），不提供旧路由：

- 认证（6）：login、refresh、logout、user-info、change-password、menus。
- 用户（8）：列表、详情、创建、编辑、状态、重置密码、删除单个、批量删除。
- 角色（6）：列表、详情、创建、编辑、删除单个、批量删除。
- 用户组（7）：列表、详情、创建子节点（`/children`）、编辑、状态、删除单个、批量删除。
- 权限（6）：列表、详情、创建子节点（`/children`）、编辑、删除单个、批量删除。
- 操作日志（1）：列表。

旧路由（`/add`、`/edit`、`/addChild`、`/detail/{id}`）未实现，
符合 `docs/API.zh-CN.md §7`。

## 目录结构

```text
backend/rust-axum/
├── Cargo.toml
├── .env.example
├── scripts/smoke-databases.ps1  # 跨引擎冒烟测试
└── src/
    ├── main.rs              # bootstrap、监听器、每日清理
    ├── config.rs            # 环境配置
    ├── db.rs                # DB_DRIVER/DATABASE_URL、方言辅助、分发
    ├── state.rs             # Db + Arc<Config>
    ├── error.rs             # 业务码 + 错误封装
    ├── response.rs          # 响应封装 + task-local trace id
    ├── middleware.rs        # trace、认证、可选认证
    ├── operation_log.rs     # 审计策略 + 中间件
    ├── auth/                # JWT、BCrypt、限流计算、cookie
    ├── domain/              # 实体、DTO、树/权限策略
    ├── repository/          # SQLx 查询
    ├── service/             # 业务规则与守卫
    └── routes/              # Axum 处理器与路由
```

## 已知差异 / 风险

- **`cargo test` 不连接数据库**。`scripts/smoke-databases.ps1` 覆盖四种引擎的
  端到端流程，但不属于 `cargo test`；如果矩阵需要进 CI，应增加 `#[ignore]` 数据库测试。
- 方言差异在 `src/db.rs` 中处理，并为每个驱动生成一份仓储查询
  （`*_repository!` 宏）。新增查询只需修改一次宏体，不需要 `cfg!` 分支。
- SQLite 以 ISO-8601 文本存储时间戳，时间过滤使用 `datetime(...)`；
  种子中 `CURRENT_TIMESTAMP` 默认值写入的行仍可比较，但毫秒精度与
  PostgreSQL/MySQL 种子不同。
- MySQL/MariaDB 的关联表插入使用 `INSERT IGNORE`，也会忽略外键失败。
  服务层会先校验角色/权限 id，因此实际行为与其他引擎一致。
- SQLite 没有 `FOR UPDATE`；登录失败计数依赖 SQLite 的写入串行化，而不是行锁。
- 字段级校验错误只返回单个 `message`；Java 后端还会在 `@Valid` 失败时把
  `{ field: message }` 放入 `data`。
- 旧列表参数（`filterField`、`filterValue`、`orderField`、`orderValue`）被忽略，
  符合 `docs/API.zh-CN.md §4`。
- 没有 OpenAPI/Swagger UI，契约仍是 `contracts/openapi.json`。
- JWT 使用 `JWT_SECRET` 的 HS256，而不是 Java 后端的 RSA 密钥对；
  两边的 token 不能互换。
- 登录限流并发在 PostgreSQL/MySQL 上使用 `SELECT ... FOR UPDATE` + upsert；
  SQLite 没有行锁，同一键真正并发的首次插入可能丢失一次计数。
- 操作日志清理在启动时执行一次，之后每 24 小时执行；没有 cron 表达式配置。
- 操作日志最多读取请求体 16 KiB；更大的 body 记为缺失并以空 body 转发
  （所有支持的写请求负载都远低于此）。
- `GET` 列表返回种子演示数据；除文档规定的 page/size 限制外，没有额外分页钳制。
