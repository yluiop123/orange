[English](README.md) | 简体中文

# Orange · C# / ASP.NET Core 后端

用 .NET 10 + ASP.NET Core + EF Core 实现共享 API 契约，行为以 Spring Boot 基准为准。
一个二进制通过 `DB_DRIVER` / `DATABASE_URL` 连接一种数据库。后端共同约定见
[../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 运行时 | .NET 10（`net10.0`） | `Orange.Api.csproj`、`Orange.Tests.csproj` |
| Web | ASP.NET Core 控制器 + 中间件 | `Orange.Api.csproj` |
| ORM | EF Core 9 + Npgsql、Pomelo MySQL、SQLite Provider | `Orange.Api.csproj` |
| 密码 | `BCrypt.Net-Next` 4.2 | `Orange.Api.csproj` |
| 测试 | xUnit 2.9、`Microsoft.NET.Test.Sdk` | `Orange.Tests.csproj` |
| API 文档 | Swashbuckle 10，从控制器/DTO 生成 | `Program.cs` |
| 解决方案 | `Orange.slnx`，包含 `/src/` 与 `/tests/` | `Orange.slnx` |

## 环境要求与命令

需要 .NET 10 SDK。仓库没有 `Properties/launchSettings.json`，监听地址只来自配置。

| 用途 | 命令 |
| --- | --- |
| 安装 | 无独立步骤；`dotnet build` 会还原 NuGet 包 |
| 启动 | `dotnet run --project src/Orange.Api` |
| 构建 | `dotnet build Orange.slnx` |
| 测试 | `dotnet build Orange.slnx` 后执行 `dotnet test Orange.slnx --no-build` |
| 发布 | `dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` |

## 目录结构与分层

```text
Orange.slnx
src/Orange.Api/
├── Program.cs              host、DI、中间件管线、JSON 选项
├── Configuration/         AppOptions、数据库驱动选择、DotEnv
├── Contracts/             请求与响应 DTO
├── Controllers/           auth、user、role、group、permission、operation-log
├── Data/                  DbContext、Provider 切换、方言 helper
├── Domain/                实体、错误码、树与权限策略
├── Middleware/            TraceId、异常、校验、审计
├── Security/              JWT、refresh Cookie、认证、RBAC
└── Services/              业务逻辑、菜单树、审计清理
tests/Orange.Tests/        xUnit 单元测试
```

## API、认证与数据库访问

- 控制器声明 Authority 并调用 service。`ExceptionHandlingMiddleware` 把错误映射为
  统一包体；错误码在 `Domain/ErrorCodes.cs`。
- JWT 在 `Security/JwtService.cs` 手写实现：有 RSA 密钥对时用 RS256，否则用
  `JWT_SECRET` 的 HS256。refresh token 在 HttpOnly Cookie 中轮换。
- EF Core 映射共享 schema；应用不建表也不迁移。Provider 切换集中在 `Data/` 与
  `Configuration/`。
- 审计日志清理每 6 小时运行一次，与其他实现按天清理的节奏不同。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `8082` | `Configuration/AppOptions.cs`：`APP_PORT` → `PORT` → 8082 | 在 `.env.local` 设置 `APP_PORT` |
| 监听地址 | `http://0.0.0.0:{port}` | `Program.cs`（`UseUrls`） | 修改 `Program.cs` |
| API 前缀 | `/api/v1` | 控制器路由 | — |
| Swagger | `/swagger`、`/openapi.json` | `Program.cs` | — |
| CORS | React/Vue/Angular 开发地址 | `CORS_ORIGINS` | 修改 `.env.local` |
| 本地配置 | `.env.local` | 本栈根目录 | 从 `.env.example` 复制 |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DB_DRIVER` 或 URL scheme |
| 连接 URL | `DATABASE_URL` | `.env.example`、`Configuration/AppOptions.cs` |
| 离散值 | `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD`、`DB_SSLMODE` | `Configuration/AppOptions.cs` |
| SQLite 文件 | `SQLITE_PATH` 或 `DB_NAME` | `Configuration/` |
| 迁移 | 无；表结构来自 SQL | `Data/OrangeDbContext.cs` |

## 切库

| 目标库 | 依赖 / Provider | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `Npgsql.EntityFrameworkCore.PostgreSQL` 9 | `DB_DRIVER=postgres`，Npgsql URL | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 |
| MySQL | `Pomelo.EntityFrameworkCore.MySql` 9 | `DB_DRIVER=mysql`，MySQL URL | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | Pomelo 锁定 EF Core 9 |
| MariaDB | Pomelo MySQL Provider | `DB_DRIVER=mariadb`，MariaDB URL/端口 | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | MySQL 协议 |
| SQLite | `Microsoft.EntityFrameworkCore.Sqlite` 9 | `DB_DRIVER=sqlite`，`SQLITE_PATH=./orange.db` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | — |

目标框架是 `net10.0`，但 EF Core 固定在 9.x，因为
`Pomelo.EntityFrameworkCore.MySql` 9 依赖它；三个 Provider 与 EF Core 必须同步升级。
步骤：建库，先执行 `ddl.sql` 再执行 `dml.sql`，设置驱动与连接值，重启后用种子账号
验证。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `.env.local`（已 gitignore），由 `DotEnv.Load` 读取；进程环境变量优先 |
| 测试 | `dotnet test Orange.slnx --no-build` |
| 生产 | 进程环境变量；使用 RSA 密钥对或强 `JWT_SECRET` |

`appsettings.json` 与 `appsettings.Development.json` 只包含日志级别和
`AllowedHosts`；业务配置全部来自环境变量。

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
