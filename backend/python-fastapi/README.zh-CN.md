# ORANGE — Python / FastAPI 后端

[English](./README.md) | 简体中文

ORANGE 系统管理 API 的 Python 3.13 + FastAPI 移植实现。按照
[`docs/API.zh-CN.md`](../../docs/API.zh-CN.md) 中的规范契约，与 Spring Boot
参考实现（`backend/springboot`）保持一致，并通过 `database/<dialect>` 中的对应
表结构运行在 PostgreSQL、MySQL、MariaDB 或 SQLite 上。

- 基础路径：`/api/v1`
- 默认端口：`8000`
- 所有响应使用 `{ code, message, data, timestamp, traceId }`，并在
  `X-Trace-Id` 响应头中携带相同的 `traceId`。
- 交互式文档：<http://localhost:8000/docs>

## 环境要求

- Python **3.13**（项目使用现代 `str | None` 注解；3.11+ 大概率可用，
  但支持版本是 3.13）。
- 一个已加载 ORANGE 表结构和种子数据的数据库：
  - PostgreSQL 13+（`database/postgres`）
  - MySQL 8.0.16+（`database/mysql`）
  - MariaDB 10.6+（`database/mariadb`）
  - SQLite 3.35+（`database/sqlite`）
- **不需要** C 工具链：`psycopg[binary]`、`PyMySQL` 和 `bcrypt` 提供 wheel。
  SQLite 通过 SQLAlchemy 使用标准库 `sqlite3` 驱动（`sqlite+pysqlite`）。

## 安装

```bash
cd backend/python-fastapi
python3.13 -m venv .venv
# Windows: .venv\Scripts\python -m pip install -r requirements-dev.txt
source .venv/bin/activate
pip install -r requirements-dev.txt
```

`requirements-dev.txt` 在 `requirements.txt` 之上增加 `pytest` 和 `httpx`。

## 环境变量

只有移植检查清单中的变量是必需的，其余都有开发默认值。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DB_DRIVER` | `postgres` | `postgres` / `mysql` / `mariadb` / `sqlite` |
| `DATABASE_URL` | 空 | 完整连接 URL，优先于 `DB_DRIVER` 和 `DB_*` |
| `DB_HOST` | `localhost` | 数据库主机（SQLite 忽略） |
| `DB_PORT` | `5432`（MySQL/MariaDB 为 `3306`） | 数据库端口 |
| `DB_NAME` | `orange`（SQLite 为 `orange-fastapi.db`） | 数据库名或 SQLite 文件路径 |
| `DB_USER` | `postgres`（MySQL/MariaDB 为 `root`） | 数据库用户 |
| `DB_PASSWORD` | `postgres`（MySQL/MariaDB 为 `root`） | 数据库密码 |
| `JWT_SECRET` | 不安全的开发值 | HS256 签名密钥，**生产必须设置** |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 逗号分隔的允许来源（允许 credentials） |
| `PORT` | `8000` | `python -m app.main` 使用的 HTTP 端口 |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | `900` | access token 有效期 |
| `REFRESH_TOKEN_EXPIRE_SECONDS` | `604800` | refresh token 有效期 |
| `COOKIE_SECURE` | `false` | 给 refresh cookie 加 `Secure` |
| `COOKIE_SAME_SITE` | `lax` | `lax` / `strict` / `none` |
| `COOKIE_DOMAIN` | 空 | 可选的 refresh cookie 域 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单用户名失败阈值 |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败阈值 |
| `LOGIN_LOCK_MINUTES` | `15` | 窗口与锁定时长 |
| `OPERATION_LOG_RETENTION_DAYS` | `90` | 审计日志保留天数 |

连接优先级从高到低：

1. **`DATABASE_URL`**：完整 URL。接受仓库其他实现使用的简写形式：
   `postgres://`、`postgresql://`、`mysql://`、`mariadb://`、`sqlite:///…`；
   会自动补全 SQLAlchemy 需要的 scheme（`postgresql+psycopg`、`mysql+pymysql`、
   `sqlite+pysqlite`），并为 MySQL/MariaDB 添加 `charset=utf8mb4`。
   裸路径按 SQLite 文件处理。
