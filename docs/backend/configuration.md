# 后端配置参考

本页是六个后端环境变量的唯一事实源：变量名、默认值、含义与来源文件；读者是要改端口、DSN、密钥或排查“配置没生效”的开发者。前端变量见 [连接 API 与 Mock](../frontend/connect-api-and-mocks.md)，根脚本变量见 [脚本参考](../reference/scripts.md)，配置文件位置与加载顺序见 [配置加载与文件位置](../reference/configuration.md)。

## 1. 通用规则

- 端口：Spring 只读 `APP_PORT`；其余五栈先读 `APP_PORT`，再回退 `PORT`。默认值见各表。
- 数据库连接：完整连接串（`DATABASE_URL`；Spring 为 `SPRING_DATASOURCE_URL` 或 `DB_URL`）一旦设置，就覆盖离散的 `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`。
- 引擎：`DB_DRIVER` 显式指定；未指定时从连接串 scheme 推断；仍推断不出则用 PostgreSQL。
- 密钥：Spring 用 RSA PEM（`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`），其余五栈用 HS256 `JWT_SECRET`，开发默认值统一为 `orange-dev-secret-change-me-in-production`。
- 生产守卫：`APP_ENV=production|prod` 时，五栈仍用开发默认 JWT 密钥会拒绝启动；Spring 在缺少 PEM 且 `APP_ENV=production|prod`（或 prod profile）时拒绝启动。
- 本地文件：Go/Nest/C# 读 `.env.local`，Rust/Python 读 `.env`，Spring 用 `application-local.yaml`（需 `SPRING_PROFILES_ACTIVE=local`）；这些文件都不入库。
- 刷新 Cookie 的路径：Go 用 `COOKIE_PATH`，默认 `/api/v1/auth`；其余五栈固定 `/api/v1/auth`，没有环境变量。

## 2. Spring Boot

