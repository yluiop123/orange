[English](README.md) | 简体中文

# Orange · Spring Boot 后端

行为基准实现：定义标准端点行为与注解风格，其余五套后端跟随它。后端共同约定见
[../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | Spring Boot 4.0.2（parent） | `pom.xml` |
| Java | 25 | `pom.xml` |
| Starter | Web、Security、Data JPA、Validation、Cache、Devtools、Test | `pom.xml` |
| JWT | jjwt 0.13.0；有 RSA 密钥对时用 RS256，否则 HS256 | `security/jwt/JwtUtil.java` |
| API 文档 | springdoc-openapi 3.0.0，从控制器/DTO 注解生成 | `config/SwaggerConfig.java` |
| JDBC 驱动 | PostgreSQL、`mysql-connector-j`、`sqlite-jdbc`、`hibernate-community-dialects` | `pom.xml` |
| 其他 | Lombok、commons-lang3、Caffeine | `pom.xml` |
| 测试 | spring-boot-starter-test、Testcontainers PostgreSQL | `pom.xml` |

## 环境要求与命令

需要 JDK 25 和 Maven（仓库未提交 wrapper）。

| 用途 | 命令 |
| --- | --- |
| 安装 | 无独立步骤；Maven 在构建时解析 `pom.xml` |
| 开发启动 | `SPRING_PROFILES_ACTIVE=local mvn spring-boot:run` |
| 默认启动 | `mvn spring-boot:run` |
| 测试 | `mvn -B test` |
| 构建 | `mvn -B -DskipTests package` |
| 运行产物 | `java -jar target/orange-0.0.1-SNAPSHOT.jar` |

`SecurityIntegrationTest` 使用 `@Testcontainers(disabledWithoutDocker = true)`，
没有 Docker 时会自动跳过。

## 目录结构与分层

```text
src/main/java/com/orange/
├── config/         数据源与驱动选择、Swagger、审计、TraceId、WebMvc
├── controller/     login/ 与 system/ 控制器、GlobalExceptionHandler
├── domain/         请求/响应模型、树与权限策略
├── entity/         JPA 实体（含乐观锁 version）
├── repository/     Spring Data repository
├── security/       SecurityConfig、auth/、jwt/
├── service/        接口与实现
└── util/           查询构造、TraceId、数据库取值
src/main/resources/ application.yaml、application-local.example.yaml
src/test/java/com/orange/  单元与集成测试
```

请求流是拦截器 → service → repository；JPA 实体即数据模型，
`GlobalExceptionHandler` 是唯一的错误映射入口。

## API、认证与数据库访问

- 控制器用 `@PreAuthorize` 声明 Authority，例如
  `action#/system/role:edit`；该字符串必须存在于 `database/permissions.json`。
- 同时配置 RSA 密钥对时用 RS256，否则用 `JWT_SECRET` 的 HS256。访问令牌短时效，
  refresh token 在 HttpOnly Cookie 中轮换。
- JPA 映射共享 schema；`spring.jpa.hibernate.ddl-auto` 为 `none`，应用从不建表，
  表结构归 `database/<engine>/ddl.sql` 管理。
- 组织树使用 Caffeine 缓存（`@Cacheable` / `@CacheEvict`），是六套中唯一缓存它的实现。
- 唯一保留兼容路由（`/add`、`/edit`、`/detail/{id}`、`/reset/{userId}`）的栈；这些
  路由标了 `@Hidden`，不会出现在 Swagger 中。

## 服务配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| HTTP 端口 | `8080` | `application.yaml`：`server.port: ${APP_PORT:8080}` | 改 `APP_PORT` 或 `application-local.yaml` |
| Context Path | 无 | `server.servlet.context-path`（未设置） | 需要前缀时添加 |
| API 前缀 | `/api/v1` | 控制器映射 | — |
| 本地 Profile | `application-local.yaml` | `src/main/resources/`（模板 `.example.yaml`） | 复制模板后修改 |
| 生产 | 环境变量 | 进程环境 | 可选 `SPRING_PROFILES_ACTIVE=prod`；没有独立文件 |
| Swagger | `/swagger`、`/openapi.json` | `application.yaml`（`springdoc.*`） | `SPRINGDOC_ENABLED=false` 同时隐藏 |
| CORS | React/Vue/Angular 开发地址 | `app.cors.allowed-origins` | `CORS_ORIGINS` |

## 数据库配置

| 配置项 | 当前值 | 配置位置 |
| --- | --- | --- |
| 引擎 | PostgreSQL | `DB_DRIVER`、JDBC URL scheme |
| JDBC URL | `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url` | `application.yaml` |
| 回退 Host/端口/库名 | `DB_HOST` / `DB_PORT` / `DB_NAME` | `DatabaseSettings` |
| 账号密码 | `SPRING_DATASOURCE_USERNAME/PASSWORD > DB_USER/DB_PASSWORD` | `application.yaml` |
| 连接池 | HikariCP，最大 10，最小空闲 5 | `spring.datasource.hikari` |
| 表结构 | `database/<engine>/ddl.sql`、`dml.sql` | `ddl-auto: none` |

## 切库

| 目标库 | 依赖 / 驱动 | 配置 | 初始化 | 说明 |
| --- | --- | --- | --- | --- |
| PostgreSQL | `postgresql`（已在 `pom.xml`） | `DB_DRIVER=postgres`，`jdbc:postgresql://host:5432/orange` | 依次执行 `database/postgres/ddl.sql`、`dml.sql` | 基线 schema |
| MySQL | `mysql-connector-j`（已在 `pom.xml`） | `DB_DRIVER=mysql`，`jdbc:mysql://host:3306/orange` | 依次执行 `database/mysql/ddl.sql`、`dml.sql` | 使用 MySQL 方言 |
| MariaDB | `mysql-connector-j`；不需要 MariaDB 驱动 | `DB_DRIVER=mariadb`，`jdbc:mysql://host:3307/orange` | 依次执行 `database/mariadb/ddl.sql`、`dml.sql` | Spring 会把 `jdbc:mariadb:` 改写为 `jdbc:mysql:` |
| SQLite | `sqlite-jdbc` + `hibernate-community-dialects` | `DB_DRIVER=sqlite`，`jdbc:sqlite:./orange.db` | 依次执行 `database/sqlite/ddl.sql`、`dml.sql` | 保留 `date_class=text`；外键是连接级设置 |

步骤：按引擎建库，在同一个连接里先执行 `ddl.sql` 再执行 `dml.sql`（SQLite 尤其
重要），修改驱动与 URL，重启后用种子账号验证。已设置的 `DATABASE_URL` /
`SPRING_DATASOURCE_URL` 会覆盖离散配置。

## 环境配置

| 环境 | 配置 |
| --- | --- |
| 开发 | `application.yaml` + 环境变量；可选 `application-local.yaml` 配合 `SPRING_PROFILES_ACTIVE=local` |
| 测试 | `mvn -B test`；Testcontainers PostgreSQL，无 Docker 时跳过 |
| 生产 | 环境变量；可选 `SPRING_PROFILES_ACTIVE=prod`（没有独立文件） |

## 延伸阅读

- [后端共同约定](../README.zh-CN.md)
- [数据库](../../database/README.zh-CN.md)
- [仓库 README](../../README.zh-CN.md)
