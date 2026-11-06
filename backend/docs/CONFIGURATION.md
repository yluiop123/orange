> English | [简体中文](./CONFIGURATION.zh-CN.md)

# Backend Configuration

## One source of truth

```text
config/app.example.env   committed template
config/app.env           local copy (gitignored)
scripts/sync-config.mjs  generator
```

Edit `config/app.env`, then run `node scripts/sync-config.mjs`. Generated files
are never edited by hand.

## Generated files

| Stack | Generated file | Loaded by |
| --- | --- | --- |
| Spring Boot | `backend/springboot/src/main/resources/application-local.yaml` | `SPRING_PROFILES_ACTIVE=local` |
| Go | `backend/go-gin-gorm/.env.local` | `godotenv` |
| NestJS | `backend/node-nestjs/.env.local` | `dotenv` |
| C# | `backend/csharp/.env.local` | loader in startup |
| Rust | `backend/rust-axum/.env` | `dotenvy` |
| FastAPI | `backend/python-fastapi/.env` | `python-dotenv` |

## Precedence

1. Real environment variables (containers, CI).
2. The generated local file.
3. Code defaults.

The generated file is not loaded when the process already has the variable set,
except where the framework reads the file as its only source (Spring profile,
Vite/Angular builds).

## Shared variables

| Group | Variables |
| --- | --- |
| Ports | `<STACK>_PORT`; the generator writes `APP_PORT` |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE` |
| JWT | `JWT_SECRET`, `JWT_ACCESS_EXPIRE`, `JWT_REFRESH_EXPIRE`, `JWT_ISSUER` |
| Spring RSA | `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (empty uses the classpath PEMs) |
| Cookie | `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN` |
| CORS | `CORS_ORIGINS`, comma-separated |
| Operations | `LOG_RETENTION_DAYS` |
| Lockout | `LOGIN_MAX_ATTEMPTS`, `LOGIN_IP_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES` |

Database selection differs per stack: Spring Boot uses `DB_DRIVER` + `DB_URL`,
most ports use `DB_DRIVER` + `DATABASE_URL`, and the discrete `DB_*` values are
assembled into a URL when `DATABASE_URL` is absent. Each README documents the
exact switch.

## Standalone `.env.example` files

`backend/<stack>/.env.example` is a reference for running that stack without the
generator. It is not read by `sync-config.mjs`, and it may list framework-native
names (for example `PORT` for FastAPI, which the app reads as a fallback after
`APP_PORT`). When in doubt, the generated file wins.

## Secrets

- Never commit `config/app.env`, `.env.local`, `.env`, or a real RSA private key.
- Development JWT secrets in `app.example.env` are placeholders and must be
  replaced in production.
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` accept `classpath:` and `file:` prefixes.
  See [`../../docs/security/jwt-keys.md`](../../docs/security/jwt-keys.md).
- CI supplies secrets through GitHub Secrets, not tracked files.