来源：`backend/springboot/src/main/resources/application.yaml`、`config/DatabaseSettings.java`、`config/DbEngine.java`、`security/config/*.java`、`security/jwt/JwtKeyConfig.java`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` | `8080` | HTTP 端口 | application.yaml |
| `DB_DRIVER` | 空（按 URL 推断；缺省 postgres） | 引擎：postgres/mysql/mariadb/sqlite | DatabaseSettings.java |
| `SPRING_DATASOURCE_URL` / `DB_URL` | 空（回退 `spring.datasource.url`） | JDBC URL | application.yaml、DatabaseSettings.java |
| `SPRING_DATASOURCE_USERNAME` / `DB_USER` | postgres / root（按引擎） | 数据库用户 | DatabaseSettings.java |
| `SPRING_DATASOURCE_PASSWORD` / `DB_PASSWORD` | postgres / root（按引擎） | 数据库密码 | DatabaseSettings.java |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432 / `orange` | 无 URL 时拼默认 JDBC URL；端口按引擎取 5432/3306（SQLite 用文件路径） | DatabaseSettings.java、DbEngine.java |
| `SPRING_SHOW_SQL` / `SHOW_SQL` | `false` | 打印 SQL | application.yaml |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | `classpath:keys/private_key.pem` / `classpath:keys/public_key.pem` | RS256 密钥位置（classpath/file） | application.yaml |
| `JWT_ACCESS_EXPIRE` | `900` | access token 有效期（秒） | application.yaml |
| `JWT_REFRESH_EXPIRE` | `604800` | refresh token 有效期（秒） | application.yaml |
| `JWT_ISSUER` | `orange` | token 的 iss | application.yaml |
| `SPRINGDOC_ENABLED` | `false` | 打开 `/swagger-ui.html` 与 `/api-docs` | application.yaml |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | application.yaml |
| `OPERATION_LOG_CLEANUP_CRON` | `0 30 3 * * *` | 清理任务 cron | application.yaml |
| `CORS_ORIGINS` / `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:4200` | 允许的来源，逗号分隔 | application.yaml |
| `COOKIE_SECURE` | `false` | refresh Cookie 是否只走 HTTPS | application.yaml |
| `COOKIE_SAME_SITE` | `Lax` | refresh Cookie 的 SameSite | application.yaml |
| `COOKIE_DOMAIN` | 空 | refresh Cookie 的 Domain | application.yaml |
| `LOGIN_MAX_ATTEMPTS` | `5` | 单账号失败阈值 | application.yaml |
| `LOGIN_IP_MAX_ATTEMPTS` | `20` | 单 IP 失败阈值 | application.yaml |
| `LOGIN_LOCK_MINUTES` | `15` | 锁定时长（分钟） | application.yaml |
| `APP_ENV` | `local` | `production|prod` 时启用密钥守卫 | JwtKeyConfig.java |
| `SPRING_PROFILES_ACTIVE` | 空 | 激活 `local`/`prod` profile | application-local.example.yaml |

`application-prod.yaml` 只做一件事：关闭 springdoc。数据库方言由 `DatabaseConfig` 按驱动注入，`ddl-auto` 固定 `none`，不要在 yaml 里写死方言。

## 3. Go + Gin + GORM

来源：`backend/go-gin-gorm/.env.example`、`internal/config/config.go`、`cmd/server/main.go`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` / `PORT` | `8081` | HTTP 端口 | config.go |
| `DB_DRIVER` | `postgres` | postgres/mysql/mariadb/sqlite | config.go |
| `DATABASE_URL` | 空 | 连接串；设置后覆盖离散值 | config.go |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432（MySQL 系 3306）/ `orange` | 离散连接 | config.go |
| `DB_USER` / `DB_PASSWORD` | postgres / root（按引擎） | 离散凭据 | config.go |
| `DB_SSLMODE` | `disable` | PostgreSQL sslmode | config.go |
| `DB_TIMEZONE` | `UTC` | PostgreSQL TimeZone | config.go |
| `DB_PATH` / `SQLITE_PATH` | `orange-go.db` | SQLite 文件 | config.go |
| `JWT_SECRET` | 开发默认值 | HS256 密钥 | config.go |
| `JWT_ISSUER` | `orange` | token 的 iss | config.go |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | `900` / `604800` | token 有效期（秒） | config.go |
| `ACCESS_TOKEN_EXPIRE_SECONDS` / `REFRESH_TOKEN_EXPIRE_SECONDS` | 空 | 旧名，仍被读取 | config.go |
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | 空 | 配置后改用 RS256 | config.go、auth/token.go |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | 空 | 直接内联 PEM | config.go |
| `CORS_ORIGINS` | 三个 localhost 前端来源 | 允许的来源 | config.go |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | `false` / `Lax` / 空 | refresh Cookie 属性 | config.go |
| `COOKIE_PATH` | `/api/v1/auth` | refresh Cookie 路径 | config.go |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | `5` / `20` / `15` | 登录锁定 | config.go |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | config.go |
| `APP_ENV` | 空 | `production|prod` 时校验默认密钥 | cmd/server/main.go |

## 4. Node.js + NestJS

