# Orange · Spring Boot 后端

本栈是 Orange 的行为基准实现：用 Spring Boot 实现 `contracts/openapi.json` 的规范接口，其余五个后端以它的行为为准。

## 技术栈与版本

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | Spring Boot 4.0.2（parent） | `pom.xml` |
| Java | 25（`<java.version>`） | `pom.xml` |
| Starter | Web、Security、Data JPA、Validation、Cache、Devtools、Test | `pom.xml` |
| JWT | jjwt 0.13.0（api / impl / jackson），RS256 | `pom.xml`、`security/jwt/JwtUtil.java:84` |
| 接口文档 | springdoc-openapi 3.0.0（webmvc-ui） | `pom.xml` |
| JDBC | PostgreSQL、mysql-connector-j、sqlite-jdbc、hibernate-community-dialects | `pom.xml` |
| 其他 | Lombok 1.18.42、commons-lang3、Caffeine | `pom.xml` |
| 测试依赖 | spring-boot-starter-test、Testcontainers（postgresql） | `pom.xml` |
| 构建 | Maven，仓库内无 `mvnw` 包装器 | 目录内容与 `.gitignore` |

## 命令

| 用途 | 命令 | 来源 / 说明 |
| --- | --- | --- |
| 安装 | 无独立安装步骤 | Maven 在 `test` / `package` 时解析 `pom.xml`；无 wrapper，需本机 `mvn` |
| 启动（开发） | `mvn spring-boot:run` | `spring-boot-maven-plugin` 已在 `pom.xml` 声明；配合 `SPRING_PROFILES_ACTIVE=local` |
| 测试 | `mvn -B test` | `.github/workflows/main.yml`（backend job, spring） |
| 构建 | `mvn -B -DskipTests package` | 同上；产物 `target/orange-0.0.1-SNAPSHOT.jar`（`artifactId` + `version`） |
| 运行产物 | `java -jar target/orange-0.0.1-SNAPSHOT.jar` | `pom.xml` 的 `artifactId=orange`、`version=0.0.1-SNAPSHOT` |

端口来源变量：`server.port: ${APP_PORT:8080}`（`src/main/resources/application.yaml`），默认 8080；`application-local.yaml` 里另写死 8080。

- 需要 JDK 25；CI 用 `temurin` 25（`main.yml`）。
- `SecurityIntegrationTest` 标注 `@Testcontainers(disabledWithoutDocker = true)`：本机无 Docker 时自动跳过，不会让 `mvn test` 失败。

## 目录结构与分层

```text
src/main/java/com/orange/
├── config/         数据源与驱动选择、Swagger、审计拦截、TraceId、WebMvc
├── controller/     login/ 与 system/ 两组控制器，GlobalExceptionHandler 统一异常
├── domain/         common/、login/、system/ 的请求响应模型，树与权限策略
├── entity/         JPA 实体（含 @Version 乐观锁列）
├── repository/     system/ 下的 Spring Data 仓储
├── security/       SecurityConfig、auth/、config/、jwt/
├── service/        system/ 接口与 impl/ 实现
└── util/           查询构造、TraceId、数据库取值
src/main/resources/ application.yaml、application-local.example.yaml、application-prod.yaml、keys/
src/test/java/com/orange/  测试类（config、domain、security、service、util）
```

## 配置入口

`application.yaml` 是唯一配置入口，覆盖端口、数据源与驱动、JWT 密钥、CORS、登录限流、审计保留；`local` profile 叠加被 gitignore 的 `application-local.yaml`（模板为 `application-local.example.yaml`），`prod` profile 用 `application-prod.yaml` 关闭接口文档。变量名、优先级以及与其他栈的对照见 [docs/backend/configuration.md](../../docs/backend/configuration.md)，此处不重复变量表。

## 本栈偏差

1. 唯一使用非对称签名：RS256 + PEM 密钥对（`security/jwt/JwtUtil.java:84`，密钥在 `src/main/resources/keys/`）。Go 可选 RS256，其余四个后端只用 HS256。
2. 接口文档默认关闭：`springdoc.*.enabled` 取 `${SPRINGDOC_ENABLED:false}`，`application-prod.yaml` 再关一次。FastAPI 是唯一默认暴露 `/docs` 的栈。
3. 只有本栈给分组树加缓存：Caffeine `group` 缓存，`service/system/impl/GroupServiceImpl.java` 使用 `@Cacheable` / `@CacheEvict`。
4. 乐观锁靠 JPA `@Version`（`entity/*.java`）在更新时比较版本；Rust 与 Python 端口只把 `version` 自增、Go 端口创建时写 0 不自增，三者都不做版本比较，并发编辑为后写覆盖。
5. 六栈中唯一没有 `.env.example` 的后端：配置走 `application*.yaml` 加环境变量覆盖。

## 规模与测试

| 指标 | 数值 |
| --- | --- |
| 受版本控制的文件 | 128 |
| Java 源文件 | 119（`src/main` 105、`src/test` 14） |
| 测试类 | 14，其中 1 个 Testcontainers 集成测试需 Docker |

统计口径：`git ls-files backend/springboot`。端点、数据库方言与验证结论不在本页维护，分别见 [docs/reference/api.md](../../docs/reference/api.md)、[docs/reference/db-dialects.md](../../docs/reference/db-dialects.md)、[docs/reference/stacks.md](../../docs/reference/stacks.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `pom.xml`、`src/main/resources/application*.yaml`、`src/main/java/com/orange/**`、`src/test/java/com/orange/**`、`.github/workflows/main.yml`
