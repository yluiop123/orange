> English | [简体中文](./ARCHITECTURE.zh-CN.md)

# Backend Architecture

## Shape

Six implementations of one API. They do not share code; they share the contract,
the schema and the seed. Spring Boot is the behaviour reference.

```text
backend/
  springboot/     Java 25 + Spring Boot 4   :8080  reference
  go-gin-gorm/    Go + Gin + GORM           :8081
  csharp/         .NET 10 + EF Core         :8082
  rust-axum/      Rust + Axum + SQLx        :8083
  node-nestjs/    Node.js + NestJS 11       :3000
  python-fastapi/ Python 3.13 + FastAPI     :8000
  docs/           this documentation
```

## Layers

Every stack follows the same four layers, whatever the framework calls them:

| Layer | Responsibility |
| --- | --- |
| HTTP adapter | Routes, status codes, headers, request parsing |
| Validation | DTO/request rules; structural rules mirror `database/<engine>/ddl.sql` |
| Service | Business rules: RBAC, tree codes, password policy, lockout, logs |
| Repository | ORM or SQL access; no business decisions |

Cross-layer rules are listed in
[`../../docs/validation-rules.md`](../../docs/validation-rules.md). The canonical
constraints live in the DDL; DTOs must not invent a second, conflicting rule set.

## Response envelope

Every response, including errors, uses:

```json
{ "code": 0, "message": "ok", "data": {}, "timestamp": "...", "traceId": "..." }
```

`X-Trace-Id` is accepted from the client, generated when absent, echoed in the
body and returned in the response header. Pagination, error codes and auth
headers are defined in [`../../docs/API.md`](../../docs/API.md).

## Authentication and RBAC

1. `POST /auth/login` verifies the password and returns an access JWT.
2. A rotating refresh token is set as an HttpOnly cookie scoped to the auth paths.
3. `POST /auth/refresh` rotates the token; concurrent requests must not issue two
   valid refresh tokens.
4. `POST /auth/logout` revokes the access token and clears the cookie.
5. `GET /auth/menus` returns the menu tree already filtered by the user's
   granted paths.

RBAC is path-based: a menu path is the permission identity. Roles grant paths;
groups organise users and roles; the rendered menu is the intersection of the
menu tree and the granted paths. Tree order and codes follow the repository-wide
`TreeCodePolicy` (`docs/adr/0001`, `0002`, `0003`).

Login lockout, forced initial password change (`40302`), operation logging and
the `403` message contract are part of the shared behaviour, not stack-specific
features.

## Database portability

- `database/<engine>/ddl.sql` and `dml.sql` are the only schema and seed sources.
- No stack runs migrations or creates tables at startup.
- One driver switch selects PostgreSQL, MySQL, MariaDB or SQLite; the SQL in
  `database/<engine>` is not shared across engines.
- openGauss, OceanBase and GoldenDB keep static SQL because no local instance is
  available for the live matrix.
- Connection strings, quoting and boolean handling are adapter concerns; the
  service layer must stay engine-neutral.

## Error and validation contract

- DTOs reject malformed input with the same field names and messages across
  stacks.
- Database constraints remain the last line of defence; a stack must not rely on
  application checks alone.
- Error codes and HTTP statuses are defined once in the API contract and reused.
- `traceId` must survive error paths so the frontends can display it.

## Testing

- Unit tests per stack (Spring, Go, C#, Rust, Nest, FastAPI).
- `scripts/test-databases.ps1` runs the live PostgreSQL/MySQL/MariaDB/SQLite
  matrix.
- The 327-endpoint contract check is recorded in
  [`../../docs/VERIFICATION.md`](../../docs/VERIFICATION.md).
- `contracts/openapi.json` is the machine-readable source for client generation
  and contract checks.
