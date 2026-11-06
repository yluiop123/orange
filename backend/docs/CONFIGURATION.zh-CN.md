> [English](./CONFIGURATION.md) | 简体中文

# 后端配置

数据库**设计**是公共的、与技术栈无关的：表结构和种子数据在 `database/<engine>/`，
模型说明见 [`../../docs/DATABASE.zh-CN.md`](../../docs/DATABASE.zh-CN.md)。
本页只说明各技术栈如何配置，以及如何切换数据库连接。

## 各技术栈的配置文件

每个技术栈的配置都放在自己的代码目录下。复制一次已提交的示例，然后修改本地文件：

| 技术栈 | 已提交示例 | 本地文件（gitignore） | 读取方式 |
| --- | --- | --- | --- |
| Spring Boot | `src/main/resources/application-local.example.yaml` | `application-local.yaml` | `SPRING_PROFILES_ACTIVE=local` |
| Go | `.env.example` | `.env.local` | `godotenv` |
| NestJS | `.env.example` | `.env.local` | `dotenv`（`src/config/env.ts`） |
| C# | `.env.example` | `.env.local` | 启动时加载 |
| Rust | `.env.example` | `.env` | `dotenvy` |
| FastAPI | `.env.example` | `.env` | `python-dotenv` |

```bash
# 示例
cp backend/go-gin-gorm/.env.example backend/go-gin-gorm/.env.local
cp backend/node-nestjs/.env.example backend/node-nestjs/.env.local
cp backend/csharp/.env.example backend/csharp/.env.local
cp backend/rust-axum/.env.example backend/rust-axum/.env
cp backend/python-fastapi/.env.example backend/python-fastapi/.env
cp backend/springboot/src/main/resources/application-local.example.yaml \
   backend/springboot/src/main/resources/application-local.yaml
```

各技术栈启动时会加载自己的本地文件；真实环境变量仍然优先。容器环境由平台注入变量。

## 优先级

1. 真实环境变量（容器、CI）。
2. 该技术栈的本地文件。
3. 代码默认值。

## 共享变量

| 分组 | 变量 |
| --- | --- |
| 端口 | `PORT`（Spring：`APP_PORT` / `server.port`） |
| 数据库 | `DB_DRIVER`、`DATABASE_URL`（Spring：`DB_URL` / `SPRING_DATASOURCE_URL`）、`DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_SSLMODE` |
| JWT | `JWT_SECRET`、access/refresh 有效期、issuer；Spring 使用 RSA PEM 路径 |
| Cookie | `COOKIE_SECURE`、`COOKIE_SAME_SITE`、`COOKIE_DOMAIN` |
| CORS | `CORS_ORIGINS` |
| 操作日志 | 日志保留天数 |
| 登录限流 | `LOGIN_MAX_ATTEMPTS`、`LOGIN_IP_MAX_ATTEMPTS`、`LOGIN_LOCK_MINUTES` |

## 切换数据库

所有技术栈都支持 PostgreSQL、MySQL、MariaDB 和 SQLite。应用不会自动建表；
先加载 `database/<engine>/ddl.sql` 与 `dml.sql`（见
[GETTING-STARTED.zh-CN.md](./GETTING-STARTED.zh-CN.md)）。

### Spring Boot

```bash
DB_DRIVER=postgres DB_URL=jdbc:postgresql://127.0.0.1:5432/orange \
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

DB_DRIVER=mysql DB_URL=jdbc:mysql://127.0.0.1:3306/orange \
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

### Go、NestJS、C#、Rust、FastAPI

`DATABASE_URL` 优先于离散的 `DB_*`；没有 `DATABASE_URL` 时，用离散值组装连接串。
`DB_DRIVER` 选择方言。

```bash
# PostgreSQL
DB_DRIVER=postgres DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/orange

# MySQL
DB_DRIVER=mysql DATABASE_URL=mysql://root:root@127.0.0.1:3306/orange

# MariaDB
DB_DRIVER=mariadb DATABASE_URL=mariadb://root:root@127.0.0.1:3306/orange

# SQLite
DB_DRIVER=sqlite DATABASE_URL=sqlite:./orange.db
```

FastAPI 还接受 `postgresql+psycopg://`；其他移植实现接受上面这些简写形式。
openGauss、OceanBase、GoldenDB 只有静态 SQL，没有经过测试的运行时。

## 密钥

- 不要提交 `.env`、`.env.local`、`application-local.yaml` 或真实 RSA 私钥。
- 示例中的开发默认值只是占位符。
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` 支持 `classpath:` 与 `file:` 前缀。
  见 [`../../docs/security/jwt-keys.md`](../../docs/security/jwt-keys.md)。
- CI 通过 GitHub Secrets 注入密钥，不使用提交文件。
