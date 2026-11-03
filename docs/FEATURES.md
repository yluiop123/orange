# Features

This is the product scope shared by every stack in this repository. A new frontend or backend is "at parity" when it satisfies the same flows below, not when it copies the React code.

## 1. Product scope

ORANGE is an admin console with:

1. **Authentication** — username/password login, short-lived access token, rotating refresh cookie, logout, forced first-login password change, database-backed login lockout.
2. **RBAC** — users, roles, organizations, permissions, direct grants, role fusion, UI-only role switching.
3. **System management** — CRUD for the four resources above, tree ordering by business code, operation log.
4. **Demo pages** — dashboards, charts, maps, 3D scenes, component gallery. These prove the shell and the design system; they do not add backend endpoints.

## 2. Permission model

A permission is `type + path + action`:

| Type | Meaning | Example |
| --- | --- | --- |
| `menu` | One page | `menu#/system/user` |
| `directory` | Covers every menu under a path | `menu#/system` (visibility only) |
| `action` | One action on one page | `action#/system/user:add` |

Rules:

- A user's effective permissions = union of all **enabled** roles + direct permissions − disabled permissions.
- Role switching is a UI-only view filter. It never reduces the authorities the backend grants.
- Directory permissions only control menu visibility. They never authorize an API call.
- Disabling a permission (`status = 0`) removes both its authority and its visibility.
- A disabled parent forces its children to be disabled first; the backend rejects disabling a parent that still has an enabled descendant.

Business codes:

- Organization: root 2 digits, child = parent + 2 digits.
- Permission: root 4 digits, child = parent + 2 digits.
- The code is the primary key and is immutable. It also defines sibling order.
- Deleting leaves a gap. Reordering requires deleting and recreating the node, which also drops its grants.

## 3. Roles

Seed roles:

| Role | Scope |
| --- | --- |
| `super` | Everything, including granting `super` and resetting a `super` password |
| `admin` | System management, but cannot grant or reset `super` |
| `user` | Read-only demo pages |

Guards:

- Only a `super` may assign the `super` role.
- Direct permissions can only be granted if the caller already holds them.
- A user cannot delete or disable themselves.
- At least one enabled `super` must remain.
- A role referenced by a user cannot be deleted.
- A permission subtree referenced by a role or user cannot be deleted.

## 4. Core flows

### 4.1 Login

1. `POST /auth/login`.
2. Backend checks the password, the account status and the lockout counters.
3. Returns an access token and sets an HttpOnly refresh cookie.
4. If `must_change_password`, the frontend opens a non-dismissible change-password dialog; all other APIs return `40302` until the password changes.
5. The frontend loads `user-info` and `menus`, then redirects to the first visible leaf.

### 4.2 Refresh and logout

- Refresh rotates the token and revokes the previous `jti`.
- A replayed refresh token returns 401 and forces a re-login.
- Logout revokes the refresh token (when present) and increments `token_version`, invalidating every session of the user; the cookie is cleared.
- Incrementing `token_version` (password change, admin reset) invalidates all sessions for that user.

### 4.3 System management

All four resource pages share the same lifecycle:

1. Filter (keyword, status, organization, type) and debounce.
2. Fetch, with request cancellation on filter change.
3. Select rows (tree selection for groups and permissions).
4. Add / edit in a dialog; server field errors are mapped back to the form.
5. Toggle status, with a confirmation when disabling.
6. Delete with a confirmation; the page index is clamped after deletion.
7. Refresh the list after every write.

Specific behavior:

- Groups and permissions are trees. Text filtering returns ancestors, so the tree keeps its hierarchy.
- Group and permission codes are entered by hand and validated before submit.
- Permission type drives the form: `action` requires an action string; `menu`/`directory` forbid it.
- User creation and password reset return a 12-character temporary password; the UI shows it once in a copyable dialog.
- The operation log is read-only; it supports filters and keyset-free paging.

## 5. Page inventory

### System

| Path | Purpose |
| --- | --- |
| `/login` | Login, forced password change |
| `/system/user` | Users |
| `/system/role` | Roles and permission grants |
| `/system/group` | Organization tree |
| `/system/permission` | Permission tree |
| `/system/operation-log` | Audit log |
| `/forbidden` | 403 |
| `/not-found` | 404 |

### Dashboards

`/dashboard/normal`, `/dashboard/network-security`, `/dashboard/military-situational-awareness`, `/dashboard/disaster-command`, `/dashboard/agriculture-forestry`, `/dashboard/industrial`.

### Charts

`/chart/antv`, `/chart/d3`, `/chart/echart`, `/chart/rechart`.

### Maps

`/map/cesium`, `/map/deckgl`, `/map/l7`, `/map/leaflet`, `/map/openlayers`.

### 3D

`/three/three`, `/three/babylon`.

### Components

`/component/general`, `/component/layout`, `/component/navigation`, `/component/table`, `/component/form`, `/component/display`, `/component/feedback`, `/component/custom`.

Each frontend may use its own chart/map/3D libraries. Parity means the page exists and demonstrates the same capability; pixel-identical output is not required.

## 6. Non-functional requirements

- API prefix `/api/v1`; every response uses the envelope in [API.md](./API.md).
- Every error carries a `traceId` that matches the server log and the `X-Trace-Id` header.
- Pages are lazy-loaded; the shell must remain usable when a demo page fails.
- The UI supports Chinese and English; menu titles come from the database and are not translated.
- Tables and dialogs are keyboard accessible; icon-only buttons have accessible names.
- Destructive actions require confirmation.
- Empty query filters must be accepted, not rejected.
- The React app is the only one deployed to GitHub Pages; the others are built and tested locally, but are not in the Pages workflow.
