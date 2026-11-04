> English | [简体中文](./API.zh-CN.md)

# API Contract

This document is technology-agnostic. It is the contract every backend in `backend/` must implement and every frontend in `frontend/` may rely on.

Machine-readable source: [`contracts/openapi.json`](../contracts/openapi.json).

## 1. Base

| Item | Value |
| --- | --- |
| Base path | `/api/v1` |
| Auth | `Authorization: Bearer <access-token>` |
| Refresh | HttpOnly cookie `refresh_token`, path `/api/v1/auth` |
| Content type | `application/json; charset=UTF-8` |
| Time format | ISO-8601 with offset, e.g. `2026-11-03T08:00:00+08:00` |
| Locale header | `Locale: zh` or `en` (optional; affects messages only) |

CORS must allow the frontend origin with credentials, because the refresh cookie is HttpOnly.

## 2. Response envelope

Every response, including errors, uses the same shape:

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1762137600000,
  "traceId": "9f8c1b2d3e4f5a6b"
}
```

`code` is the business code; the HTTP status is the transport status. A client treats `code != 200` as a failure.

| code | HTTP | Meaning |
| --- | --- | --- |
| 200 | 200 | Success |
| 40001 | 400 | Malformed request |
| 40002 | 400 | Validation failed |
| 40101 | 401 | Not authenticated or token expired |
| 40301 | 403 | No authority |
| 40302 | 403 | Must change the initial password first |
| 40401 | 404 | Resource not found |
| 40501 | 405 | Method not allowed |
| 40901 | 409 | Conflict (duplicate or referenced data) |
| 429 | 429 | Too many login attempts; the account/IP is temporarily locked |
| 50000 | 500 | Unexpected error |

`traceId` must also be returned in the `X-Trace-Id` response header. Error responses carry the same `traceId` as the server log.

## 3. Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | public | Body `{ "username": "...", "password": "..." }`. Returns `{ token, expiresIn, refreshExpiresIn }` and sets the refresh cookie. |
| POST | `/api/v1/auth/refresh` | refresh cookie | Rotates the refresh token, returns a new access token. Replaying an old refresh token returns 401. |
| POST | `/api/v1/auth/logout` | bearer | Revokes the refresh token (when present) and increments `token_version`, so every session of the user is invalidated. Clears the refresh cookie. |
| GET | `/api/v1/auth/user-info` | bearer | Returns the current user, roles and permissions. |
| POST | `/api/v1/auth/change-password` | bearer | Body `{ "oldPassword": "...", "newPassword": "..." }`. Revokes other sessions. |
| GET | `/api/v1/auth/menus` | bearer | Returns the enabled menu tree. |

Rules that every backend must preserve:

- Access token is short-lived and kept in memory by the frontend.
- Refresh token is HttpOnly, rotated on every refresh, and the previous `jti` is revoked.
- `sys_user.token_version` is embedded in the token. Incrementing it invalidates all existing tokens for that user.
- `must_change_password = true` makes every endpoint except `user-info`, `menus`, `change-password` and `logout` return `40302`.
- Login lockout: 5 failures per user and 20 per IP within 15 minutes; both lock for 15 minutes. The counters are stored in `sys_login_attempt`.
- Passwords are stored with BCrypt. A new or reset password is a 12-character temporary password and sets `must_change_password = true`.

### `user-info` shape

```json
{
  "id": "uuid",
  "name": "Super Admin",
  "username": "super",
  "email": "super@example.com",
  "groupId": "00",
  "groupName": "总公司",
  "phone": "13800000000",
  "status": "1",
  "mustChangePassword": false,
  "roles": [{ "id": "super", "name": "Super" }],
  "userPermissions": [{ "type": "menu", "path": "/profile", "action": null }],
  "rolePermissions": [{ "role": "super", "type": "menu", "path": "/system/user", "action": null }]
}
```

The frontend derives its view by merging `userPermissions` with the selected role's `rolePermissions`. The backend authority set is always the union of **all enabled roles plus direct permissions**, minus disabled permissions; role switching never reduces backend authority.

## 4. Pagination and query

List endpoints that page return:

```json
{ "total": 42, "list": [], "page": 1, "size": 10, "totalPages": 5 }
```

Tree endpoints (groups, permissions) return the full array and paginate on the client.

Query parameters must accept an empty string for optional filters; `status=all` means no filter. Sorting uses `sort` + `direction` (`asc` / `desc`), with a server-side whitelist. Unsupported sort fields fall back to `createTime`.

Deprecated compatibility parameters (`filterField`, `filterValue`, `orderField`, `orderValue`) may be accepted by the Java backend but are not part of the contract for new implementations.

## 5. System management

### 5.1 Groups — `/api/v1/system/groups`

| Method | Path | Authority | Description |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/group` | Query `id`, `name`, `status`. Text filters also return ancestors so the tree keeps its shape. |
| GET | `/{groupId}` | `menu#/system/group` | Detail |
| PATCH | `/{groupId}` | `action#/system/group:edit` | Body `{ name, status? }`; the code is immutable |
| PATCH | `/{groupId}/status` | `action#/system/group:edit` | Body `{ status }` |
| POST | `/children` | `action#/system/group:add` | Body `{ id, name, parentId? }` |
| DELETE | `/{groupId}` | `action#/system/group:delete` | Delete one |
| DELETE | `?ids=a,b` | `action#/system/group:delete` | Delete many |

