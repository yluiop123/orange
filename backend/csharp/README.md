English | [简体中文](README.zh-CN.md)

# Orange · C# / ASP.NET Core backend

Implements the shared API contract with .NET 10 + ASP.NET Core + EF Core,
following the Spring Boot reference for behaviour. One binary connects to one
database selected by `DB_DRIVER` / `DATABASE_URL`. Shared backend conventions are
in [../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Runtime | .NET 10 (`net10.0`) | `Orange.Api.csproj`, `Orange.Tests.csproj` |
| Web | ASP.NET Core controllers + middleware | `Orange.Api.csproj` |
| ORM | EF Core 9 with Npgsql, Pomelo MySQL and SQLite providers | `Orange.Api.csproj` |
| Passwords | `BCrypt.Net-Next` 4.2 | `Orange.Api.csproj` |
| Tests | xUnit 2.9, `Microsoft.NET.Test.Sdk` | `Orange.Tests.csproj` |
| API documentation | Swashbuckle 10 from controllers/DTOs | `Program.cs` |
| Solution | `Orange.slnx` with `/src/` and `/tests/` | `Orange.slnx` |

## Requirements and commands

Requires the .NET 10 SDK. There is no `Properties/launchSettings.json`, so the
listening address comes only from configuration.

| Purpose | Command |
| --- | --- |
| Install | no separate step; `dotnet build` restores NuGet packages |
| Start | `dotnet run --project src/Orange.Api` |
| Build | `dotnet build Orange.slnx` |
| Test | `dotnet build Orange.slnx` then `dotnet test Orange.slnx --no-build` |
| Publish | `dotnet publish src/Orange.Api/Orange.Api.csproj -c Release -o out` |

## Directory structure and layering

```text
Orange.slnx
src/Orange.Api/
├── Program.cs              host, DI, middleware pipeline, JSON options
├── Configuration/         AppOptions, database driver selection, DotEnv
├── Contracts/             request and response DTOs
├── Controllers/           auth, user, role, group, permission, operation-log
├── Data/                  DbContext, provider switching, dialect helpers
├── Domain/                entities, error codes, tree and permission policy
├── Middleware/            TraceId, exceptions, validation, audit
├── Security/              JWT, refresh cookie, authentication, RBAC
└── Services/              business logic, menu tree, audit cleanup
tests/Orange.Tests/        xUnit unit tests
```

## API, auth and database access

- Controllers declare the Authority and call services. `ExceptionHandlingMiddleware`
  maps errors to the shared envelope; codes live in `Domain/ErrorCodes.cs`.
- JWT is implemented by hand in `Security/JwtService.cs`: RS256 with an RSA pair,
  otherwise HS256 with `JWT_SECRET`. Refresh tokens rotate in an HttpOnly cookie.
- EF Core maps the shared schema; the application does not create or migrate it.
  Provider switching is centralized in `Data/` and `Configuration/`.
- Audit-retention cleanup runs every 6 hours (a fixed cadence, unlike the daily
  jobs in the other ports).

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `8082` | `Configuration/AppOptions.cs`: `APP_PORT` → `PORT` → 8082 | Set `APP_PORT` in `.env.local` |
| Listen address | `http://0.0.0.0:{port}` | `Program.cs` (`UseUrls`) | Edit `Program.cs` |
| API prefix | `/api/v1` | controller routes | — |
| Swagger | `/swagger`, `/openapi.json` | `Program.cs` | — |
| CORS | React/Vue/Angular dev origins | `CORS_ORIGINS` | Edit `.env.local` |
| Local config | `.env.local` | this stack's root | Copy `.env.example` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DB_DRIVER` or URL scheme |
| Connection URL | `DATABASE_URL` | `.env.example`, `Configuration/AppOptions.cs` |
| Discrete values | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE` | `Configuration/AppOptions.cs` |
| SQLite file | `SQLITE_PATH` or `DB_NAME` | `Configuration/` |
| Migrations | none; schema comes from SQL | `Data/OrangeDbContext.cs` |

## Switching database

| Target | Dependency / provider | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `Npgsql.EntityFrameworkCore.PostgreSQL` 9 | `DB_DRIVER=postgres`, Npgsql URL | `database/postgres/ddl.sql` then `dml.sql` | Reference |
| MySQL | `Pomelo.EntityFrameworkCore.MySql` 9 | `DB_DRIVER=mysql`, MySQL URL | `database/mysql/ddl.sql` then `dml.sql` | Pomelo pins EF Core 9 |
| MariaDB | Pomelo MySQL provider | `DB_DRIVER=mariadb`, MariaDB URL/port | `database/mariadb/ddl.sql` then `dml.sql` | MySQL protocol |
| SQLite | `Microsoft.EntityFrameworkCore.Sqlite` 9 | `DB_DRIVER=sqlite`, `SQLITE_PATH=./orange.db` | `database/sqlite/ddl.sql` then `dml.sql` | — |

The target framework is `net10.0` but EF Core is pinned to 9.x because
`Pomelo.EntityFrameworkCore.MySql` 9 requires it; the three providers and EF Core
must move together. Steps: create the database, load `ddl.sql` then `dml.sql`,
set the driver and connection values, restart, then verify with the seed accounts.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `.env.local` (gitignored), loaded by `DotEnv.Load`; process environment wins |
| Test | `dotnet test Orange.slnx --no-build` |
| Production | process environment; use the RSA pair or a strong `JWT_SECRET` |

`appsettings.json` and `appsettings.Development.json` contain only log levels and
`AllowedHosts`; business configuration comes from environment variables.

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