2. **`DB_DRIVER` + `DB_*`**：用离散值组装 URL。
3. **都没有**：使用 PostgreSQL 默认值（`localhost:5432`、`orange`、
   `postgres`/`postgres`）。

SQLite 下 `DB_NAME` 是数据库文件路径（或 `:memory:`）；驱动在每个连接上开启
`PRAGMA foreign_keys = ON`，使表结构中的外键与服务端引擎一致。

`.env.example` 是可复制的模板。进程读取真实环境；存在 `.env` 时会加载，
真实环境变量优先。

## 数据库初始化

为所选引擎加载共享表结构和种子数据（在 backend/python-fastapi 目录执行；
DDL 会建表，请指向空数据库）：

```bash
# PostgreSQL
createdb orange
psql -d orange -f ../../database/postgres/ddl.sql
psql -d orange -f ../../database/postgres/dml.sql

# MySQL
mysql -h 127.0.0.1 -P 3306 -uroot -proot orange < ../../database/mysql/ddl.sql
mysql -h 127.0.0.1 -P 3306 -uroot -proot orange < ../../database/mysql/dml.sql

# MariaDB（同一套表结构，MariaDB 语法）
mariadb -h 127.0.0.1 -P 3306 -uroot -proot orange < ../../database/mariadb/ddl.sql
mariadb -h 127.0.0.1 -P 3306 -uroot -proot orange < ../../database/mariadb/dml.sql

# SQLite（创建文件）
sqlite3 orange-fastapi.db < ../../database/sqlite/ddl.sql
sqlite3 orange-fastapi.db < ../../database/sqlite/dml.sql
```

种子包含演示用户 `super` / `super`、`admin` / `admin`、`user` / `user`
（BCrypt 哈希带 `{bcrypt}` 前缀；校验器同时接受带前缀和裸哈希）。

四种引擎在 API 层等价，只需要改连接串。例如：

```bash
# PostgreSQL
DB_DRIVER=postgres DB_PORT=5432 DB_NAME=orange \
  DB_USER=postgres DB_PASSWORD=postgres uvicorn app.main:app --port 8000

# MySQL
DB_DRIVER=mysql DB_PORT=3306 DB_NAME=orange \
  DB_USER=root DB_PASSWORD=root uvicorn app.main:app --port 8000

# MariaDB（显式 URL；DB_DRIVER=mariadb 也可）
DATABASE_URL=mariadb://root:root@localhost:3306/orange \
  uvicorn app.main:app --port 8000

# SQLite
DB_DRIVER=sqlite DB_NAME=./orange-fastapi.db \
  uvicorn app.main:app --port 8000
```

## 运行

```bash
# 在 backend/python-fastapi 下，虚拟环境已激活
python -m app.main
# 或
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`PORT` 只影响 `python -m app.main`；使用 uvicorn 时需显式传 `--port`。

冒烟检查：

```bash
curl -i -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Trace-Id: my-trace-0001" \
  -d '{"username":"super","password":"super"}'
