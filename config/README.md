# Configuration

One source of truth: `config/app.env`. A generator writes each stack's native config file, so shared values (ports, API base, database, CORS, JWT) are edited once.

`config/app.example.env` is the **only** committed environment template for the
whole repository. The old root `.env.example` was removed because it duplicated
this file and had drifted.

```text
config/
  app.example.env    # committed template, no real secrets
  app.env            # your local copy (gitignored)
scripts/
  sync-config.mjs    # generator
```

## Use it

```bash
cp config/app.example.env config/app.env   # once
node scripts/sync-config.mjs               # after every change
```

Generated files (all gitignored):

| Stack | Generated file |
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

Each stack loads its local file automatically:

- Vite loads `.env.local`.
- Angular's `npm start` uses the `local` configuration.
- Spring Boot: run with `SPRING_PROFILES_ACTIVE=local`.
- Go uses `godotenv.Load(".env.local")`.
- NestJS uses `dotenv` with `.env.local`.
- C# loads `.env.local` before building its options.
- Rust uses `dotenvy` with `.env`.
- FastAPI uses `python-dotenv` with `.env`.

## Variables

| Variable | Meaning |
| --- | --- |
| `APP_ENV` | Free-form environment label |
| `<STACK>_PORT` | Per-stack port; the generator writes it as `APP_PORT` |
| `API_BASE` / `*_API_BASE` | API prefix per frontend |
| `*_PROXY_TARGET` | Vite dev proxy target |
| `*_MOCK_ENABLE` | In-browser mock switch (React/Vue/Angular) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_SSLMODE` | PostgreSQL connection |
| `JWT_SECRET` | HS256 secret used by Go/Nest/C#/Rust/FastAPI |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Spring Boot RSA keys; empty uses the classpath PEMs |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | Token TTL in seconds |
| `JWT_ISSUER` | Token issuer |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` / `COOKIE_DOMAIN` | Refresh cookie |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `LOG_RETENTION_DAYS` | Operation-log retention |
| `LOGIN_MAX_ATTEMPTS` / `LOGIN_IP_MAX_ATTEMPTS` / `LOGIN_LOCK_MINUTES` | Login lockout |
| `REACT_CESIUM_TOKEN` | Optional Cesium Ion token; empty uses OpenStreetMap |

## Secrets

- `config/app.env` is gitignored. Never commit it.
- The committed `config/app.example.env` contains dev defaults only.
- Set production secrets through the environment (or GitHub Secrets), not through a tracked file.
- `REACT_CESIUM_TOKEN` belongs in `config/app.env` or `.env.local`; the page falls back to OpenStreetMap when it is empty.

## Precedence

1. Real environment variables (containers, CI).
2. The generated local file.
3. Code defaults.

The generated file is not loaded when the process already has the variable set, except for Vite and Angular where the file is the build-time source.
