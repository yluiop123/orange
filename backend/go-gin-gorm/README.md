# Orange · Go + Gin + GORM 后端

本栈用 Go 实现同一份接口契约，行为以 Spring Boot 基准为准；一个进程通过 `DB_DRIVER` 连一种数据库。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| Go | 1.23.0（CI 用 `1.23.x`） | `go.mod`、`main.yml` |
| HTTP | Gin 1.10.1 | `go.mod` |
| ORM | GORM 1.30.1 + `gorm.io/driver/postgres` 1.6.0、`gorm.io/driver/mysql` 1.6.0 | `go.mod` |
| SQLite | `github.com/glebarez/sqlite` 1.11.0（纯 Go，不依赖 cgo） | `go.mod` |
| JWT | `github.com/golang-jwt/jwt/v5` 5.2.2 | `go.mod` |
| 校验 | `go-playground/validator/v10` 10.20.0 | `go.mod` |
| 其他 | `golang.org/x/crypto`（bcrypt）、`google/uuid`、`joho/godotenv` | `go.mod` |
| 接口文档 | 无 OpenAPI/Swagger 依赖 | `go.mod` |
| 构建 | 只有 `go` 工具链，无 Makefile | 目录内容 |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | `go mod download` | `go.sum` 已提交；CI 直接用 `go build ./...` 解析依赖 |
| 启动 | `go run ./cmd/server` | `cmd/server/main.go`；`.env.local` 由 godotenv 加载 |
| 测试 | `go test ./...` | `main.yml`（backend job, go） |
| 格式与静态检查 | `gofmt -l .` 必须为空、`go vet ./...` | `main.yml` 同 job |
| 构建 | `go build -o bin/server ./cmd/server` | `main.yml`；另有 `go build ./...` |
| 可选冒烟 | `ORANGE_SMOKE=1 go test ./internal/http -run TestSmokeAgainstConfiguredDatabase -v` | `internal/http/smoke_test.go:25`；库不可达时跳过 |

端口来源变量：`env("APP_PORT", env("PORT", "8081"))`（`internal/config/config.go:211`），默认 8081；`.env.example` 只写了 `PORT=8081`。

## 目录结构与分层

```text
cmd/server/            进程入口、优雅关闭、日志保留
internal/config/       环境变量与连接串
internal/auth/         JWT、bcrypt、refresh cookie
internal/domain/       纯策略：编码形状、权限形状、有效权限、树索引、登录锁定、审计规则
internal/store/        GORM 模型与查询、时间戳序列化
internal/service/      业务规则：RBAC、树与引用守卫、分页
internal/http/         Gin 路由、中间件、处理器、响应包体
```

策略与业务逻辑不放在 Gin 层；单元测试直接测这些包。端点与数据库矩阵不在本页维护，见 [docs/reference/api.md](../../docs/reference/api.md) 与 [docs/reference/db-dialects.md](../../docs/reference/db-dialects.md)。

## 配置入口

复制 `.env.example` 为 `.env.local`（被 gitignore，启动时由 godotenv 读入）；真实环境变量优先于该文件。`DATABASE_URL` 覆盖离散 `DB_*`，`DB_DRIVER` 未设时由 URL scheme 推断引擎。变量清单、优先级与跨栈对照见 [docs/backend/configuration.md](../../docs/backend/configuration.md)。

## 本栈偏差

1. 无 OpenAPI/Swagger：`go.mod` 没有相关依赖，契约只以 `contracts/openapi.json` 为准。
2. SQLite 用纯 Go 驱动，`CGO_ENABLED=0` 可构建；为避开 `SQLITE_BUSY` 把 SQLite 连接池压到 1（`internal/store/store.go:57`），其他引擎为 10（同文件 :60）。
3. JWT 支持两种算法：配置 `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`（或内联 PEM）时用 RS256，否则 HS256（`internal/auth/token.go:68`、`token.go:76`）。Spring 只用 RS256，其余四个端口只用 HS256。
4. 不维护 `version` 乐观锁：模型里有该列（`internal/store/models.go`），创建时写 0，更新时不自增，也不做 `WHERE version` 比较，并发编辑为后写覆盖。Rust 与 Python 会自增但同样不比较。
5. Go 是六栈中唯一在 CI 里额外要求 `gofmt` 与 `go vet` 通过的端口。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 57 |
| Go 源文件 | 52 |
| 测试文件 | 11 个 `_test.go`（含 `internal/http` 的路由测试与可选数据库冒烟） |

统计口径：`git ls-files backend/go-gin-gorm`。栈级差异的成因见 [docs/explanation/porting-and-deviations.md](../../docs/explanation/porting-and-deviations.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `go.mod`、`go.sum`、`.env.example`、`cmd/server/main.go`、`internal/**`、`.github/workflows/main.yml`
