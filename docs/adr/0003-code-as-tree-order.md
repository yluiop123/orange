# Code as tree order

`sys_group` and `sys_permission` no longer carry an `order_num` column. Sibling order is the lexicographic order of the business code: a root is 2 digits for groups and 4 digits for permissions, and a child code is the parent code plus a 2-digit suffix. The code is the primary key and is immutable. `parent_id` is kept, and a database check enforces that it matches the code prefix and the expected length.

The previous design kept a dense `order_num` per level and maintained the invariant `0..n-1, unique` across five write paths: add child, add sibling, move, delete, and seed/import. None of those paths was enforced by the database, and the move algorithm assumed the invariant held. Null or duplicate values produced NPEs or 500s, and gaps made "move up" silently do nothing.

## Alternatives considered

- **Dense integer plus a deferrable unique constraint.** It keeps compact numbers but still requires every mutation to reindex the whole level. The invariant remains strong, so seed scripts, imports and manual SQL can still break it.
- **Sparse integer with gaps.** Inserts take a midpoint and deletes need no reindexing, but it still stores a second ordering concept next to the code.
- **LexoRank string keys.** It allows unlimited insertion without rebalancing, at the cost of a nontrivial key generator and harder manual debugging.
- **Surrogate primary key plus a non-key code.** It would allow reparenting and avoid the prefix rules, but it changes `sys_user.group_id`, `sys_role_permission.permission_id`, `sys_user_permission.permission_id` and every frontend type. The project has no migration tool, so the cost is disproportionate today.

## Consequences

- Sibling order cannot be changed at runtime. Reordering means deleting and recreating the node, which also changes the permission id and therefore drops the grants that referenced it.
- Each node can have at most 99 children with a two-digit suffix; roots are limited to 100 groups and 10,000 permissions.
- Creating the same code concurrently is caught by the primary key and surfaces as a conflict; there is no silent corruption.
- Deleting a node leaves a gap in the code sequence, but sorting is unaffected.
- The integration tests use numeric fixtures, because the database check rejects non-numeric codes.

## Revisit when

Drag-and-drop reordering or reparenting becomes a hard requirement. At that point introduce a surrogate primary key plus a separate sort key, behind its own ADR and migration.
