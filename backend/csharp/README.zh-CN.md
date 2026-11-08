[English](README.md) | 简体中文

# Orange · C# / ASP.NET Core 后端

本栈用 .NET 10 + ASP.NET Core + EF Core 实现同一份接口契约，行为以 Spring Boot 基准为准；一个二进制通过 `DB_DRIVER` / `DATABASE_URL` 连一种数据库。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 运行时 | .NET 10（`net10.0`） | `src/Orange.Api/Orange.Api.csproj`、`tests/Orange.Tests/Orange.Tests.csproj` |
| Web | ASP.NET Core（`Microsoft.NET.Sdk.Web`，控制器 + 中间件） | `Orange.Api.csproj` |
| ORM | EF Core 9：`Microsoft.EntityFrameworkCore.Sqlite` 9.0.22、`Npgsql.EntityFrameworkCore.PostgreSQL` 9.0.4、`Pomelo.EntityFrameworkCore.MySql` 9.0.0 | `Orange.Api.csproj` |
| 密码 | `BCrypt.Net-Next` 4.2.0 | `Orange.Api.csproj` |
| 测试 | xUnit 2.9.3、`Microsoft.NET.Test.Sdk` 17.14.1、`coverlet.collector` 6.0.4 | `Orange.Tests.csproj` |
| 解决方案 | `Orange.slnx`（`/src/` 与 `/tests/` 两个 Folder） | `Orange.slnx` |
| 接口文档 | 统一入口 `/swagger` + `/openapi.json`（无额外依赖） | `Swagger/SwaggerSupport.cs` |
| 启动配置 | 无 `Properties/launchSettings.json` | 全仓文件清单 |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | 无独立安装步骤 | `dotnet` 在 `build` 时还原 NuGet 包 |
| 启动 | `dotnet run --project src/Orange.Api` | `Orange.slnx` 的项目路径；`.env.local` 由 `DotEnv` 加载 |
| 测试 | `dotnet build Orange.slnx` 后 `dotnet test Orange.slnx --no-build` | `main.yml`（backend job, csharp） |
| 构建 | `dotnet build Orange.slnx` | `main.yml` 同 job |
| 发布 | `dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` | `main.yml` 同 job |

端口来源变量：`APP_PORT` → `PORT` → 8082（`src/Orange.Api/Configuration/AppOptions.cs:49`）；`.env.example` 写 `APP_PORT=8082`。监听地址由 `Program.cs:16` 的 `UseUrls($"http://0.0.0.0:{options.Port}")` 决定。

CI 用 `setup-dotnet` 的 `10.0.x`。本栈没有提交 `launchSettings.json`，`dotnet run` 不读 IDE 的启动配置。

## 目录结构与分层

```text
Orange.slnx
src/Orange.Api/
├── Program.cs             主机、DI、中间件管道、JSON 选项
├── Configuration/         AppOptions（环境变量）、数据库驱动选择、DotEnv
├── Contracts/             请求与响应 DTO
├── Controllers/           auth、user、role、group、permission、operation-log
├── Data/                  DbContext、provider 切换、方言辅助、查询谓词
├── Domain/                实体、错误码、异常、树与权限策略、锁定与审计规则
├── Middleware/            TraceId、异常、校验、审计
├── Security/              JWT、刷新 cookie、认证中间件、RBAC 守卫、锁定
├── Services/              业务逻辑、菜单树、查询工具、审计清理
└── Swagger/               Swagger UI 与 /openapi.json
tests/Orange.Tests/        xUnit 单元测试
```

## 配置入口

复制 `.env.example` 为 `.env.local`（被 gitignore）；`Program.cs` 首行 `DotEnv.Load(".env.local")` 读入，真实环境变量优先。`appsettings.json` 与 `appsettings.Development.json` 只含日志级别和 `AllowedHosts`，业务配置全部来自环境变量。连接优先级、变量清单与跨栈对照见 [后端配置约定](../../backend/README.zh-CN.md)。

## 本栈偏差

1. 仓库里没有 `Properties/launchSettings.json`（`git ls-files backend/csharp` 中不存在该文件），因此 `dotnet run` 的监听地址只来自 `AppOptions.Port` 与 `UseUrls`，没有 IDE profile 参与。
2. 目标框架是 `net10.0`，但 EF Core 锁在 9.x：`Orange.Api.csproj` 注释说明 `Pomelo.EntityFrameworkCore.MySql` 9.0.0 要求 EF Core 9，因此三个 provider 与 EF Core 必须同版本移动；升级 EF Core 10 需要等 Pomelo 10。
3. JWT 遵循统一规则：RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的 HS256（`src/Orange.Api/Security/JwtService.cs`）。访问令牌与刷新令牌仍由本文件手写签发与校验，不使用第三方 JWT 包。
4. 审计保留清理每 6 小时执行一次（`src/Orange.Api/Services/OperationLogService.cs:107` 的类注释），不是可配置 cron，与其他端口的每日清理节奏不同。
5. 无第三方 OpenAPI 包，也无迁移工具：`/swagger` + `/openapi.json` 在 `Swagger/SwaggerSupport.cs` 手写；schema 只来自 `database/<engine>/ddl.sql` 与 `dml.sql`。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 64 |
| C# 源文件 | 55（`src/Orange.Api` 47、`tests/Orange.Tests` 8） |
| 测试文件 | 8 个 `*Tests.cs`，另 1 个测试 csproj；共 72 个测试 |

统计口径：`git ls-files backend/csharp`。端点、方言与验证结论见 [HTTP 契约](../../contracts/openapi.json)、[数据库方言](../../database/)、[技术栈总表](../../README.zh-CN.md)。

> Last verified: c7b6531 · 2026-11-08
> 事实来源：`Orange.slnx`、`src/Orange.Api/Orange.Api.csproj`、`tests/Orange.Tests/Orange.Tests.csproj`、`src/Orange.Api/Program.cs`、`src/Orange.Api/Configuration/AppOptions.cs`、`.env.example`、`.github/workflows/main.yml`
