[English](README.md) | 简体中文

# Orange · Rust + Axum 后端

用 Rust + Axum 实现共享 API 契约，行为以 Spring Boot 基准为准。一个进程通过
`DB_DRIVER` / `DATABASE_URL` 连接一种数据库。后端共同约定见
[../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Rust | edition 2021，`rust-version = 1.75` | `Cargo.toml` |
| Web | axum 0.8、tokio 1、tower-http 0.6 | `Cargo.toml` |
| 数据库 | sqlx 0.8，启用 postgres / mysql / sqlite | `Cargo.toml` |
| 认证 | `jsonwebtoken` 9、`bcrypt` 0.15 | `Cargo.toml` |
| 序列化 | serde 1、serde_json 1、chrono 0.4 | `Cargo.toml` |
| 其他 | uuid 1、rand 0.8、regex 1、dotenvy 0.15、tracing | `Cargo.toml` |
| API 文档 | utoipa 5 + utoipa-swagger-ui 9 | `src/swagger.rs` |

`Cargo.lock` 已入库。所有测试都内联在 `src`，没有 `[dev-dependencies]`。

## 环境要求与命令

| 用途 | 命令 |
| --- | --- |
| 安装 | 无独立步骤；`cargo build` 按 `Cargo.lock` 拉取 crate |
| 启动 | `cargo run` |
| 测试 | `cargo test` |
| 构建 | `cargo build` |

Windows 上没有 MSVC linker 时，安装 `stable-x86_64-pc-windows-gnu` 工具链并把
MSYS2 `gcc` 加入 `PATH`；CI 使用默认 Linux 工具链。`.env` 由
`dotenvy::dotenv()` 读取。

## 目录结构与分层

```text
src/main.rs          启动、监听、每日审计清理
src/config.rs        环境变量与配置聚合
src/db.rs            驱动选择、方言 helper、repository 分发
src/state.rs         Db 与 Arc<Config>
src/error.rs         业务码与错误包体
src/response.rs      响应包体与 trace id
src/middleware.rs    TraceId、认证、可选认证
src/operation_log.rs 审计策略与中间件
src/swagger.rs       生成的 /openapi.json 与 /swagger UI
src/auth/            JWT、bcrypt、锁定、Cookie
src/domain/          实体、DTO、树与权限策略、校验
src/repository/      每种驱动的 SQLx 查询
src/service/         业务规则与守卫
src/routes/          Axum handler 与路由
```

## API、认证与数据库访问

- Axum handler 绑定参数、声明 Authority、调用 service；统一响应 helper 写包体，
  `src/error.rs` 负责错误映射。
- JWT 使用 `jsonwebtoken`：同时配置 RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的
  HS256。refresh token 在 HttpOnly Cookie 中轮换。
- sqlx 查询每种驱动各生成一份，方言差异集中在 `src/db.rs`。SQLite 时间使用
  ISO-8601 文本，过滤走 `datetime(...)`。
- `version` 列会递增但不比较，因此并发编辑是最后写入者获胜（与 Go、Python 相同）。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `8083` | `src/config.rs`：`APP_PORT` → `PORT` → 8083 | 在 `.env` 设置 `APP_PORT` |
| 监听地址 | `0.0.0.0` | `src/main.rs` | 修改 `src/main.rs` |
| API 前缀 | `/api/v1` | `src/routes/` | — |
| Swagger | `/swagger`、`/openapi.json` | `src/swagger.rs` | — |
| CORS | React/NestJS 开发地址 | `CORS_ORIGINS` | 修改 `.env` |
| 本地配置 | `.env` | 本栈根目录 | 从 `.env.example` 复制 |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DB_DRIVER` 或 URL scheme |
| 连接 URL | `DATABASE_URL` | `.env.example`、`src/config.rs` |
| 离散值 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` | `src/config.rs` |
| SQLite 文件 | `DB_FILE` | `src/config.rs` |
| 方言 helper | `src/db.rs` | 每种驱动的查询 |

## 切库

| 目标库 | 依赖 / 驱动 | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | sqlx `postgres`（已在 `Cargo.toml`） | `DB_DRIVER=postgres`，`DATABASE_URL=postgres://...` | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 |
| MySQL | sqlx `mysql` | `DB_DRIVER=mysql`，`mysql://...` | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | — |
| MariaDB | sqlx `mysql`（MySQL URL 形式） | `DB_DRIVER=mariadb`，MariaDB URL/端口 | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | MariaDB 使用 MySQL 协议 |
| SQLite | sqlx `sqlite` | `DB_DRIVER=sqlite`，`DB_FILE=./orange.db` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | 时间字段是文本 |

步骤：按引擎建库，先执行 `ddl.sql` 再执行 `dml.sql`，设置驱动与 URL 或离散值，
重启后用种子账号验证。`DATABASE_URL` 优先于离散值；`DB_DRIVER` 优先于 URL scheme。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `.env`（已 gitignore），由 `dotenvy` 读取；进程环境变量优先 |
| 测试 | `cargo test`；测试内联，不需要数据库 |
| 生产 | 进程环境变量；使用 RSA 密钥对或强 `JWT_SECRET` |

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
