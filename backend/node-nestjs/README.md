English | [简体中文](README.zh-CN.md)

# Orange · Node.js + NestJS backend

This stack implements the same API contract in NestJS, following the Spring Boot reference for behaviour; one process connects to one database via `DB_DRIVER` / `DATABASE_URL`.

## Tech stack and versions

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | NestJS 11 (`@nestjs/common`, `core`, `jwt`, `platform-express`, `typeorm` are all `^11`) | `package.json` |
| ORM | TypeORM 0.3.20 | `package.json` |
| Language and compilation | TypeScript 5.7.2, `@nestjs/cli` 11, `ts-loader` 9.5.1 | `package.json` |
| Tests | jest 29.7.0 + ts-jest 29.2.5, configured inline in `package.json` (`rootDir: src`, `testRegex: .*\.spec\.ts$`) | `package.json` |
| Database clients | `pg` 8.13.1, `mysql2` 3.24.6, `better-sqlite3` 13.0.3 | `package.json` |
| Auth | `@nestjs/jwt` 11, `bcrypt` 5.1.1 (native module) | `package.json` |
| Validation and transformation | `class-validator` 0.14.1, `class-transformer` 0.5.1 | `package.json` |
| Other | `cookie-parser` 1.4.7, `dotenv` 16.4.7, `reflect-metadata` 0.2.2, `rxjs` 7.8.1 | `package.json` |
| API documentation | unified `/swagger` + `/openapi.json` (no extra dependency) | `src/main.ts` |
| Package management | pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`; CI uses pnpm 12.15.0) | repository files, `main.yml` |

## Commands

| Purpose | Command | Source / notes |
| --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` | `main.yml` (backend job, nest) |
| Start (dev) | `pnpm start:dev` | `package.json` (`nest start --watch`) |
| Start (artifact) | `pnpm build` then `pnpm start:prod` | `package.json` (`node dist/main.js`) |
| Test | `pnpm test` | `main.yml`; jest only runs `src/**/*.spec.ts` |
| Build | `pnpm build` | `main.yml` (`nest build`) |
| Type check | `pnpm typecheck` | `package.json` (`tsc --noEmit -p tsconfig.json`) |
| Smoke | `pnpm smoke` | `package.json` (`node scripts/smoke.mjs`), needs a seeded database and a running service |

Port source variable: `int(process.env.APP_PORT ?? process.env.PORT, 3000)` (`src/config/app-config.ts:50`), default 3000; `.env.example` sets `PORT=3000`.

`bcrypt` and `better-sqlite3` are native modules, so their build scripts run during installation; `pnpm-workspace.yaml` pre-approves both packages through `onlyBuiltDependencies` and `allowBuilds`, so `pnpm approve-builds` is not needed.

## Directory structure and layering

```text
src/main.ts              bootstrap: global prefix /api/v1, CORS, cookies, TraceId
src/app.module.ts        TypeORM connection, global guards / interceptors / filters / pipes
src/config/              AppConfig (environment variables), DB driver normalization, TypeORM options
src/common/              response envelope, error codes, TraceId, validation, tree and code policy, password tools
src/auth/                login/refresh/logout/user-info/change-password, JWT, refresh rotation, login lockout
src/menus/               /auth/menus menu tree
src/{users,roles,groups,permissions}/   DTO, service, controller
src/operation-log/       audit interceptor, recording policy, queries
src/entities/            TypeORM entities for the shared schema
src/policies/            permission shape and effective permissions
scripts/smoke.mjs        HTTP-level smoke script
```

## Configuration entry point

Copy `.env.example` to `.env.local` (gitignored); `src/config/env.ts` loads that file with `dotenv`, and real environment variables take precedence. The database engine is taken from `DB_DRIVER` first, then from the `DATABASE_URL` scheme, falling back to `postgres`; `DATABASE_URL` overrides the discrete `DB_*` variables. The full variable list and cross-stack comparison are in the [backend configuration conventions](../../backend/README.md).

## Deviations of this stack

1. Unit tests cover pure policy only: 7 `.spec.ts` files that neither boot Nest nor connect to a database; database behaviour is verified by `scripts/smoke.mjs` against a real service, which differs from Go (route and smoke tests included).
2. TypeORM `synchronize: false` (`src/config/database.options.ts:16`): it neither creates tables nor migrates, and the schema belongs to `database/<engine>`.
3. MariaDB goes through TypeORM's `mysql` driver and the `mysql2` client (`src/config/database.options.ts`), with no extra `mariadb` package; SQLite uses `better-sqlite3`.
4. JWT is HS256 only: `JwtModule.registerAsync` receives only `secret` (`src/auth/auth.module.ts:21`), unlike Spring's RS256.
5. No `@nestjs/swagger`: `/swagger` + `/openapi.json` are registered on the Express adapter in `src/main.ts`, outside the global prefix and guards.

## Size and tests

| Metric | Value |
| --- | --- |
| Version-controlled files | 96 |
| TypeScript source files | 83 (`src/`) |
| Test files | 7 `.spec.ts` files (pure unit tests, no database needed) |

Counting basis: `git ls-files backend/node-nestjs`. The endpoint list, dialect differences and verification results are in the [HTTP contract](../../contracts/openapi.json), [database dialects](../../database/) and [stack matrix](../../README.md) respectively.

> Last verified: c7b6531 · 2026-11-08
> Sources: `package.json`, `pnpm-workspace.yaml`, `.env.example`, `src/config/*.ts`, `src/main.ts`, `src/**/*.spec.ts`, `.github/workflows/main.yml`