```

响应会设置 HttpOnly `refresh_token` cookie（路径 `/api/v1/auth`）并返回 access token。
之后发送 `Authorization: Bearer <token>`。

## 测试

```bash
# 在 backend/python-fastapi 下，虚拟环境已激活
python -m pytest -q
```

测试套件**不需要** PostgreSQL：

- 纯单元测试：编码策略、权限形状、有效权限、登录限流、操作日志脱敏/截断、
  临时密码、树索引；
- 响应封装/认证测试，运行真实 ASGI 应用；
- SQLite 端到端集成套件：登录、refresh 轮换与重放拒绝、退出、RBAC/40301、
  强制改密/40302、列表端点、CRUD、引用守卫、权限标识冲突、操作日志
  （使用内存 SQLite，不需要服务端）。

真实冒烟测试已在 PostgreSQL 16.12、MySQL 8.4.13、MariaDB 11.8.9 和 SQLite 3
上运行，并加载 `database/<dialect>/ddl.sql` + `dml.sql`。每次使用
`scripts/smoke_http.py` 对真实 uvicorn 进程验证：

- 未认证请求 → 401 + 封装 + `X-Trace-Id`；
- `super` 登录 → access token；
- `user-info`、`menus` 和用户列表；
- 用户组创建与删除；
- 操作日志查询，验证该引擎上的时间戳和 `LIKE` 过滤。

先针对目标引擎启动应用，然后执行：

```bash
# PostgreSQL 示例
DB_DRIVER=postgres DB_PORT=5432 DB_NAME=orange DB_USER=postgres DB_PASSWORD=postgres \
  uvicorn app.main:app --port 8000
python scripts/smoke_http.py --base-url http://127.0.0.1:8000
```

`scripts/smoke_pg.py` 是较早的进程内 PostgreSQL 检查。两个脚本都会修改目标数据库
（创建一个组织并删除），不要指向共享数据。

## 端点覆盖

`docs/API.zh-CN.md` 中的 **34** 个规范端点全部实现：

| 区域 | 数量 | 路径 |
| --- | --- | --- |
| 认证 | 6 | `POST /auth/login`、`/refresh`、`/logout`、`/change-password`；`GET /auth/user-info`、`/auth/menus` |
| 用户组 | 7 | `GET /system/groups`、`GET /{id}`、`PATCH /{id}`、`PATCH /{id}/status`、`POST /children`、`DELETE /{id}`、`DELETE ?ids=` |
| 权限 | 6 | `GET /system/permissions`、`GET /{id}`、`PATCH /{id}`、`POST /children`、`DELETE /{id}`、`DELETE ?ids=` |
| 角色 | 6 | `GET /system/roles`、`GET /{id}`、`POST /`、`PATCH /{id}`、`DELETE /{id}`、`DELETE ?ids=` |
| 用户 | 8 | `GET /system/users`、`GET /{id}`、`POST /`、`PATCH /{id}`、`PATCH /{id}/status`、`POST /{id}/reset-password`、`DELETE /{id}`、`DELETE ?ids=` |
| 操作日志 | 1 | `GET /system/operation-logs` |

旧路由（`/add`、`/edit`、`/addChild`、`/detail/{id}`、`/reset/{id}`）有意**不实现**；
`docs/API.zh-CN.md §7` 要求新实现不要暴露它们。

## 行为说明

- **会话**：access JWT（HS256）携带 `sub`、`username`、`typ`、`ver`
  （`token_version`）和 `jti`。refresh token 是 HttpOnly cookie，每次刷新轮换；
  旧 `jti` 写入 `sys_revoked_token`，重放返回 401。退出登录会撤销 access `jti`、
  refresh `jti` 并递增 `token_version`（与 Java 参考一致，会使所有会话失效）。
- **强制改密**：`must_change_password` 为真时只能访问 `user-info`、`menus`、
  `change-password`、`logout`，其他请求返回 `40302`。
- **限流**：15 分钟内单用户名 5 次、单 IP 20 次失败，持久化在
  `sys_login_attempt`，均锁定 15 分钟。用户名规范化为小写；成功登录只清除账号计数，
  不清除 IP 计数。
- **RBAC**：权限标识为 `type#path` 或 `type#path:action`；也接受权限 id 作为
  权限标识，与参考实现一致。有效权限为启用角色 ∪ 直接授权，再减去禁用权限。
  菜单/目录权限不会授予 API 访问权。
