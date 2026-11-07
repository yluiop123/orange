# Porting Checklist

This document defines what "the same product in another stack" means. Read it together with:

- [FEATURES.md](./FEATURES.md) — product scope and page inventory.
- [API.md](./API.md) — endpoints, auth, errors, pagination.
- [DATABASE.md](./DATABASE.md) — schema, invariants, dialects.
- [`contracts/openapi.json`](../contracts/openapi.json) — machine-readable API.

The reference implementations are `backend/springboot` and `frontend/react`. They are the behavior source when this document is silent.

## 1. Repository rules

- A backend lives in `backend/<stack>/`; a frontend lives in `frontend/<stack>/`.
- Each stack directory has its own README covering: prerequisites, install, run, test, build, environment variables, and known gaps.
- Do not modify `contracts/`, `database/`, `docs/`, the root READMEs, or another stack's directory when adding a stack. A maintainer changing the shared contract updates those paths in the same commit, with the contract change called out in the commit message.
- Do not commit secrets, `node_modules`, `target`, `bin`, `obj`, `.venv`, `dist` or generated lockfile noise beyond the stack's own lockfile.
- Add the stack to `docs/STACKS.md` when it runs.

## 2. Backend deliverables

A new backend must implement the canonical endpoints in [API.md](./API.md). The deprecated legacy routes are not required.

### 2.1 Required behavior

| Area | Requirement |
| --- | --- |
| Response envelope | `{ code, message, data, timestamp, traceId }`, including errors |
| Errors | Same business codes and HTTP statuses as [API.md](./API.md) |
| Trace ID | Accept or generate `X-Trace-Id`, return it in the body and header |
| Authentication | Access token + HttpOnly rotating refresh cookie; logout revokes the access `jti` |
| Token invalidation | Embed `token_version`; incrementing it invalidates all sessions |
| Forced password change | `must_change_password` blocks all endpoints except `user-info`, `menus`, `change-password`, `logout` with `40302` |
| Login lockout | 5 failures per user, 20 per IP, 15-minute window and lock, persisted in `sys_login_attempt` |
| Passwords | BCrypt; 12-character temporary password on create/reset |
| RBAC | Authorities `type#path` and `type#path:action`; union of enabled roles + direct permissions − disabled |
| Menus | `/auth/menus` returns only enabled `menu`/`directory` nodes, ordered by code, no `action` nodes |
| Tree rules | Code shape, immutability, parent existence, disable guard, deepest-first delete, reference guards |
| Uniqueness | Permission `(type, path, action)` with `NULL` action as one value |
| Operation log | Non-GET writes to `/api/v1/system/*` and `/auth/change-password`; redact and truncate; never log sensitive bodies |
| Validation | Reject blank query filters on non-required fields? No — accept empty strings; reject invalid writes |
| CORS | Allow the configured frontend origin with credentials |

### 2.2 Suggested structure

Use the language's idiomatic layout. Keep the same seams as the Java backend:

- configuration and security
- domain policies (code shape, permission shape, effective permissions)
- repositories
- services
- HTTP handlers
- middleware (trace, auth, operation log, error mapping)

### 2.3 Verification

At minimum:

1. The project builds with no errors.
2. Unit tests cover code policy, permission shape, effective permissions and login lockout.
3. A smoke test starts the app against PostgreSQL and checks:
   - unauthenticated request → 401 with the envelope;
   - login → token + refresh cookie;
   - `user-info` and `menus`;
   - one list endpoint per resource;
   - a rejected unauthorized call → 403.
4. The README states what is not implemented.

## 3. Frontend deliverables

A new frontend must implement every page in [FEATURES.md §5](./FEATURES.md#5-page-inventory).

### 3.1 Required behavior

| Area | Requirement |
| --- | --- |
| Auth | Login, refresh on 401, logout, forced password change |
| Session | Access token in memory; never in `localStorage`; refresh via cookie |
| Menus | Render the backend tree; container nodes expand; breadcrumb from the chain |
| Access | `canView`, `canAct`, `visibleMenuTree`, `firstVisibleLeaf`; hide actions without permission |
| Role switch | UI-only; recompute visible menus/actions from `rolePermissions` |
| System pages | Users, roles, groups, permissions, operation log; all CRUD flows in FEATURES.md §4.3 |
| Validation | Same boundaries as the backend; show server field errors in the form |
| Tables | Pagination, selection, sorting, empty/loading/error states, request cancellation |
| Dialogs | Add/edit/delete/status confirmations; focus management and accessible names |
| i18n | Chinese and English; menu titles from the backend |
| Demo pages | Dashboards, charts, maps, 3D, component gallery; framework-appropriate libraries are fine |
| Deployment | Build must succeed; do not add a GitHub Pages workflow for this stack |

### 3.2 Verification

1. Type check and build pass.
2. Lint passes (or the stack's equivalent).
3. Unit tests cover access filtering, code validation and page clamping.
4. A README documents the dev server port, API base URL, and what is incomplete.

## 4. Ports and defaults

| Stack | Port | API base |
| --- | --- | --- |
| `frontend/react` | 5173 | `VITE_BASE_API` (default `/api/v1/`) |
| `frontend/angular` | 4200 | `environment.apiBase` |
| `frontend/vue` | 5174 | `VITE_API_BASE` |
| `backend/springboot` | 8080 | `/api/v1` |
| `backend/go-gin-gorm` | 8081 | `/api/v1` |
| `backend/node-nestjs` | 3000 | `/api/v1` |
| `backend/csharp` | 8082 | `/api/v1` |
| `backend/rust-axum` | 8083 | `/api/v1` |
| `backend/python-fastapi` | 8000 | `/api/v1` |

Database defaults:

```text
PostgreSQL  localhost:5432  database orange  user postgres  password postgres
MySQL       localhost:3306  database orange  user root      password root
SQLite      ./orange.db
```

Every backend reads the connection from environment variables and must not hard-code credentials.

## 5. Definition of done

A stack is "at parity" when:

- Every canonical endpoint behaves like the reference, including status codes and error codes.
- Every page in FEATURES.md exists and is reachable through the menu.
- The backend can start against the PostgreSQL schema and seed.
- The build, tests and README are in place.
- The known-gaps section is honest and empty only when it is truly empty.