来源：`backend/node-nestjs/.env.example`、`src/config/app-config.ts`、`src/config/db-driver.ts`、`src/config/database.options.ts`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` / `PORT` | `3000` | HTTP 端口 | app-config.ts |
| `DB_DRIVER` | 空（按 URL 推断；缺省 postgres） | 引擎 | db-driver.ts |
| `DATABASE_URL` | 空 | 连接串；优先于离散值 | app-config.ts |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432（MySQL 系 3306）/ `orange`；SQLite 为 `orange.db` | 离散连接 | app-config.ts |
| `DB_USER` / `DB_PASSWORD` | postgres / root（按引擎） | 离散凭据 | app-config.ts |
| `DB_SSL` | `false` | 非 SQLite 连接是否启用 SSL | app-config.ts |
| `JWT_SECRET` | 开发默认值 | HS256 密钥 | app-config.ts |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | `900` / `604800` | token 有效期（秒） | app-config.ts |
| `JWT_ISSUER` | `orange` | token 的 iss | app-config.ts |
| `CORS_ORIGINS` | 三个 localhost 前端来源 | 允许的来源 | app-config.ts |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | `false` / `lax` / 空 | refresh Cookie 属性 | app-config.ts |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | `5` / `20` / `15` | 登录锁定 | app-config.ts |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | app-config.ts |
| `APP_ENV` / `NODE_ENV` | `local` | `production|prod` 时校验默认密钥 | app-config.ts |

## 5. ASP.NET Core

来源：`backend/csharp/.env.example`、`src/Orange.Api/Configuration/AppOptions.cs`、`Program.cs`、`appsettings.json`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` / `PORT` | `8082` | HTTP 端口 | AppOptions.cs |
| `DB_DRIVER` | `postgres` | 引擎；与 URL scheme 冲突会报错 | AppOptions.cs |
| `DATABASE_URL` | 空 | 连接串；优先于离散值 | AppOptions.cs |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432（MySQL 系 3306）/ `orange`；SQLite 为 `orange-csharp.db` | 离散连接 | AppOptions.cs |
| `DB_USER` / `DB_PASSWORD` | postgres / root（按引擎） | 离散凭据 | AppOptions.cs |
| `SQLITE_PATH` | 空 | `DB_DRIVER=sqlite` 时的文件路径，优先于 `DB_NAME` | AppOptions.cs |
| `JWT_SECRET` | 开发默认值 | HS256 密钥 | AppOptions.cs、JwtService.cs |
| `JWT_ISSUER` | `orange` | token 的 iss | AppOptions.cs |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | `900` / `604800` | token 有效期（秒） | AppOptions.cs |
| `ACCESS_TOKEN_EXPIRE_SECONDS` / `ACCESS_TOKEN_SECONDS` | 空 | access 旧名，仍被读取 | AppOptions.cs |
| `CORS_ORIGINS` / `CORS_ALLOWED_ORIGINS` | 只有 `http://localhost:5173` | 允许的来源 | AppOptions.cs |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | `false` / `Lax` / 空 | refresh Cookie 属性 | AppOptions.cs |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | `5` / `20` / `15` | 登录锁定 | AppOptions.cs |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | AppOptions.cs |
| `APP_ENV` | `local` | `production|prod` 时校验默认密钥 | AppOptions.cs |

注意：`.env.example` 里的 `DB_SSLMODE` 没有被代码读取；SSL 只从 `DATABASE_URL` 的查询参数（`sslmode`/`ssl-mode`）解析。`backend/csharp` 没有 `launchSettings.json`，端口只由 `APP_PORT`/`PORT` 经 `Program.cs` 的 `UseUrls` 决定；`appsettings.json` 只保留日志与 `AllowedHosts`。

## 6. Rust + Axum

