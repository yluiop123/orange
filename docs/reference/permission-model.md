# 权限模型参考

查权限字段取值、菜单树结构、菜单可见性判断、角色关联与角色切换行为时读这一页；设计动机见 [权限与菜单](../explanation/permission-and-menu.md)。

## 权限字段

`sys_permission` 一行就是一个权限，字段取值与约束如下。

| 字段 | 类型 | 可空 | 默认 | 取值 / 约束 |
| --- | --- | --- | --- | --- |
| `id` | `varchar` | 否 | — | 主键，业务编码，纯数字 |
| `name` | `varchar` | 是 | — | 展示名 |
| `path` | `varchar` | 否 | — | 页面路径，`btrim(path) <> ''` |
| `action` | `varchar` | 是 | — | `action` 类型必填非空白，`menu` / `directory` 必须为 NULL |
| `type` | `varchar` | 否 | — | `menu` / `directory` / `action` |
| `status` | `varchar` | 否 | `'1'` | `'1'` 启用，`'0'` 禁用 |
| `parent_id` | `varchar` | 是 | — | 父权限 `id`，自引用外键，`ON DELETE RESTRICT` |
| `version` | `int4` | 否 | `0` | 乐观锁版本 |

## type 三值

| `type` | 术语 | 身份含义 | `action` |
| --- | --- | --- | --- |
| `menu` | 菜单权限 | 一个页面路径对应一个页面 | 必须为 NULL |
| `directory` | 目录权限 | 覆盖以该 `path` 为前缀的所有页面 | 必须为 NULL |
| `action` | 操作权限 | 某个页面上的一个动作 | 必填 |

同一页面可以同时拥有菜单权限与多个操作权限，它们共享同一个 `path`、`type` 不同。

## 业务编码与同级顺序

- 请求层：`AddChildPermissionReq` 用 `@Pattern(regexp = "^[0-9]{2,}$")` 校验新增子权限的编码，只允许数字。
- 库层：`ck_sys_permission_code` 要求根节点长度为 4，子节点长度 = 父 `id` 长度 + 2 且以父 `id` 为前缀。
- 结论：业务编码的前缀关系与 `parent_id` 描述的是同一棵树；同级顺序由编码字典序决定，查询按 `id ASC` 排序即可，没有独立排序列。
- 组织树（`sys_group`）用同一规则，只是根节点长度为 2。
- 改业务编码等于改身份，会同时改变父子关系与同级顺序，不是显示层调整。

## path 是权限身份

- PostgreSQL 下唯一性由两个部分唯一索引保证：`(type, path, action) WHERE action IS NOT NULL` 与 `(type, path) WHERE action IS NULL`。因此同一 `type` 下页面路径不重复，操作权限靠 `action` 区分。
- MySQL 无部分索引，用生成列 `action_key`（`COALESCE(action, '')`）加唯一索引表达同一语义，见 [数据模型](./data-model.md)。
- 重命名页面路径属于权限数据变更，必须同步改权限行与路由。
- 前端匹配用 `normalizePath` / `isSamePath` / `isPathWithin`：忽略末尾斜杠、自动补前导斜杠、按路径段边界判断前缀，避免 `/sys` 误匹配 `/system`。
- 数据库不做归一化，`/system/user` 与 `/system/user/` 在库中视为两个不同路径，但前端视为同一路径。写入前必须自行统一格式。
- 设计背景见 [ADR 0001：path 作为权限身份](../adr/0001-path-as-permission-identity.md)。

## status 与禁用权限

`status` 只接受 `'0'` 与 `'1'`（请求层 `@Pattern(regexp = "^(0|1)$")`）。`'0'` 即禁用权限，三处同时过滤：

1. 菜单树：只取 `status = '1'` 的 `menu` / `directory`。
2. 有效权限：角色权限与直属权限都剔除 `status = '0'` 的权限。
3. 菜单挂载：父节点被禁用时，其整枝不进菜单树（不提升为根节点）。

禁用的角色同样不参与权限计算，但其下用户的直属权限不受影响。

## 授权字符串

授权（Authority）是 `type#path` 或 `type#path:action` 形式的字符串：

| 权限 | 授权字符串 |
| --- | --- |
| 菜单权限 `/system/user` | `menu#/system/user` |
| 目录权限 `/system` | `directory#/system` |
| 操作权限 `/system/user` + `add` | `action#/system/user:add` |

有效权限集合同时包含每个权限的 `id` 与上表形式的字符串，所以接口既可用 `hasAuthority('menu#/system/user')` 也可用权限 id 判断。角色 id 以 `ROLE_` 前缀加入同一列表。

## 菜单树

