# Path as permission identity

Orange identifies permissions by `type` + `path` + optional `action` instead of a separate permission code. A menu path is the stable identity of one page; a directory covers all menu paths beneath it; an action is tied to its page path. We keep this model because it keeps permission data, routes, and the menu tree directly readable, and because the project deliberately treats page paths as stable contracts. The trade-off is accepted: renaming a route is a permission-data change, not a display-only change.

Directory permissions only control visibility. Backend authorization still requires the matching `menu` or `action` authority. Role switching is a UI view filter; backend authority is always the union of all roles.