来源：`backend/rust-axum/.env.example`、`src/config.rs`、`src/db.rs`、`src/main.rs`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` / `PORT` | `8083` | HTTP 端口 | config.rs |
| `DATABASE_URL` | 空 | 连接串；优先于离散值 | config.rs |
| `DB_DRIVER` | 空（按 URL 推断） | 引擎 | config.rs、db.rs |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432（MySQL 系 3306）/ `orange` | 离散连接 | config.rs |
| `DB_USER` / `DB_PASSWORD` | postgres / root（按引擎） | 离散凭据 | config.rs |
| `DB_FILE` | 空（回退 `DB_NAME`） | SQLite 文件路径 | config.rs |
| `JWT_SECRET` | 开发默认值 | HS256 密钥 | config.rs |
| `JWT_ISSUER` | `orange` | token 的 iss | config.rs |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | `900` / `604800` | token 有效期（秒） | config.rs |
| `ACCESS_TOKEN_EXPIRE_SECONDS` / `REFRESH_TOKEN_EXPIRE_SECONDS` | 空 | 旧名，仍被读取 | config.rs |
| `CORS_ORIGINS` / `CORS_ALLOWED_ORIGINS` | 三个 localhost 前端来源 | 允许的来源 | config.rs |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | `false` / `Lax` / 空 | refresh Cookie 属性 | config.rs |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | `5` / `20` / `15` | 登录锁定 | config.rs |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | config.rs |
| `RUST_LOG` | `info` | tracing 日志级别过滤 | main.rs |
| `APP_ENV` | `local` | `production|prod` 时校验默认密钥 | config.rs |

## 7. Python + FastAPI

来源：`backend/python-fastapi/.env.example`、`app/config.py`、`app/main.py`、`app/db.py`。

| 变量 | 默认值 | 含义 | 来源 |
| --- | --- | --- | --- |
| `APP_PORT` / `PORT` | `8000` | HTTP 端口 | config.py |
| `DB_DRIVER` | 空（按 URL 推断；缺省 postgres） | 引擎 | config.py |
| `DATABASE_URL` | 空 | 连接串；优先于离散值 | config.py |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / 5432（MySQL 系 3306）/ `orange`；SQLite 为 `orange-fastapi.db` | 离散连接 | config.py |
| `DB_USER` / `DB_PASSWORD` | postgres / root（按引擎） | 离散凭据 | config.py |
| `JWT_SECRET` | 开发默认值 | HS256 密钥 | config.py |
| `JWT_ISSUER` | `orange` | token 的 iss | config.py |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | `900` / `604800` | token 有效期（秒） | config.py |
| `ACCESS_TOKEN_EXPIRE_SECONDS` / `REFRESH_TOKEN_EXPIRE_SECONDS` | 空 | 旧名，仍被读取 | config.py |
| `CORS_ORIGINS` | 三个 localhost 前端来源 | 允许的来源 | config.py |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | `false` / `lax` / 空 | refresh Cookie 属性 | config.py |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | `5` / `20` / `15` | 登录锁定 | config.py |
| `LOG_RETENTION_DAYS` / `OPERATION_LOG_RETENTION_DAYS` | `90` | 操作日志保留天数 | config.py |
| `APP_ENV` | `local` | `production|prod` 时校验默认密钥 | config.py |

## 8. 日志相关变量汇总

| 后端 | 可调项 | 说明 |
| --- | --- | --- |
| Spring Boot | `SPRING_SHOW_SQL`/`SHOW_SQL`、`LOG_RETENTION_DAYS`、`OPERATION_LOG_CLEANUP_CRON` | SQL 打印开关、审计保留与清理时间 |
| Go | `LOG_RETENTION_DAYS` | 用标准库 `log` 输出，没有级别变量 |
| NestJS | `LOG_RETENTION_DAYS` | 用 Nest `Logger`，没有级别变量 |
| ASP.NET Core | `LOG_RETENTION_DAYS` | 级别在 `appsettings.json` 的 `Logging:LogLevel`，不是环境变量 |
| Rust | `RUST_LOG`、`LOG_RETENTION_DAYS` | `RUST_LOG` 交给 tracing `EnvFilter` |
| FastAPI | `LOG_RETENTION_DAYS` | `logging.basicConfig` 固定 INFO |

## 9. 修改变量后的自检

1. `node scripts/check-config.mjs`：校验五份 `.env.example` 的 JWT 契约与三前端的 API base。
2. `npm run permissions:check`：校验权限目录与种子一致。
3. 新增变量时同步更新本页与对应 `.env.example`；新增后端还要补 `.gitignore` 条目。

> Last verified: 24826bb · 2026-11-07
> 事实来源: backend/springboot/src/main/resources/application*.yaml、backend/springboot/src/main/java/com/orange/config/{DatabaseSettings,DbEngine}.java、backend/{go-gin-gorm,node-nestjs,python-fastapi,rust-axum,csharp}/.env.example 及各栈 config 源码、scripts/check-config.mjs
