English | [简体中文](README.zh-CN.md)

# Orange · Spring Boot backend

The behavioural reference implementation: it defines the canonical endpoint
behaviour and the annotation style that the other five backends follow. Shared
backend conventions are in [../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | Spring Boot 4.0.2 (parent) | `pom.xml` |
| Java | 25 | `pom.xml` |
| Starters | Web, Security, Data JPA, Validation, Cache, Devtools, Test | `pom.xml` |
| JWT | jjwt 0.13.0; RS256 with a key pair, HS256 fallback | `security/jwt/JwtUtil.java` |
| API documentation | springdoc-openapi 3.0.0 from controller/DTO annotations | `config/SwaggerConfig.java` |
| JDBC drivers | PostgreSQL, `mysql-connector-j`, `sqlite-jdbc`, `hibernate-community-dialects` | `pom.xml` |
| Other | Lombok, commons-lang3, Caffeine | `pom.xml` |
| Tests | spring-boot-starter-test, Testcontainers PostgreSQL | `pom.xml` |

## Requirements and commands

Requires JDK 25 and Maven (no wrapper is committed).

| Purpose | Command |
| --- | --- |
| Install | no separate step; Maven resolves `pom.xml` during build |
| Start (dev) | `SPRING_PROFILES_ACTIVE=local mvn spring-boot:run` |
| Start (default) | `mvn spring-boot:run` |
| Test | `mvn -B test` |
| Build | `mvn -B -DskipTests package` |
| Run artifact | `java -jar target/orange-0.0.1-SNAPSHOT.jar` |

`SecurityIntegrationTest` uses `@Testcontainers(disabledWithoutDocker = true)`, so
it skips when Docker is unavailable.

## Directory structure and layering

```text
src/main/java/com/orange/
├── config/         datasource and driver selection, Swagger, audit, TraceId, WebMvc
├── controller/     login/ and system/ controllers, GlobalExceptionHandler
├── domain/         request/response models, tree and permission policies
├── entity/         JPA entities (including the optimistic-lock version)
├── repository/     Spring Data repositories
├── security/       SecurityConfig, auth/, jwt/
├── service/        interfaces and implementations
└── util/           query builders, TraceId, database value extraction
src/main/resources/ application.yaml, application-local.example.yaml
src/test/java/com/orange/  unit and integration tests
```

The flow is interceptor → service → repository, with JPA entities as the data
model and `GlobalExceptionHandler` as the only error mapper.

## API, auth and database access

- Controllers declare `@PreAuthorize` Authority strings such as
  `action#/system/role:edit`; the string must exist in
  `database/permissions.json`.
- JWT signing uses RS256 when both RSA keys are set, otherwise HS256 with
  `JWT_SECRET`. Access tokens are short-lived; refresh tokens rotate in an
  HttpOnly cookie.
- JPA maps the shared schema. `spring.jpa.hibernate.ddl-auto` is `none`, so the
  application never creates tables; `database/<engine>/ddl.sql` owns the schema.
- The group tree is cached with Caffeine (`@Cacheable` / `@CacheEvict`), the only
  backend that caches it.
- The only stack that keeps the deprecated compatibility routes (`/add`, `/edit`,
  `/detail/{id}`, `/reset/{userId}`); they are `@Hidden` from Swagger.

## Service configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| HTTP port | `8080` | `application.yaml`: `server.port: ${APP_PORT:8080}` | `APP_PORT` or `application-local.yaml` |
| Context path | none | `server.servlet.context-path` (unset) | Add it if hosting under a prefix |
| API prefix | `/api/v1` | `WebMvcConfig` / controller mappings | — |
| Local profile | `application-local.yaml` | `src/main/resources/` (template `.example.yaml`) | Copy the template and edit |
| Production | Environment variables | process environment | Optionally set `SPRING_PROFILES_ACTIVE=prod`; there is no dedicated file |
| Swagger | `/swagger`, `/openapi.json` | `application.yaml` (`springdoc.*`) | `SPRINGDOC_ENABLED=false` hides both |
| CORS | React/Vue/Angular dev origins | `app.cors.allowed-origins` | `CORS_ORIGINS` |

## Database configuration

| Item | Current value | Location |
| --- | --- | --- |
| Engine | PostgreSQL | `DB_DRIVER`, JDBC URL scheme |
| JDBC URL | `SPRING_DATASOURCE_URL > DB_URL > spring.datasource.url` | `application.yaml` |
| Fallback host/port/db | `DB_HOST` / `DB_PORT` / `DB_NAME` | `DatabaseSettings` |
| Credentials | `SPRING_DATASOURCE_USERNAME/PASSWORD > DB_USER/DB_PASSWORD` | `application.yaml` |
| Pool | HikariCP, max 10, min idle 5 | `spring.datasource.hikari` |
| Schema ownership | `database/<engine>/ddl.sql`, `dml.sql` | `ddl-auto: none` |

## Switching database

| Target | Dependency / driver | Configuration | Initialization | Notes |
| --- | --- | --- | --- | --- |
| PostgreSQL | `postgresql` (already in `pom.xml`) | `DB_DRIVER=postgres`, `jdbc:postgresql://host:5432/orange` | `database/postgres/ddl.sql` then `dml.sql` | Reference schema |
| MySQL | `mysql-connector-j` (already in `pom.xml`) | `DB_DRIVER=mysql`, `jdbc:mysql://host:3306/orange` | `database/mysql/ddl.sql` then `dml.sql` | Use the MySQL dialect |
| MariaDB | `mysql-connector-j`; no MariaDB driver | `DB_DRIVER=mariadb`, `jdbc:mysql://host:3307/orange` | `database/mariadb/ddl.sql` then `dml.sql` | Spring rewrites `jdbc:mariadb:` to `jdbc:mysql:` |
| SQLite | `sqlite-jdbc` + `hibernate-community-dialects` | `DB_DRIVER=sqlite`, `jdbc:sqlite:./orange.db` | `database/sqlite/ddl.sql` then `dml.sql` | Keep `date_class=text`; foreign keys are connection-level |

Steps: create the database if needed, load `ddl.sql` then `dml.sql` on one
connection (especially SQLite), set the driver and URL, restart, then verify with
the seed accounts. A stale `DATABASE_URL` / `SPRING_DATASOURCE_URL` overrides the
discrete values.

## Environment configuration

| Environment | Configuration |
| --- | --- |
| Development | `application.yaml` + environment variables; optional `application-local.yaml` with `SPRING_PROFILES_ACTIVE=local` |
| Test | `mvn -B test`; Testcontainers PostgreSQL, skipped without Docker |
| Production | environment variables; optionally `SPRING_PROFILES_ACTIVE=prod` (no dedicated file) |

## Further reading

- [Backend conventions](../README.md)
- [Database](../../database/README.md)
- [Repository README](../../README.md)
