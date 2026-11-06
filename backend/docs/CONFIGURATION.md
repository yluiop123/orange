> English | [简体中文](./CONFIGURATION.zh-CN.md)

# Backend Configuration

Database **design** is public and technology-agnostic: schema and seed live in
`database/<engine>/`, and the model is described in
[`../../docs/DATABASE.md`](../../docs/DATABASE.md). This page only explains how
each stack is configured and how to switch its database connection.

## Per-stack files

Every stack keeps its own configuration next to its code. Copy the committed
example once, then edit the local file:

| Stack | Committed example | Local file (gitignored) | Loaded by |
| --- | --- | --- | --- |
| Spring Boot | `src/main/resources/application-local.example.yaml` | `application-local.yaml` | `SPRING_PROFILES_ACTIVE=local` |
| Go | `.env.example` | `.env.local` | `godotenv` |
| NestJS | `.env.example` | `.env.local` | `dotenv` (`src/config/env.ts`) |
| C# | `.env.example` | `.env.local` | startup loader |
| Rust | `.env.example` | `.env` | `dotenvy` |
| FastAPI | `.env.example` | `.env` | `python-dotenv` |

```bash
# examples
cp backend/go-gin-gorm/.env.example backend/go-gin-gorm/.env.local
cp backend/node-nestjs/.env.example backend/node-nestjs/.env.local
cp backend/csharp/.env.example backend/csharp/.env.local
cp backend/rust-axum/.env.example backend/rust-axum/.env
cp backend/python-fastapi/.env.example backend/python-fastapi/.env
cp backend/springboot/src/main/resources/application-local.example.yaml \
   backend/springboot/src/main/resources/application-local.yaml
```

Each stack loads its local file on startup; real environment variables still
win. In containers the platform injects the environment instead.

## Precedence

1. Real environment variables (containers, CI).
2. The local file for that stack.
3. Code defaults.

## Shared variables

| Group | Variables |
| --- | --- |
| Port | `PORT` (Spring: `APP_PORT` / `server.port`) |
| Database | `DB_DRIVER`, `DATABASE_URL` (Spring: `DB_URL` / `SPRING_DATASOURCE_URL`), `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE` |
| JWT | `JWT_SECRET` (HS256 stacks), `JWT_ISSUER`, `JWT_ACCESS_EXPIRE`, `JWT_REFRESH_EXPIRE`; Spring Boot uses RS256 PEM keys |
| Cookie | `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN` |
| CORS | `CORS_ORIGINS` |
| Operations | operation-log retention |
| Lockout | `LOGIN_MAX_ATTEMPTS`, `LOGIN_IP_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES` |

The JWT contract is the same in every stack: `iss=orange`, access 900s, refresh
604800s, and the claims `jti/typ/ver/username/sub/iss/iat/exp`. Spring Boot
signs with RS256; the other stacks use HS256 by default (Go can also use RS256
when `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` are set). Run
`node scripts/check-config.mjs` to verify the committed templates.

## Switching the database

All stacks support PostgreSQL, MySQL, MariaDB and SQLite. The schema is not
created by the application; load `database/<engine>/ddl.sql` and `dml.sql`
first (see [GETTING-STARTED.md](./GETTING-STARTED.md)).

### Spring Boot

```bash
DB_DRIVER=postgres DB_URL=jdbc:postgresql://127.0.0.1:5432/orange \
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

DB_DRIVER=mysql DB_URL=jdbc:mysql://127.0.0.1:3306/orange \
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

### Go, NestJS, C#, Rust, FastAPI

`DATABASE_URL` wins over the discrete `DB_*` values; when it is absent the
discrete values are assembled into a URL. `DB_DRIVER` selects the dialect.

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

FastAPI also accepts `postgresql+psycopg://`; the ports accept the short forms
shown above. openGauss, OceanBase and GoldenDB have static SQL but no tested
runtime.

## Secrets

- Never commit `.env`, `.env.local`, `application-local.yaml` or a real RSA key.
- Development defaults in the examples are placeholders.
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` accept `classpath:` and `file:` prefixes.
  See [`../../docs/security/jwt-keys.md`](../../docs/security/jwt-keys.md).
- CI supplies secrets through GitHub Secrets, not tracked files.
