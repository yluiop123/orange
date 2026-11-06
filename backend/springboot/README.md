# Spring Boot Backend Project

[Simplified Chinese](./README.zh-CN.md) | English

## Project Overview

This project is an enterprise-level permission management system built with Spring Boot 4.0.2. It uses JWT authentication and the RBAC (Role-Based Access Control) model, providing complete user, role, permission, and group management functionality.

Swagger API documentation:
https://yluiop123.github.io/orange/#/swagger

## Tech Stack

- **Backend Framework**: Spring Boot 4
- **Java Version**: Java 17+
- **Database**: PostgreSQL (default), MySQL, MariaDB, SQLite
- **Security Framework**: Spring Security + JWT
- **API Documentation**: SpringDoc OpenAPI 3.0
- **Cache**: Caffeine
- **ORM**: Spring Data JPA
- **Build Tool**: Maven
- **Development Tool**: Lombok

## Quick Start

### Clone the Project
```bash
git clone <repository-url>
cd backend/springboot
```

### Database Configuration

Supported engines: PostgreSQL (default), MySQL, MariaDB and SQLite. Each engine has its own
schema under `database/<engine>/`; the application never creates tables (`spring.jpa.hibernate.ddl-auto: none`).

| `DB_DRIVER` | JDBC URL example | Schema |
| :--- | :--- | :--- |
| `postgres` | `jdbc:postgresql://localhost:5432/orange` | `database/postgres/ddl.sql`, `dml.sql` |
| `mysql` | `jdbc:mysql://localhost:3306/orange` | `database/mysql/ddl.sql`, `dml.sql` |
| `mariadb` | `jdbc:mysql://localhost:3307/orange` | `database/mariadb/ddl.sql`, `dml.sql` |
| `sqlite` | `jdbc:sqlite:/var/lib/orange/orange.db` | `database/sqlite/ddl.sql`, `dml.sql` |

Configuration precedence (highest first):

1. `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
2. `DB_URL`, `DB_USER`, `DB_PASSWORD`
3. `spring.datasource.*` in `application.yaml` or a profile file
4. Per-engine defaults: PostgreSQL `localhost:5432/orange` + `postgres/postgres`; MySQL/MariaDB
   `localhost:3306/orange` + `root/root`; SQLite `jdbc:sqlite:orange.db`

`DB_DRIVER` selects the JDBC driver and the Hibernate dialect. When it is omitted, the engine is
inferred from the JDBC URL. A mismatch between `DB_DRIVER` and the URL is rejected at startup.
`DB_HOST`, `DB_PORT` and `DB_NAME` are only used to build the default URL.

```bash
# PostgreSQL (default)
java -jar target/orange-0.0.1-SNAPSHOT.jar

# MySQL
DB_DRIVER=mysql DB_URL=jdbc:mysql://localhost:53306/orange_spring \
  DB_USER=root DB_PASSWORD=root java -jar target/orange-0.0.1-SNAPSHOT.jar

# MariaDB (MySQL protocol; jdbc:mariadb: is also accepted and rewritten to jdbc:mysql:)
DB_DRIVER=mariadb DB_URL=jdbc:mysql://localhost:53307/orange_spring \
  DB_USER=root DB_PASSWORD=root java -jar target/orange-0.0.1-SNAPSHOT.jar

# SQLite
DB_DRIVER=sqlite DB_URL=jdbc:sqlite:/var/lib/orange/orange.db \
  java -jar target/orange-0.0.1-SNAPSHOT.jar
```

Engine notes:

- **SQLite**: `date_class=text`, `foreign_keys=on` and `busy_timeout=5000` are appended to the
  JDBC URL automatically. The schema stores timestamps as TEXT and enforces foreign keys per
  connection; keep the database file writable by the application user.
- **MariaDB**: connects through `mysql-connector-j`; a separate MariaDB driver is not required.
- **MySQL/MariaDB**: string comparisons follow the column collation; the default `utf8mb4_*_ci`
  collations are case-insensitive, unlike PostgreSQL.
- Do not enable `ddl-auto` for any engine. Apply the matching `database/<engine>/ddl.sql` and
  `dml.sql` before starting the application.
### 访问地址

- Application Home Page: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html
- API Interfaces: http://localhost:8080/api-docs


### Production Environment Configuration

#### Generate JWT Keys for Production Environment

```bash
# Generate RSA private key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Generate public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

```
Place the generated `private_key.pem` and `public_key.pem` in a custom directory on the server.

Modify application.yaml:
```yaml
jwt:
  private-key: classpath:keys/private_key.pem
  public-key: classpath:keys/public_key.pem
```

#### Configure Database Credentials
Never hard-code production credentials. Set `SPRING_DATASOURCE_PASSWORD` (or `DB_PASSWORD`) in the
deployment environment; the per-engine defaults are only for local development.
```yaml
    # Resolved by DatabaseSettings: SPRING_DATASOURCE_PASSWORD > DB_PASSWORD > spring.datasource.password
    password: ${SPRING_DATASOURCE_PASSWORD:${DB_PASSWORD:}}
```
## Project Structure

```
backend/springboot/
├── src/main/java/com/orange/
│   ├── config/                    # Configuration classes
│   ├── controller/               # Controller layer
│   │   ├── login/               # Login-related controllers
│   │   └── system/              # System management controllers
│   ├── domain/                   # Domain model layer
│   │   ├── common/              # Common models
│   │   ├── login/               # Login models
│   │   └── system/              # System models
│   ├── entity/                   # Entity classes
│   ├── repository/              # Data access layer
│   ├── security/                # Security configuration
│   ├── service/                 # Business logic layer
│   └── OrangeBootApplication.java # Main application
├── src/main/resources/
│   ├── keys/                    # JWT keys (for testing; use custom keys in production)
│   └── application.yaml         # Configuration file
└── pom.xml                      # Maven dependencies
```
## Database Design

The schema model, invariants and dialect differences are documented once in
[`docs/DATABASE.md`](../../docs/DATABASE.md). This backend only selects a
connection and never creates tables; see [Database Configuration](#database-configuration).

## Permission Control

- **RBAC Model**: This system uses the RBAC model to manage users, roles, permissions, and groups via association tables.
- **API Permission Control**: Uses Spring Security with`@PreAuthorize`。
  Permission rule format:`type#path:action`（action can also be`type#path`）or permission code 。
  `type` permission type(menu/directory/action/function/api)，
  `path` permission path(route/URL)，
  `action` custom permission action(add/delete/edit etc.)。
  Permission logic implemented in `com.orange.security.JwtUserDetailsService.java` in the `getPermissionStrs` method.
```java
    @Operation(summary = "Query User List", description = "Query users list based on query conditions")
    @PostMapping
    @PreAuthorize("hasAuthority('menu#/system/user')") //type#path:action configuration
//@PreAuthorize("hasAuthority('000500')")  //permission code configuration
    public Response<PageData<UserBean>> queryUsers(@RequestBody QueryUserReq req) {
        PageData<UserBean> pageData = userService.queryUsers(req);
        return Response.ok(pageData);
    }

    @Operation(summary = "Delete Users", description = "Delete users based on user ID list")
    @DeleteMapping
    @PreAuthorize("hasAuthority('menu#/system/user:delete')")
    public Response<String> deleteUsers(@RequestBody DeleteUserReq req) {
        userService.deleteUsers(req.getIds());
        return Response.ok("Delete success");
    }
```

