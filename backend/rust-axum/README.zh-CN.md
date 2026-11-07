# Orange · Rust + Axum 后端

本栈用 Rust + Axum 实现同一份接口契约，行为以 Spring Boot 基准为准；一个进程通过 `DB_DRIVER` / `DATABASE_URL` 连一种数据库。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Rust | edition 2021，`rust-version = 1.75` | `Cargo.toml` |
| Web | axum 0.8、tokio 1（`features = ["full"]`）、tower-http 0.6（cors、trace） | `Cargo.toml` |
| 数据库 | sqlx 0.8，`runtime-tokio-rustls` + postgres / mysql / sqlite / chrono / uuid / macros / derive | `Cargo.toml` |
| 认证 | `jsonwebtoken` 9（HS256）、`bcrypt` 0.15（`getrandom`） | `Cargo.toml` |
| 序列化与时间 | serde 1、serde_json 1、chrono 0.4 | `Cargo.toml` |
| 其他 | uuid 1（v4）、rand 0.8、regex 1、dotenvy 0.15、tracing 0.1、tracing-subscriber 0.3（env-filter） | `Cargo.toml` |
| 依赖锁定 | `Cargo.lock` 已提交 | 仓库文件 |
| 测试依赖 | 无 `[dev-dependencies]`，测试全部内联在 `src` | `Cargo.toml` |
| 接口文档 | 统一入口 `/swagger` + `/openapi.json`（无额外 crate） | `src/swagger.rs` |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | 无独立安装步骤 | `cargo build` 按 `Cargo.lock` 拉取 crate |
| 启动 | `cargo run` | `src/main.rs`；`.env` 由 `dotenvy::dotenv()` 加载 |
| 测试 | `cargo test` | `main.yml`（backend job, rust） |
| 构建 | `cargo build` | `main.yml` 同 job |
| 跨引擎冒烟 | `pwsh -File scripts/smoke-databases.ps1`（可加 `-Engine sqlite`） | `scripts/smoke-databases.ps1`；需要各引擎已加载 schema 与种子 |

端口来源变量：`parse_env_any(&["APP_PORT", "PORT"], 8083u16)`（`src/config.rs:75`），默认 8083；`.env.example` 写 `PORT=8083`，并注明该端口由端口分配约定保留。

本机若未安装 `cargo`，上述构建与测试命令无法复跑；此处命令取自 CI 与本栈 `Cargo.toml`（待核）。

## 目录结构与分层

```text
src/main.rs          启动、监听、每日审计清理
src/config.rs        环境变量与配置聚合
src/db.rs            驱动解析、方言辅助、仓库分发
src/state.rs         Db 与 Arc<Config>
src/error.rs         业务码与错误包体
src/response.rs      响应包体与 task-local trace id
src/middleware.rs    TraceId、认证、可选认证
src/operation_log.rs 审计策略与中间件
src/auth/            JWT、bcrypt、锁定计算、cookie
src/domain/          实体、DTO、树与权限策略、校验
src/repository/      SQLx 查询（按驱动各生成一份）
src/service/         业务规则与守卫
src/routes/          Axum 处理器与路由
scripts/smoke-databases.ps1  四引擎冒烟脚本
```

## 配置入口

复制 `.env.example` 为 `.env`（被 gitignore，`dotenvy::dotenv()` 加载）；真实环境变量优先。`DB_DRIVER` 优先于 `DATABASE_URL` 的 scheme；`DATABASE_URL` 优先于离散 `DB_*`，SQLite 另有 `DB_FILE`。变量清单与跨栈对照见 [后端配置约定](../../backend/README.md)。

## 本栈偏差

1. 测试全部内联：0 个独立测试文件、无 `[dev-dependencies]`，8 个模块内含 `#[cfg(test)]`，共 40 个 `#[test]`（`cargo test` 不需要数据库）。这与 Go、Python 的独立测试目录不同。
2. 组织为单一二进制 crate：只有 `src/main.rs`，`Cargo.toml` 没有 `[lib]` 目标，模块都是 bin 私有，因此测试只能内联；Go、Python、C# 都有可被外部测试引用的库/模块层。
3. JWT 只用 HS256（`src/auth/jwt.rs:63`），没有 RS256 选项；Go 两者都支持，Spring 只用 RS256。
4. 每个仓库查询按驱动各生成一份（`*_repository!` 宏），方言差异集中在 `src/db.rs`；SQLite 时间戳为 ISO-8601 文本，过滤走 `datetime(...)`。
5. 无 OpenAPI crate，无迁移目录：`/swagger` + `/openapi.json` 在 `src/swagger.rs` 手写；schema 只来自 `database/<engine>`。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 50 |
| Rust 源文件 | 44（`src/`） |
| 测试文件 | 0 个独立测试文件；8 个模块内联 40 个 `#[test]` |

统计口径：`git ls-files backend/rust-axum` 与 `src` 内 `#[test]` 计数。端点与方言见 [HTTP 契约](../../contracts/openapi.json)、[数据库方言](../../database/)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `Cargo.toml`、`Cargo.lock`、`.env.example`、`src/main.rs`、`src/config.rs`、`src/db.rs`、`src/auth/jwt.rs`、`scripts/smoke-databases.ps1`、`.github/workflows/main.yml`
