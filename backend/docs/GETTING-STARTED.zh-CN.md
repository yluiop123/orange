> [English](./GETTING-STARTED.md) | 简体中文

# 后端启动指南

所有技术栈提供同一个 `/api/v1` 契约，并共享同一套表结构。选择一个技术栈，初始化数据库，
生成本地配置，然后启动。工具链细节以各技术栈 README 为准。

## 1. 初始化数据库

在仓库根目录执行：

```bash
# PostgreSQL（快速开始默认）
psql -U postgres -c "CREATE DATABASE orange;"
psql -U postgres -d orange -f database/postgres/ddl.sql
psql -U postgres -d orange -f database/postgres/dml.sql

# MySQL / MariaDB
mysql -uroot -proot -e "CREATE DATABASE orange DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -proot orange < database/mysql/ddl.sql
mysql -uroot -proot orange < database/mysql/dml.sql
```

SQLite 使用 `database/sqlite/ddl.sql` 与 `dml.sql`，通过对应引擎的命令行工具加载。
后端启动时不会自动建表或写入种子数据。

## 2. 生成本地配置

```bash
cp config/app.example.env config/app.env   # 只需一次
node scripts/sync-config.mjs
```

生成器会写入各技术栈被 gitignore 的本地配置文件。完整映射见
[CONFIGURATION.zh-CN.md](./CONFIGURATION.zh-CN.md)。

## 3. 启动一个技术栈

| 技术栈 | 命令 | URL |
| --- | --- | --- |
| Spring Boot | `cd backend/springboot && SPRING_PROFILES_ACTIVE=local mvn spring-boot:run` | <http://localhost:8080> |
| Go | `cd backend/go-gin-gorm && go run ./cmd/server` | <http://localhost:8081> |
| C# | `cd backend/csharp && dotnet run --project src/Orange.Api` | <http://localhost:8082> |
| Rust | `cd backend/rust-axum && cargo run` | <http://localhost:8083> |
| NestJS | `cd backend/node-nestjs && pnpm install && pnpm start:dev` | <http://localhost:3000> |
| FastAPI | `cd backend/python-fastapi && uvicorn app.main:app --port 8000` | <http://localhost:8000> |

种子账号：`super/super`、`admin/admin`、`user/user`；`auditor` 与 `newbie`
分别覆盖审计和强制修改初始密码流程。

## 4. 验证

```bash
# 各技术栈单元测试
cd backend/springboot && mvn test
cd backend/go-gin-gorm && go test ./...
cd backend/csharp && dotnet test
cd backend/rust-axum && cargo test
cd backend/node-nestjs && pnpm test
cd backend/python-fastapi && pytest

# 真实数据库矩阵（PowerShell，在仓库根目录执行）
./scripts/test-databases.ps1
```

`scripts/e2e/real-*.mjs` 中的前端端到端套件默认连接
`http://127.0.0.1:8080`（Spring Boot），除非生成的本地配置指向其他地址。

## 说明

- PostgreSQL、MySQL、MariaDB、SQLite 是已测试的矩阵。openGauss、OceanBase、
  GoldenDB 只维护静态 SQL。
- Spring Boot 是行为基准；其他技术栈出现分歧时，先与 Spring Boot 对比。
- 不要让后端连接由其他引擎 DDL 创建的数据库。
