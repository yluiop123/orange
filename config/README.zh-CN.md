# 配置管理

唯一来源是 `config/app.env`。生成器把它写进每个栈自己的配置文件，共享值（端口、API 前缀、数据库、CORS、JWT）只需要改一处。

`config/app.example.env` 是仓库中**唯一**提交的环境变量模板。根目录旧的
`.env.example` 已移除，因为它与本文件重复并且已经过期。

```text
config/
  app.example.env    # 提交的模板，不含真实密钥
  app.env            # 本地副本（已 gitignore）
scripts/
  sync-config.mjs    # 生成器
```

## 使用方式

```bash
cp config/app.example.env config/app.env   # 只需一次
node scripts/sync-config.mjs               # 每次修改后运行
```

生成的文件（均已 gitignore）：

| 栈 | 生成文件 |
| --- | --- |
| React | `frontend/react/.env.local` |
| Vue | `frontend/vue/.env.local` |
| Angular | `frontend/angular/src/environments/environment.local.ts` |
| Spring Boot | `backend/springboot/src/main/resources/application-local.yaml` |
| Go | `backend/go-gin-gorm/.env.local` |
| NestJS | `backend/node-nestjs/.env.local` |
| C# | `backend/csharp/.env.local` |
| Rust | `backend/rust-axum/.env` |
| FastAPI | `backend/python-fastapi/.env` |

各栈会自动读取自己的本地文件：

- Vite 读取 `.env.local`。
- Angular 的 `npm start` 使用 `local` 配置。
- Spring Boot 使用 `SPRING_PROFILES_ACTIVE=local` 启动。
- Go 使用 `godotenv.Load(".env.local")`。
- NestJS 使用 `dotenv` 读取 `.env.local`。
- C# 在构建配置前读取 `.env.local`。
- Rust 使用 `dotenvy` 读取 `.env`。
- FastAPI 使用 `python-dotenv` 读取 `.env`。

## 变量说明

| 变量 | 含义 |
| --- | --- |
| `APP_ENV` | 环境标识 |
| `<STACK>_PORT` | 各栈端口；生成器写成 `APP_PORT` |
| `API_BASE` / `*_API_BASE` | 各前端 API 前缀 |
| `*_PROXY_TARGET` | Vite 开发代理目标 |
| `*_MOCK_ENABLE` | 浏览器内 Mock 开关（React/Vue/Angular） |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_SSLMODE` | PostgreSQL 连接 |
| `JWT_SECRET` | Go/Nest/C#/Rust/FastAPI 使用的 HS256 密钥 |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Spring Boot 的 RSA 密钥；留空使用 classpath PEM |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | Token 有效期（秒） |
| `JWT_ISSUER` | Token 签发者 |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | Refresh Cookie |
| `CORS_ORIGINS` | 逗号分隔的允许来源 |
| `LOG_RETENTION_DAYS` | 操作日志保留天数 |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | 登录锁定 |
| `REACT_CESIUM_TOKEN` | 可选的 Cesium Ion token；留空使用 OpenStreetMap |

## 密钥

- `config/app.env` 已 gitignore，不要提交。
- 提交的 `config/app.example.env` 只含开发默认值。
- 生产密钥通过环境变量（或 GitHub Secrets）注入，不放进仓库文件。
- `REACT_CESIUM_TOKEN` 放在 `config/app.env` 或 `.env.local`；为空时 Cesium 页回退到 OpenStreetMap。

## 优先级

1. 真实环境变量（容器、CI）。
2. 生成的本地文件。
3. 代码默认值。

进程已经设置变量时，生成的本地文件不会覆盖它；Vite 和 Angular 例外，它们是构建期读取本地文件。
