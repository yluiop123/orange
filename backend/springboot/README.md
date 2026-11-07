# Orange · Spring Boot backend

This stack is Orange's behavioural reference implementation: it implements the canonical endpoints of `contracts/openapi.json` with Spring Boot, and the other five backends follow its behaviour.

## Tech stack and versions

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | Spring Boot 4.0.2 (parent) | `pom.xml` |
| Java | 25 (`<java.version>`) | `pom.xml` |
| Starters | Web, Security, Data JPA, Validation, Cache, Devtools, Test | `pom.xml` |
| JWT | jjwt 0.13.0 (api / impl / jackson), RS256 | `pom.xml`, `security/jwt/JwtUtil.java:84` |
| API documentation | unified `/swagger` + `/openapi.json`; springdoc-openapi 3.0.0 (webmvc-ui) optional via `SPRINGDOC_ENABLED` | `web/OpenApiController.java`, `pom.xml` |
| JDBC | PostgreSQL, mysql-connector-j, sqlite-jdbc, hibernate-community-dialects | `pom.xml` |
| Other | Lombok 1.18.42, commons-lang3, Caffeine | `pom.xml` |
| Test dependencies | spring-boot-starter-test, Testcontainers (postgresql) | `pom.xml` |
| Build | Maven, no `mvnw` wrapper in the repository | directory contents and `.gitignore` |

## Commands

| Purpose | Command | Source / notes |
| --- | --- | --- |
| Install | no separate install step | Maven resolves `pom.xml` during `test` / `package`; no wrapper, so a local `mvn` is required |
| Start (dev) | `mvn spring-boot:run` | `spring-boot-maven-plugin` is declared in `pom.xml`; pair with `SPRING_PROFILES_ACTIVE=local` |
| Test | `mvn -B test` | `.github/workflows/main.yml` (backend job, spring) |
| Build | `mvn -B -DskipTests package` | same as above; artifact `target/orange-0.0.1-SNAPSHOT.jar` (`artifactId` + `version`) |
| Run the artifact | `java -jar target/orange-0.0.1-SNAPSHOT.jar` | `pom.xml`'s `artifactId=orange`, `version=0.0.1-SNAPSHOT` |

Port source variable: `server.port: ${APP_PORT:8080}` (`src/main/resources/application.yaml`), default 8080; `application-local.yaml` additionally hard-codes 8080.

- Requires JDK 25; CI uses `temurin` 25 (`main.yml`).
- `SecurityIntegrationTest` is annotated `@Testcontainers(disabledWithoutDocker = true)`: it skips automatically when Docker is unavailable locally, so `mvn test` does not fail.

## Directory structure and layering

```text
src/main/java/com/orange/
├── config/         datasource and driver selection, Swagger, audit interception, TraceId, WebMvc
├── controller/     login/ and system/ controllers, GlobalExceptionHandler for uniform errors
├── domain/         request/response models for common/, login/, system/, tree and permission policies
├── entity/         JPA entities (including the @Version optimistic-lock column)
├── repository/     Spring Data repositories under system/
├── security/       SecurityConfig, auth/, config/, jwt/
├── service/        system/ interfaces and impl/ implementations
└── util/           query builders, TraceId, database value extraction
src/main/resources/ application.yaml, application-local.example.yaml, application-prod.yaml, keys/
src/test/java/com/orange/  test classes (config, domain, security, service, util)
```

## Configuration entry point

`application.yaml` is the single configuration entry point, covering port, datasource and driver, JWT keys, CORS, login rate limiting and audit retention; the `local` profile layers on the gitignored `application-local.yaml` (template `application-local.example.yaml`), and the `prod` profile uses `application-prod.yaml` to disable API documentation. Variable names, precedence and the comparison with other stacks are covered by the [backend configuration conventions](../../backend/README.md); the variable table is not repeated here.

## Deviations of this stack

1. The only stack using asymmetric signing: RS256 with a PEM key pair (`security/jwt/JwtUtil.java:84`, keys under `src/main/resources/keys/`). Go can optionally use RS256; the other four backends use HS256 only.
2. API documentation is off by default: `springdoc.*.enabled` reads `${SPRINGDOC_ENABLED:false}`, and `application-prod.yaml` disables it again. FastAPI is the only stack that exposes `/docs` by default.
3. The only stack that caches the group tree: a Caffeine `group` cache, with `@Cacheable` / `@CacheEvict` in `service/system/impl/GroupServiceImpl.java`.
4. Optimistic locking relies on JPA `@Version` (`entity/*.java`) comparing versions on update; the Rust and Python ports only increment `version`, and the Go port writes 0 on create without incrementing, so none of the three compares versions and concurrent edits are last-write-wins.
5. The only backend of the six without `.env.example`: configuration goes through `application*.yaml` plus environment-variable overrides.

## Size and tests

| Metric | Value |
| --- | --- |
| Version-controlled files | 128 |
| Java source files | 119 (`src/main` 105, `src/test` 14) |
| Test classes | 14, of which 1 Testcontainers integration test needs Docker |

Counting basis: `git ls-files backend/springboot`. Endpoints, database dialects and verification results are not maintained on this page; see the [HTTP contract](../../contracts/openapi.json), [database dialects](../../database/) and [stack matrix](../../README.md) respectively.

> Last verified: 24826bb · 2026-11-07
> Sources: `pom.xml`, `src/main/resources/application*.yaml`, `src/main/java/com/orange/**`, `src/test/java/com/orange/**`, `.github/workflows/main.yml`
