English | [简体中文](README.zh-CN.md)

# Orange · C# / ASP.NET Core backend

This stack implements the same API contract with .NET 10 + ASP.NET Core + EF Core, following the Spring Boot reference for behaviour; one binary connects to one database via `DB_DRIVER` / `DATABASE_URL`.

## Tech stack and versions

| Item | Version / notes | Source |
| --- | --- | --- |
| Runtime | .NET 10 (`net10.0`) | `src/Orange.Api/Orange.Api.csproj`, `tests/Orange.Tests/Orange.Tests.csproj` |
| Web | ASP.NET Core (`Microsoft.NET.Sdk.Web`, controllers + middleware) | `Orange.Api.csproj` |
| ORM | EF Core 9: `Microsoft.EntityFrameworkCore.Sqlite` 9.0.22, `Npgsql.EntityFrameworkCore.PostgreSQL` 9.0.4, `Pomelo.EntityFrameworkCore.MySql` 9.0.0 | `Orange.Api.csproj` |
| Passwords | `BCrypt.Net-Next` 4.2.0 | `Orange.Api.csproj` |
| Tests | xUnit 2.9.3, `Microsoft.NET.Test.Sdk` 17.14.1, `coverlet.collector` 6.0.4 | `Orange.Tests.csproj` |
| Solution | `Orange.slnx` (two folders, `/src/` and `/tests/`) | `Orange.slnx` |
| API documentation | Swashbuckle 10 generates from controllers/DTOs; `/swagger` + `/openapi.json` | `Program.cs`, `Orange.Api.csproj` |
| Launch settings | no `Properties/launchSettings.json` | repository-wide file list |

## Commands

| Purpose | Command | Source / notes |
| --- | --- | --- |
| Install | no separate install step | `dotnet` restores NuGet packages during `build` |
| Start | `dotnet run --project src/Orange.Api` | project path from `Orange.slnx`; `.env.local` is loaded by `DotEnv` |
| Test | `dotnet build Orange.slnx` then `dotnet test Orange.slnx --no-build` | `main.yml` (backend job, csharp) |
| Build | `dotnet build Orange.slnx` | same job in `main.yml` |
| Publish | `dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` | same job in `main.yml` |

Port source variable: `APP_PORT` → `PORT` → 8082 (`src/Orange.Api/Configuration/AppOptions.cs:49`); `.env.example` sets `APP_PORT=8082`. The listening address comes from `UseUrls($"http://0.0.0.0:{options.Port}")` in `Program.cs:16`.

CI uses `setup-dotnet`'s `10.0.x`. This stack does not commit `launchSettings.json`, so `dotnet run` does not read IDE launch profiles.

## Directory structure and layering

```text
Orange.slnx
src/Orange.Api/
├── Program.cs              host, DI, middleware pipeline, JSON options
├── Configuration/         AppOptions (environment variables), database driver selection, DotEnv
├── Contracts/             request and response DTOs
├── Controllers/           auth, user, role, group, permission, operation-log
├── Data/                  DbContext, provider switching, dialect helpers, query predicates
├── Domain/                entities, error codes, exceptions, tree and permission policy, lockout and audit rules
├── Middleware/            TraceId, exceptions, validation, audit
├── Security/              JWT, refresh cookie, authentication middleware, RBAC guards, lockout
└── Services/              business logic, menu tree, query utilities, audit cleanup
tests/Orange.Tests/        xUnit unit tests
```

## Configuration entry point

Copy `.env.example` to `.env.local` (gitignored); the first line of `Program.cs`, `DotEnv.Load(".env.local")`, loads it, and real environment variables take precedence. `appsettings.json` and `appsettings.Development.json` contain only log levels and `AllowedHosts`; all business configuration comes from environment variables. Connection precedence, the variable list and the cross-stack comparison are in the [backend configuration conventions](../../backend/README.md).

## Deviations of this stack

1. The repository has no `Properties/launchSettings.json` (the file does not appear in `git ls-files backend/csharp`), so `dotnet run`'s listening address comes only from `AppOptions.Port` and `UseUrls`, with no IDE profile involved.
2. The target framework is `net10.0` but EF Core is pinned to 9.x: a comment in `Orange.Api.csproj` explains that `Pomelo.EntityFrameworkCore.MySql` 9.0.0 requires EF Core 9, so the three providers and EF Core must move together; upgrading to EF Core 10 has to wait for Pomelo 10.
3. JWT follows the shared rule: an RSA pair selects RS256, otherwise `JWT_SECRET` selects HS256 (`src/Orange.Api/Security/JwtService.cs`). Access and refresh tokens are still issued and validated by hand in this file, with no third-party JWT package.
4. Audit-retention cleanup runs every 6 hours (class comment at `src/Orange.Api/Services/OperationLogService.cs:107`), not on a configurable cron, which differs from the daily cleanup cadence of the other ports.
5. Swashbuckle 10 generates the OpenAPI document from controller metadata; `/swagger` + `/openapi.json` are mounted before the authentication middleware. Database schema still comes only from `database/<engine>/ddl.sql` and `dml.sql`.

## Size and tests

| Metric | Value |
| --- | --- |
| Version-controlled files | 69 |
| C# source files | 60 (`src/Orange.Api` 48, `tests/Orange.Tests` 12) |
| Test files | 12 `*Tests.cs` files plus 1 test csproj; 107 tests |

Counting basis: `git ls-files backend/csharp`. The frontend-owned API snapshot is [frontend/openapi.json](../../frontend/openapi.json), dialects are in [database](../../database/), and the stack matrix is the [root README](../../README.md).

> Last verified: c7b6531 · 2026-11-08
> Sources: `Orange.slnx`, `src/Orange.Api/Orange.Api.csproj`, `tests/Orange.Tests/Orange.Tests.csproj`, `src/Orange.Api/Program.cs`, `src/Orange.Api/Configuration/AppOptions.cs`, `.env.example`, `.github/workflows/main.yml`
