# Validation layering

Validation is split by what each layer can actually guarantee, and the database is not treated as a place to avoid "for the sake of simplicity".

The database owns invariants that must hold for **every** writer: primary keys, foreign keys, uniqueness, and the rules that make the permission identity meaningful. The backend owns request shape and cross-aggregate checks, and turns failures into readable `BusinessException` messages. The frontend owns only the pre-check that saves a round trip; it never grants access and never protects data.

Two consequences follow from that split. First, a rule that must always hold is duplicated on purpose: the database is the backstop, the backend is the friendly error, the frontend is the convenience. Second, dead branches are removed rather than kept "just in case". PostgreSQL treats a check constraint as satisfied when its expression evaluates to `NULL`, so `status IS NULL OR status IN ('0','1')` is exactly equivalent to `status IN ('0','1')`; the explicit `IS NULL` only suggests that `NULL` is a valid business state.

The permission table now has one representation for "no action": `NULL`. `type` and `path` are `NOT NULL`, `path` must be non-blank, and `menu`/`directory` rows must carry `action IS NULL` while `action` rows must carry a non-blank action. `PermissionShapePolicy` treats a blank action as absent, so callers are not coupled to a hidden canonical form; the service normalizes blank input to `NULL` before persisting, which is what the database check enforces.

Permission identity is also enforced by the database. A plain unique index on `(type, path, action)` would not cover menus, because PostgreSQL treats `NULL` values as distinct. Two partial indexes cover both shapes:

```sql
CREATE UNIQUE INDEX uq_sys_permission_identity_action
  ON sys_permission(type, path, action) WHERE action IS NOT NULL;
CREATE UNIQUE INDEX uq_sys_permission_identity_no_action
  ON sys_permission(type, path) WHERE action IS NULL;
```

The service keeps `assertUniquePermission` so callers still get "权限已存在" instead of a raw constraint violation, and concurrent inserts now fail in the database instead of racing.

## Alternatives considered

- **Application-layer validation only.** Rejected: two concurrent requests, a seed script or a manual SQL fix can all write duplicate permission identities. A pre-check cannot close that window.
- **Database constraints only.** Rejected: tree reference checks need queries and users need localized messages; a raw constraint name is not an API contract.
- **Keep blank string as "no action".** Rejected: it gives `NULL` and `''` the same meaning in Java and the same meaning in the service, but different meanings in PostgreSQL uniqueness. One representation removes the divergence.
- **One unique index over `(type, path, action)`.** Rejected: `NULL` values are distinct in PostgreSQL, so every menu row would pass the index. The two partial indexes are the working equivalent.
- **Drop the code-shape checks because they look complex.** Rejected: the code is the identity and the sibling order (ADR 0003). A malformed code breaks tree building and ordering, and only the database can reject it for every writer.

## Consequences

- Existing databases need the manual sync SQL in `PROJECT_ISSUES.md`; the project still has no migration tool.
- The code, status, type and action-shape rules remain implemented in more than one place. Changing a boundary means updating `TreeCodePolicy`, `tree-code-policy.ts` and the matching check together.
- A constraint violation that reaches the client is a bug: every normal write path is expected to pre-validate and return a business message.
- Tests cover both levels: unit tests for the policies, and integration tests that insert directly to prove the database rejects duplicates, blank paths and wrong action shapes.

## Revisit when

Business codes stop being numeric, runtime reordering is required, or permission data starts arriving from an importer outside this application. At that point the code-shape checks need their own migration and the uniqueness decision should be revisited together with ADR 0003.
