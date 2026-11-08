[English](README.md) | 简体中文

# Orange · Go + Gin + GORM 后端

用 Go 实现共享 API 契约，行为以 Spring Boot 基准为准。一个进程通过 `DB_DRIVER`
连接一种数据库。后端共同约定见 [../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Go | 1.23.0 | `go.mod` |
| HTTP | Gin 1.10.1 | `go.mod` |
| ORM | GORM 1.30.1 + PostgreSQL/MySQL 驱动 | `go.mod` |
| SQLite | `github.com/glebarez/sqlite` 1.11.0（纯 Go，无 cgo） | `go.mod` |
| JWT | `github.com/golang-jwt/jwt/v5` 5.2.2 | `go.mod` |
| 校验 | `go-playground/validator/v10` 10.20.0 | `go.mod` |
| 其他 | `golang.org/x/crypto`（bcrypt）、`google/uuid`、`joho/godotenv` | `go.mod` |
| API 文档 | swaggo 注解 + gin-swagger | `internal/http/swagger.go`、`docs/` |

## 环境要求与命令

| 用途 | 命令 |
| --- | --- |
| 安装 | `go mod download` |
| 启动 | `go run ./cmd/server` |
| 测试 | `go test ./...` |
| 格式检查 | `gofmt -l .`（输出必须为空） |
| 静态检查 | `go vet ./...` |
| 构建 | `go build -o bin/server ./cmd/server` |
| 可选数据库冒烟 | `ORANGE_SMOKE=1 go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v` |

启动时由 godotenv 读取 `.env.local`，该文件已 gitignore。

## 目录结构与分层

```text
cmd/server/            进程入口、优雅关闭、日志清理
internal/config/       环境变量与连接串
internal/auth/         JWT、bcrypt、refresh Cookie
internal/domain/       纯策略：编码、权限、树、锁定、审计
internal/store/        GORM 模型与查询、时间序列化
internal/service/      业务规则：RBAC、树与引用守卫、分页
internal/http/         Gin 路由、中间件、handler、响应包体
```

策略与业务逻辑不放在 Gin 层；单元测试直接测这些包。响应使用统一包体与错误码。

## API、认证与数据库访问

- Gin handler 负责绑定参数、声明 Authority、调用 service。统一响应 helper 写包体；
  错误码在 `internal/domain/errors.go`。
- JWT 使用 `golang-jwt/jwt/v5`：同时配置 RSA 密钥对时用 RS256，否则用
  `JWT_SECRET` 的 HS256。refresh token 在 HttpOnly Cookie 中轮换。
- GORM 映射共享 schema，应用不做迁移。SQLite 使用纯 Go 驱动并把连接池限制为 1，
  避免 `SQLITE_BUSY`；其他引擎使用 10 个连接。
- `version` 列会写入但不比较，因此并发编辑是最后写入者获胜（与 Rust、Python 相同）。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `8081` | `internal/config/config.go`：`APP_PORT` → `PORT` → 8081 | 在 `.env.local` 设置 `APP_PORT` 或 `PORT` |
| API 前缀 | `/api/v1` | Gin 路由组 | — |
| Swagger | `/swagger`、`/openapi.json` | `internal/http/swagger.go` | — |
| CORS | React/Vue/Angular 开发地址 | `CORS_ORIGINS` | 修改 `.env.local` |
| 本地配置 | `.env.local` | 本栈根目录 | 从 `.env.example` 复制 |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DB_DRIVER` 或 URL scheme |
| 连接 URL | `DATABASE_URL` 覆盖离散值 | `.env.example`、`internal/config/` |
| 离散值 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_SSLMODE`、`DB_TIMEZONE` | `internal/config/` |
| SQLite 文件 | `DB_PATH`（别名 `SQLITE_PATH`） | `internal/config/` |
| 连接池 | SQLite 1 个；其他 10 个 | `internal/store/store.go` |

## 切库

| 目标库 | 依赖 / 驱动 | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `gorm.io/driver/postgres`（已在 `go.mod`） | `DB_DRIVER=postgres`，`DATABASE_URL=postgres://...` | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 |
| MySQL | `gorm.io/driver/mysql` + `go-sql-driver/mysql` | `DB_DRIVER=mysql`，`DATABASE_URL=mysql://...` | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | — |
| MariaDB | MySQL 驱动（无需额外包） | `DB_DRIVER=mariadb`，MariaDB URL/端口 | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | MariaDB 使用 MySQL 协议 |
| SQLite | `github.com/glebarez/sqlite` | `DB_DRIVER=sqlite`，`DB_PATH=./orange.db` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | 纯 Go；连接池 1 |

步骤：按引擎建库，先执行 `ddl.sql` 再执行 `dml.sql`，设置 `DB_DRIVER` 与 URL 或
`DB_*`，重启后用种子账号验证。`DATABASE_URL` 优先于离散配置。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `.env.local`（已 gitignore）+ 进程环境变量；进程变量优先 |
| 测试 | `go test ./...`；可选冒烟测试仅在 `ORANGE_SMOKE=1` 且数据库可达时运行 |
| 生产 | 只用进程环境变量；配置 RSA 密钥对或强 `JWT_SECRET` |

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