Rules: code is digits; root is 2 digits; child = parent + 2 digits; code immutable; deleting a subtree with users is rejected; disabling a parent requires all descendants to be disabled first (otherwise `40901`); the whole subtree is deleted explicitly, deepest first.

### 5.2 Permissions — `/api/v1/system/permissions`

| Method | Path | Authority | Description |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/permission` | Query `id`, `name`, `path`, `status`, `type` |
| GET | `/{permissionId}` | `menu#/system/permission` | Detail |
| PATCH | `/{permissionId}` | `action#/system/permission:edit` | Body `{ name?, path?, action?, status?, type? }` |
| POST | `/children` | `action#/system/permission:add` | Body `{ id, name, path, action?, type, parentId? }` |
| DELETE | `/{permissionId}` | `action#/system/permission:delete` | Delete one |
| DELETE | `?ids=a,b` | `action#/system/permission:delete` | Delete many |

Rules: code is digits; root is 4 digits; child = parent + 2 digits; `type` is `menu | action | directory`; `action` is required only for `action`; `path` is non-blank; `(type, path, action)` is unique; an `action` node cannot have children; a subtree referenced by a role or user cannot be deleted.

### 5.3 Roles — `/api/v1/system/roles`

| Method | Path | Authority | Description |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/role` | Query `id`, `name`, `status`, `sort`, `direction`, `page`, `size` |
| GET | `/{roleId}` | `menu#/system/role` | Detail |
| POST | `/` | `action#/system/role:add` | Body `{ id?, name, permissions? }`; a blank id gets a UUID |
| PATCH | `/{roleId}` | `action#/system/role:edit` | Body `{ name?, status?, permissions? }` |
| DELETE | `/{roleId}` | `action#/system/role:delete` | Delete one |
| DELETE | `?ids=a,b` | `action#/system/role:delete` | Delete many |

Rules: id is `[A-Za-z0-9_-]{2,32}`; name is 2–50; a role referenced by a user cannot be deleted; only a `super` may grant `super`; direct permissions must be a subset of the caller's permissions.

### 5.4 Users — `/api/v1/system/users`

| Method | Path | Authority | Description |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/user` | Query `keyword`, `status`, `groupId`, `sort`, `direction`, `page`, `size` |
| GET | `/{userId}` | `menu#/system/user` | Detail |
| POST | `/` | `action#/system/user:add` | Body `{ name, username, email, groupId, phone, status?, roles?, permissions? }`. Returns the temporary password. |
| PATCH | `/{userId}` | `action#/system/user:edit` | Body `{ name?, username?, email?, groupId?, phone?, status?, roles?, permissions? }`; username is immutable |
| PATCH | `/{userId}/status` | `action#/system/user:edit` | Body `{ status }` |
| POST | `/{userId}/reset-password` | `action#/system/user:edit` | Returns a new temporary password |
| DELETE | `/{userId}` | `action#/system/user:delete` | Delete one |
| DELETE | `?ids=a,b` | `action#/system/user:delete` | Delete many |

Rules: username is unique, 4–50, `[A-Za-z0-9_]`; email and Chinese mobile format; group must exist; a user cannot delete or disable themselves; at least one enabled `super` must remain; only a `super` may reset a `super` password.

### 5.5 Operation logs — `/api/v1/system/operation-logs`

| Method | Path | Authority | Description |
| --- | --- | --- | --- |
| GET | `/` | `menu#/system/operation-log` | Query `username`, `path`, `status`, `from`, `to`, `page`, `size` |

Read-only. Writes are recorded automatically for non-GET requests to `/api/v1/system/*` and `/api/v1/auth/change-password`. GET/OPTIONS are not recorded. Sensitive paths (`login`, `refresh`, `change-password`, `reset-password`) never store the body. Bodies redact `password`, `token`, `secret` and truncate to 4000 characters; query strings truncate to 500. Default retention is 90 days.

## 6. Permission identity and authorities

A permission is `type + path + action`:

- `menu`: one page path; the menu tree leaf.
- `directory`: covers every menu whose path starts with the directory path.
- `action`: one action on one page, e.g. `/system/user` + `add`.

An authority string is `type#path` or `type#path:action`:

```text
menu#/system/user
action#/system/user:add
```

The backend checks these strings with `@PreAuthorize`/middleware. Menu and directory permissions only control visibility; they never grant API access.

## 7. Legacy endpoints

The Java backend still exposes deprecated routes (`POST /api/v1/system/*/add`, `POST .../edit`, `POST .../addChild`, `GET .../detail/{id}`). They exist for compatibility only. New implementations should implement the canonical routes above; no new frontend may call the legacy ones.

## 8. Operational endpoints

`GET /healthz` is implemented by the Go backend for container health checks. It sits outside `/api/v1`, is not part of the business contract, and is optional for the other stacks. It returns `200` when the process is up.
