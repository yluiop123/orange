[English](README.md) | 简体中文

# Orange · Node.js + NestJS 后端

用 NestJS 实现共享 API 契约，行为以 Spring Boot 基准为准。一个进程通过 `DB_DRIVER` /
`DATABASE_URL` 连接一种数据库。后端共同约定见 [../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | NestJS 11 | `package.json` |
| ORM | TypeORM 0.3.20 | `package.json` |
| 语言 | TypeScript 5.7、`@nestjs/cli` 11 | `package.json` |
| 数据库客户端 | `pg` 8.13、`mysql2` 3.24、`better-sqlite3` 13 | `package.json` |
| 认证 | `@nestjs/jwt` 11、`bcrypt` 5.1（原生模块） | `package.json` |
| 校验 | `class-validator` 0.14、`class-transformer` 0.5 | `package.json` |
| 其他 | `cookie-parser`、`dotenv`、`reflect-metadata`、`rxjs` | `package.json` |
| API 文档 | `@nestjs/swagger` + CLI 插件 | `src/main.ts`、`nest-cli.json` |
| 包管理 | pnpm 12.15.0 | `package.json` |

## 环境要求与命令

- Node.js 20.19+ 或 22.12+，pnpm 12.15.0。
- `bcrypt` 与 `better-sqlite3` 是原生模块；`pnpm-workspace.yaml` 已预批准它们的构建
  脚本，不需要运行 `pnpm approve-builds`。

| 用途 | 命令 |
| --- | --- |
| 安装 | `pnpm install --frozen-lockfile` |
| 开发启动 | `pnpm start:dev` |
| 构建 | `pnpm build` |
| 运行产物 | `pnpm start:prod`（`node dist/main.js`） |
| 测试 | `pnpm test` |
| 类型检查 | `pnpm typecheck` |
| 冒烟 | `pnpm smoke`（需要已 seed 的库和已启动的服务） |

## 目录结构与分层

```text
src/main.ts              bootstrap：全局前缀 /api/v1、CORS、Cookie、TraceId
src/app.module.ts        TypeORM 连接、全局守卫/拦截器/过滤器
src/config/              AppConfig、数据库驱动归一化、TypeORM 选项
src/common/              包体、错误码、TraceId、校验、树策略
src/auth/                登录/刷新/登出/用户信息/改密、JWT、锁定
src/menus/               /auth/menus 菜单树
src/{users,roles,groups,permissions}/   DTO、service、controller
src/operation-log/       审计拦截器与查询
src/entities/            共享 schema 的 TypeORM 实体
src/policies/            权限结构与有效权限
scripts/smoke.mjs        HTTP 级冒烟脚本
```

## API、认证与数据库访问

- 控制器声明 Authority 并调用 service；全局拦截器写统一包体，全局过滤器映射错误。
  错误码在 `src/common/error-code.ts`。
- JWT 使用 `@nestjs/jwt`：同时配置 RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的
  HS256。refresh token 在 HttpOnly Cookie 中轮换。
- TypeORM 使用 `synchronize: false`，既不建表也不迁移；表结构归
  `database/<engine>`。
- MariaDB 走 TypeORM 的 `mysql` 驱动与 `mysql2`；SQLite 使用 `better-sqlite3`。
- 单元测试覆盖纯策略；翻译测试使用内存 SQLite。数据库行为靠 `pnpm smoke` 对真实
  服务验证。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `3000` | `src/config/app-config.ts`：`APP_PORT` → `PORT` → 3000 | 在 `.env.local` 设置 `APP_PORT` 或 `PORT` |
| API 前缀 | `/api/v1` | `src/main.ts` | — |
| Swagger | `/swagger`、`/openapi.json` | `src/main.ts`、`nest-cli.json` | — |
| CORS | React/Vue 开发地址 | `CORS_ORIGINS` | 修改 `.env.local` |
| 本地配置 | `.env.local` | 本栈根目录 | 从 `.env.example` 复制 |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DB_DRIVER`，其次 URL scheme，最后默认值 |
| 连接 URL | `DATABASE_URL` 覆盖离散值 | `.env.example`、`src/config/` |
| 离散值 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_SSL` | `src/config/` |
| SQLite 文件 | `DB_NAME` 或 URL 路径 | `src/config/` |
| 迁移 | 关闭（`synchronize: false`） | `src/config/database.options.ts` |

## 切库

| 目标库 | 依赖 / 驱动 | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `pg`（已在 `package.json`） | `DB_DRIVER=postgres`，`DATABASE_URL=postgres://...` | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 |
| MySQL | `mysql2` | `DB_DRIVER=mysql`，`mysql://...` | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | — |
| MariaDB | TypeORM `mysql` 驱动 + `mysql2` | `DB_DRIVER=mariadb`，MariaDB URL/端口 | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | 不需要额外 `mariadb` 包 |
| SQLite | `better-sqlite3` | `DB_DRIVER=sqlite`，`sqlite:./orange.db` 或 `DB_NAME` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | 原生模块 |

步骤：按引擎建库，先执行 `ddl.sql` 再执行 `dml.sql`，设置驱动与 URL 或 `DB_*`，
重启后用种子账号验证。`DATABASE_URL` 优先于离散配置。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `.env.local`（已 gitignore）+ 进程环境变量；进程变量优先 |
| 测试 | `pnpm test`；jest 运行 `src/**/*.spec.ts`，翻译测试使用内存 SQLite |
| 生产 | 进程环境变量；`pnpm build` 后 `pnpm start:prod` |

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