- **菜单**：只返回启用的 `menu`/`directory` 节点，按编码排序；父节点禁用或缺失的
  分支会丢弃，不会提升到根。
- **唯一性**：服务层检查 `(type, path, action)`（`action IS NULL` 视为一个值），
  并由 DDL 中的两个部分唯一索引兜底。
- **删除**：用户组/权限删除要求所有请求 id 都存在，并从最深层开始；角色/用户删除
  会忽略不存在的 id，除非全部不存在。
- **操作日志**：对 `/api/v1/system/*` 和 `/api/v1/auth/change-password` 的
  非 GET/OPTIONS 写请求，在响应后异步记录。登录/刷新/改密/重置密码的 body 不记录；
  匹配 `password`/`token`/`secret` 的 JSON 字段替换为 `***`；body 截断到 4000 字符，
  query string 截断到 500。

## 已知差异

1. **旧路由按设计不提供**，调用 `/add`、`/edit`、`/addChild`、`/detail/{id}` 或
   `/reset/{id}` 会得到 404。
2. **乐观锁仅供参考**。`version` 列在每次更新时递增，但 SQLAlchemy 不会生成
   `WHERE version = ?`，并发编辑是后写覆盖先写（Java 参考使用 JPA `@Version`
   并把冲突映射为 409）。
3. **校验失败返回 `40002`**（符合 `docs/API.zh-CN.md`），而不是 Java 后端
   bean validation 的 `40001`。JSON 格式错误返回 `40001`；字段错误为 `40002`，
   `data` 中带 `{field: message}`。
4. **操作日志保留在进程内执行**。后台任务在启动 60 秒后开始，每天删除一次超过
   90 天的日志；不是分布式 cron。
5. **审计写入是尽力而为**。日志插入失败（例如数据库不可用）时请求仍然成功，
   只记录失败日志。
6. **盲目信任 `X-Forwarded-For`**（用于登录限流 IP 和审计 `ip` 列）。
   应部署在会覆盖该头的代理后面，否则客户端可以伪造。
7. **`logout` 使用户所有会话失效**（递增 `token_version`），而不仅是当前
   access token；与 Java 参考一致，但比 `docs/API.zh-CN.md` 的措辞更强。
8. **12 位临时密码没有额外复杂度规则**，只限制字母表（去除易混淆字符）；
   只有 `change-password` 强制 8–64 位且包含字母和数字。
9. **权限编辑多一条规则**：把仍有子节点的节点类型改为 `action` 会被拒绝
   （`动作权限不能有子节点`）。Java 服务只在添加子节点时检查，因此本实现略严格。
10. **接受但忽略 `Locale`**。消息为中文，与参考一致；服务端没有 i18n 目录。
11. **`/auth/refresh` 没有额外限流**，只有 refresh token 轮换；只有登录有限流。
12. **引擎并发差异**。SQLite 是单写数据库；应用使用
    `check_same_thread=False`、`PRAGMA foreign_keys=ON` 和 15 秒 busy timeout，
    并发写会排队而不是失败。PostgreSQL/MySQL/MariaDB 使用普通 10 连接池。
13. **时间戳存储因引擎而异**。API 中所有时间戳都是 UTC：PostgreSQL 使用
    `timestamptz`，MySQL/MariaDB `DATETIME` 和 SQLite 没有时区类型，模型在写入时转换、
    读取时重新标记 UTC。各引擎的时刻相同，物理列类型不同。
14. **MySQL/MariaDB 没有部分唯一索引**。PostgreSQL/SQLite 的
    `(type, path, action)` 规则在那里由生成的 `action_key` 列加一个唯一索引表达，
    已包含在 `database/mysql` 和 `database/mariadb`。服务层标识检查不变，
    API 响应（409/`40901`）相同。
15. **OpenAPI schema 较薄**。所有路由都在 `/docs` 中，但响应通过共享封装构建，
    因此生成的 schema 不发布每个端点的响应模型。
