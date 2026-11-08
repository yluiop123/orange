English | [简体中文](README.zh-CN.md)

# Orange · Node.js + NestJS backend

Implements the shared API contract in NestJS, following the Spring Boot reference
for behaviour. One process connects to one database selected by `DB_DRIVER` /
`DATABASE_URL`. Shared backend conventions are in [../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | NestJS 11 | `package.json` |
| ORM | TypeORM 0.3.20 | `package.json` |
| Language | TypeScript 5.7, `@nestjs/cli` 11 | `package.json` |
| Database clients | `pg` 8.13, `mysql2` 3.24, `better-sqlite3` 13 | `package.json` |
| Auth | `@nestjs/jwt` 11, `bcrypt` 5.1 (native) | `package.json` |
| Validation | `class-validator` 0.14, `class-transformer` 0.5 | `package.json` |
| Other | `cookie-parser`, `dotenv`, `reflect-metadata`, `rxjs` | `package.json` |
| API documentation | `@nestjs/swagger` + CLI plugin | `src/main.ts`, `nest-cli.json` |
| Package manager | pnpm 12.15.0 | `package.json` |

## Requirements and commands

- Node.js 20.19+ or 22.12+ and pnpm 12.15.0.
- `bcrypt` and `better-sqlite3` are native modules; `pnpm-workspace.yaml`
  pre-approves their build scripts, so `pnpm approve-builds` is not needed.

| Purpose | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Start (dev) | `pnpm start:dev` |
| Build | `pnpm build` |
| Start (artifact) | `pnpm start:prod` (`node dist/main.js`) |
| Test | `pnpm test` |
| Type-check | `pnpm typecheck` |
| Smoke | `pnpm smoke` (needs a seeded database and a running service) |

## Directory structure and layering

```text
src/main.ts              bootstrap: global prefix /api/v1, CORS, cookies, TraceId
src/app.module.ts        TypeORM connection, global guards / interceptors / filters
src/config/              AppConfig, DB driver normalization, TypeORM options
src/common/              envelope, error codes, TraceId, validation, tree policy
src/auth/                login/refresh/logout/user-info/change-password, JWT, lockout
src/menus/               /auth/menus menu tree
src/{users,roles,groups,permissions}/   DTO, service, controller
src/operation-log/       audit interceptor and queries
src/entities/            TypeORM entities for the shared schema
src/policies/            permission shape and effective permissions
scripts/smoke.mjs        HTTP-level smoke script
```

## API, auth and database access

- Controllers declare the Authority and call services; a global interceptor writes
  the envelope and a global filter maps errors. Error codes live in
  `src/common/error-code.ts`.
- JWT uses `@nestjs/jwt`: RS256 when both RSA keys are set, otherwise HS256 with
  `JWT_SECRET`. Refresh tokens rotate in an HttpOnly cookie.
- TypeORM uses `synchronize: false`, so it neither creates tables nor migrates;
  the schema belongs to `database/<engine>`.
- MariaDB uses TypeORM's `mysql` driver and `mysql2`; SQLite uses
  `better-sqlite3`.
- Unit tests cover pure policy; the translation suite opens an in-memory SQLite
  database. Database behaviour is checked by `pnpm smoke` against a real service.

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `3000` | `src/config/app-config.ts`: `APP_PORT` → `PORT` → 3000 | Set `APP_PORT` or `PORT` in `.env.local` |
| API prefix | `/api/v1` | `src/main.ts` | — |
| Swagger | `/swagger`, `/openapi.json` | `src/main.ts`, `nest-cli.json` | — |
| CORS | React/Vue dev origins | `CORS_ORIGINS` | Edit `.env.local` |
| Local config | `.env.local` | this stack's root | Copy `.env.example` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DB_DRIVER`, then URL scheme, then default |
| Connection URL | `DATABASE_URL` overrides discrete values | `.env.example`, `src/config/` |
| Discrete values | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` | `src/config/` |
| SQLite file | `DB_NAME` or the URL path | `src/config/` |
| Migrations | disabled (`synchronize: false`) | `src/config/database.options.ts` |

## Switching database

| Target | Dependency / driver | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `pg` (already in `package.json`) | `DB_DRIVER=postgres`, `DATABASE_URL=postgres://...` | `database/postgres/ddl.sql` then `dml.sql` | Reference |
| MySQL | `mysql2` | `DB_DRIVER=mysql`, `mysql://...` | `database/mysql/ddl.sql` then `dml.sql` | — |
| MariaDB | `mysql2` through TypeORM's `mysql` driver | `DB_DRIVER=mariadb`, MariaDB URL/port | `database/mariadb/ddl.sql` then `dml.sql` | No extra `mariadb` package |
| SQLite | `better-sqlite3` | `DB_DRIVER=sqlite`, `sqlite:./orange.db` or `DB_NAME` | `database/sqlite/ddl.sql` then `dml.sql` | Native module |

Steps: create the database if needed, load `ddl.sql` then `dml.sql`, set the driver
and URL or `DB_*`, restart, then verify with the seed accounts. `DATABASE_URL`
wins over the discrete values.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `.env.local` (gitignored) + process environment; process wins |
| Test | `pnpm test`; jest runs `src/**/*.spec.ts`, translations use in-memory SQLite |
| Production | process environment; `pnpm build` then `pnpm start:prod` |

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
