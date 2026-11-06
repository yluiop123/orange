> [English](./CONFIGURATION.md) | 简体中文

# 后端配置

## 单一来源

```text
config/app.example.env   提交的模板
config/app.env           本地副本（gitignore）
scripts/sync-config.mjs  生成器
```

修改 `config/app.env` 后执行 `node scripts/sync-config.mjs`。生成文件不能手工修改。

## 生成文件

| 技术栈 | 生成文件 | 读取方式 |
| --- | --- | --- |
| Spring Boot | `backend/springboot/src/main/resources/application-local.yaml` | `SPRING_PROFILES_ACTIVE=local` |
| Go | `backend/go-gin-gorm/.env.local` | `godotenv` |
| NestJS | `backend/node-nestjs/.env.local` | `dotenv` |
| C# | `backend/csharp/.env.local` | 启动时加载 |
| Rust | `backend/rust-axum/.env` | `dotenvy` |
| FastAPI | `backend/python-fastapi/.env` | `python-dotenv` |

## 优先级

1. 真实环境变量（容器、CI）。
2. 生成的本地文件。
3. 代码默认值。

进程已设置某个变量时，生成的本地文件不会覆盖它；但以文件为唯一来源的场景除外
（Spring profile、Vite/Angular 构建）。

## 共享变量

| 分组 | 变量 |
| --- | --- |
| 端口 | `<STACK>_PORT`；生成器写成 `APP_PORT` |
| 数据库 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_SSLMODE` |
| JWT | `JWT_SECRET`、`JWT_ACCESS_EXPIRE`、`JWT_REFRESH_EXPIRE`、`JWT_ISSUER` |
| Spring RSA | `JWT_PRIVATE_KEY`、`JWT_PUBLIC_KEY`（为空时使用 classpath PEM） |
| Cookie | `COOKIE_SECURE`、`COOKIE_SAME_SITE`、`COOKIE_DOMAIN` |
| CORS | `CORS_ORIGINS`，逗号分隔 |
| 操作日志 | `LOG_RETENTION_DAYS` |
| 登录限流 | `LOGIN_MAX_ATTEMPTS`、`LOGIN_IP_MAX_ATTEMPTS`、`LOGIN_LOCK_MINUTES` |

数据库选择方式因技术栈而异：Spring Boot 使用 `DB_DRIVER` + `DB_URL`，多数移植实现使用
`DB_DRIVER` + `DATABASE_URL`；没有 `DATABASE_URL` 时，用离散的 `DB_*` 组装连接串。
具体开关见各技术栈 README。

## 独立的 `.env.example`

`backend/<stack>/.env.example` 是不经过生成器、单独运行该技术栈时的参考模板。
`sync-config.mjs` 不会读取它，其中可能使用框架原生变量名（例如 FastAPI 的 `PORT`，
应用会在 `APP_PORT` 之后回退读取）。有疑问时以生成文件为准。

## 密钥

- 不要提交 `config/app.env`、`.env.local`、`.env` 或真实 RSA 私钥。
- `app.example.env` 中的 JWT secret 只是开发占位值，生产环境必须替换。
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` 支持 `classpath:` 与 `file:` 前缀。
  见 [`../../docs/security/jwt-keys.md`](../../docs/security/jwt-keys.md)。
- CI 通过 GitHub Secrets 注入密钥，不使用提交文件。
