# Orange

权限、菜单与角色模型的项目内词汇。这里只定义概念，不记录实现细节。

## Language

**Permission**:
A capability identified by `type` + `path` + optional `action`. The same page can own several action permissions.
_Avoid_: Module, resource (unless referring to an external system)

**Menu Permission**:
A permission whose `type` is `menu` and whose `path` identifies exactly one page.
_Avoid_: Page permission, route permission

**Directory Permission**:
A permission whose `type` is `directory`; it covers every menu whose `path` starts with the directory path.
_Avoid_: Folder permission, parent menu

**Action Permission**:
A permission whose `type` is `action`; it identifies one action on one page.
_Avoid_: Button permission, operation permission

**Authority**:
The string granted to an authenticated principal, in the form `type#path` or `type#path:action`.
_Avoid_: Role, scope

**Page Path**:
The stable identity of a page inside the permission model. Renaming a page is a permission-data change, not a display-only change.
_Avoid_: URL, link, route (when referring to permission identity)

**Role**:
A named bundle of permissions. Several roles are combined into one visible range for a user.
_Avoid_: Group (reserved for organization structure)

**Role Fusion**:
The rule that all roles of a user are combined when calculating the user's permissions.
_Avoid_: Role inheritance, role override

**Role Switch**:
A UI-only view filter that changes which role's menus and buttons are shown. It does not reduce backend authority.
_Avoid_: Role login, permission switch

**Menu Tree**:
The enabled `menu` and `directory` permissions arranged by their parent relationship. The backend owns its structure, order and names.
_Avoid_: Route tree, navigation config

**Container Node**:
A menu tree node that has visible children. It only groups them and grants no access of its own.
_Avoid_: Parent permission, folder

**Menu Visibility**:
Whether a menu node is shown to the current user. A leaf is visible when a menu permission matches its path or a directory permission covers it; a container is visible when at least one child is visible. Visibility never grants API access.
_Avoid_: Menu permission (when referring to the derived view state), access

**Default Menu**:
The first visible leaf of the menu tree, used when the user opens `/`.
_Avoid_: Home page, landing route

**Disabled Permission**:
A permission whose `status` is `0`. It must not grant authority or appear in menus/actions.
_Avoid_: Inactive permission

**Business Code**:
The stable identifier of an Organization or Permission. Its value also determines the node's position among its siblings; changing it changes identity, not just display.
_Avoid_: Number, sort key

**Sibling Order**:
The display order of nodes that share a parent. It is implied by Business Code and has no independent value.
_Avoid_: Sort index, order field