`GET /api/v1/auth/menus` 返回 `List<MenuInfo>`，节点字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 权限 `id` |
| `path` | `string` | 页面路径 |
| `type` | `string` | `menu` 或 `directory` |
| `name` | `string` | 菜单名 |
| `children` | `MenuInfo[]` | 子节点，默认空数组 |

构建规则（`MenuServiceImpl`）：

1. 只取 `status = '1'` 且 `type` 属于 `menu` / `directory` 的权限。
2. 按 `id ASC` 排序后逐个建节点，顺序即同级顺序。
3. `parent_id` 为空的是根节点。
4. `parent_id` 非空但父节点不在结果集（被禁用或不存在）时，该分支整枝跳过并记警告，不提升为根节点。

返回的是全部启用菜单与目录，不含操作权限；可见性由前端按当前视图权限过滤。

## 菜单可见性

可见性判断只看视图权限集合（`menu` 与 `directory` 两类）：

- 叶子节点：存在 `type = 'menu'` 且 `path` 与节点 `path` 相同的权限，或存在 `type = 'directory'` 且 `path` 覆盖节点 `path` 的目录权限（按路径段边界）。
- 容器节点：只要存在至少一个可见子节点就可见；容器节点自身不授予访问。
- 有子节点的节点一律按容器规则判断：即使自身被授予，若所有子节点都不可见，它也不显示。
- 默认菜单：菜单树中第一个可见叶子，用于访问 `/` 或容器路径时的落点。

动作按钮用另一条规则：`canAct(path, action)` 要求存在 `path` 相同且 `action` 相同的操作权限。菜单可见性不授予 API 访问，API 访问只由后端授权决定。

## 角色与权限关联

| 表 | 列 | 作用 |
| --- | --- | --- |
| `sys_role` | `id`、`name`、`status` | 角色本身 |
| `sys_role_permission` | `role_id`、`permission_id` | 角色授予的权限 |
| `sys_user_role` | `user_id`、`role_id` | 用户拥有的角色 |
| `sys_user_permission` | `user_id`、`permission_id` | 用户直属权限 |

权限融合（`EffectivePermissions`）：

1. 取用户所有 `status ≠ '0'` 的角色。
2. 把这些角色的权限取并集，剔除 `status = '0'` 的权限。
3. 并入用户的直属权限，同样剔除禁用权限。
4. 由并集生成授权字符串；`/auth/user-info` 与 Spring Security 授权来自同一份结果，避免两套过滤规则。

前端对应 `computePermissions`：直属权限全量保留，角色权限按当前角色过滤，合并后得到视图权限集合；当前角色为 `all` 时取全部角色权限。

## 角色切换

角色切换是纯前端视图过滤，不改变后端授权：

- 切换只改当前角色视角，用该角色的权限重算菜单与动作按钮；直属权限始终保留。
- 所选角色按用户名记在 `localStorage`，刷新后恢复；角色已不在用户角色列表中时回退到默认视角。
- 切换后若当前路径不可见，跳到第一个可见叶子（默认菜单）；没有可见叶子则跳 `/forbidden`。
- 后端 token、会话与 `hasAuthority` 判断完全不变，切换后仍可调用原角色有权的接口。

## 术语对照

| 术语 | 代码载体 |
| --- | --- |
| 权限 | `sys_permission` 一行 |
| 菜单权限 / 目录权限 / 操作权限 | `type` 取 `menu` / `directory` / `action` |
| 页面路径 | `path` |
| 授权 | `type#path` 或 `type#path:action` |
| 业务编码 | `id` |
| 同级顺序 | `id` 字典序，无独立列 |
| 权限融合 | `EffectivePermissions.of` |
| 菜单树 / 容器节点 | `MenuInfo` 树，`children` 非空即容器节点 |
| 菜单可见性 | `visibleMenuTree` / `canView` |
| 默认菜单 | `firstVisibleLeaf` |
| 角色切换 | React：`permission.ts` 的 `updateUserInfo` + `computePermissions`；Vue：`setRole`；Angular：`auth.service.ts` 的 `switchRole` |
| 禁用权限 | `status = '0'` |

字段级表结构见 [数据模型](./data-model.md)，端点清单见 [API](./api.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: database/postgres/ddl.sql, backend/springboot/src/main/java/com/orange/domain/system/permission/EffectivePermissions.java, backend/springboot/src/main/java/com/orange/service/system/impl/MenuServiceImpl.java, backend/springboot/src/main/java/com/orange/domain/system/permission/req/AddChildPermissionReq.java, frontend/react/src/lib/access.ts, frontend/react/src/store/permission.ts, CONTEXT.md
