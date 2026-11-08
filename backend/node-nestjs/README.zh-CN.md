[English](README.md) | 简体中文

# Orange · Node.js + NestJS 后端

本栈用 NestJS 实现同一份接口契约，行为以 Spring Boot 基准为准；一个进程通过 `DB_DRIVER` / `DATABASE_URL` 连一种数据库。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | NestJS 11（`@nestjs/common`、`core`、`jwt`、`platform-express`、`typeorm` 均为 `^11`） | `package.json` |
| ORM | TypeORM 0.3.20 | `package.json` |
| 语言与编译 | TypeScript 5.7.2、`@nestjs/cli` 11、`ts-loader` 9.5.1 | `package.json` |
| 测试 | jest 29.7.0 + ts-jest 29.2.5，配置内联在 `package.json`（`rootDir: src`、`testRegex: .*\.spec\.ts$`） | `package.json` |
| 数据库客户端 | `pg` 8.13.1、`mysql2` 3.24.6、`better-sqlite3` 13.0.3 | `package.json` |
| 认证 | `@nestjs/jwt` 11、`bcrypt` 5.1.1（原生模块） | `package.json` |
| 校验与转换 | `class-validator` 0.14.1、`class-transformer` 0.5.1 | `package.json` |
| 其他 | `cookie-parser` 1.4.7、`dotenv` 16.4.7、`reflect-metadata` 0.2.2、`rxjs` 7.8.1 | `package.json` |
| 接口文档 | `@nestjs/swagger`（CLI 插件）；`/swagger` + `/openapi.json` | `src/main.ts`、`nest-cli.json` |
| 包管理 | pnpm（`pnpm-lock.yaml`、`pnpm-workspace.yaml`；CI 用 pnpm 12.15.0） | 仓库文件、`main.yml` |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | `pnpm install --frozen-lockfile` | `main.yml`（backend job, nest） |
| 启动（开发） | `pnpm start:dev` | `package.json`（`nest start --watch`） |
| 启动（产物） | `pnpm build` 后 `pnpm start:prod` | `package.json`（`node dist/main.js`） |
| 测试 | `pnpm test` | `main.yml`；jest 只跑 `src/**/*.spec.ts` |
| 构建 | `pnpm build` | `main.yml`（`nest build`） |
| 类型检查 | `pnpm typecheck` | `package.json`（`tsc --noEmit -p tsconfig.json`） |
| 冒烟 | `pnpm smoke` | `package.json`（`node scripts/smoke.mjs`），需要已 seed 的库和已启动的服务 |

端口来源变量：`int(process.env.APP_PORT ?? process.env.PORT, 3000)`（`src/config/app-config.ts:50`），默认 3000；`.env.example` 写 `PORT=3000`。

`bcrypt` 与 `better-sqlite3` 是原生模块，安装时要跑构建脚本；`pnpm-workspace.yaml` 已用 `onlyBuiltDependencies` 与 `allowBuilds` 预先批准这两个包，无需再手工 `pnpm approve-builds`。

## 目录结构与分层

```text
src/main.ts              bootstrap：全局前缀 /api/v1、CORS、cookie、TraceId
src/app.module.ts        TypeORM 连接，全局守卫 / 拦截器 / 过滤器 / 管道
src/config/              AppConfig（环境变量）、DB 驱动归一化、TypeORM 选项
src/common/              响应包体、错误码、TraceId、校验、树与编码策略、密码工具
src/auth/                登录/刷新/登出/user-info/改密、JWT、刷新轮换、登录锁定
src/menus/               /auth/menus 菜单树
src/{users,roles,groups,permissions}/   DTO、service、controller
src/operation-log/       审计拦截器、记录策略、查询
src/entities/            共享 schema 的 TypeORM 实体
src/policies/            权限形状与有效权限
scripts/smoke.mjs        HTTP 级冒烟脚本
```

## 配置入口

复制 `.env.example` 为 `.env.local`（被 gitignore）；`src/config/env.ts` 用 `dotenv` 加载该文件，真实环境变量优先。数据库引擎先看 `DB_DRIVER`，其次看 `DATABASE_URL` 的 scheme，兜底 `postgres`；`DATABASE_URL` 覆盖离散 `DB_*`。完整变量清单与跨栈对照见 [后端配置约定](../../backend/README.zh-CN.md)。

## 本栈偏差

1. 单元测试只覆盖纯策略：11 个 `.spec.ts`；翻译测试使用内存 SQLite，其余不启动 Nest、不连数据库；数据库行为靠 `scripts/smoke.mjs` 在真实服务上验证，这与 Go（含路由与冒烟测试）不同。
2. TypeORM `synchronize: false`（`src/config/database.options.ts:16`）：不建表、不迁移，schema 由 `database/<engine>` 负责。
3. MariaDB 走 TypeORM 的 `mysql` 驱动和 `mysql2` 客户端（`src/config/database.options.ts`），不需要额外的 `mariadb` 包；SQLite 用 `better-sqlite3`。
4. JWT 遵循统一规则：RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的 HS256（`src/auth/auth.module.ts`、`src/auth/token.service.ts`）。用 OpenSSL 生成的同一对 RSA 密钥六栈通用。
5. `@nestjs/swagger` 从控制器与 DTO 生成文档（CLI 插件推断属性）；`/swagger` + `/openapi.json` 挂在全局前缀与守卫之外（`src/main.ts`）。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 101 |
| TypeScript 源文件 | 90（`src/`） |
| 测试文件 | 11 个 `.spec.ts`（纯单元测试与 SQLite 翻译测试） |

统计口径：`git ls-files backend/node-nestjs`。前端接口快照见 [frontend/openapi.json](../../frontend/openapi.json)，方言见 [database](../../database/)，技术栈总表见[根 README](../../README.zh-CN.md)。

> Last verified: c7b6531 · 2026-11-08
> 事实来源：`package.json`、`pnpm-workspace.yaml`、`.env.example`、`src/config/*.ts`、`src/main.ts`、`src/**/*.spec.ts`、`.github/workflows/main.yml`
