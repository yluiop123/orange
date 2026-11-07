# 权限与菜单：path 即身份，菜单由后端拥有

本页解释权限为什么用页面路径做身份、菜单树为什么由后端返回、角色切换为什么只是视图过滤；要改权限数据、菜单渲染或授权判断的开发者读这一页。

## 1. path 即身份

一个权限由 `type + path + action` 三段确定，没有额外的权限编码字段。`type` 只有三种：`menu`、`directory`、`action`。授权字符串（Authority）写作 `type#path`，操作权限再加 `:action`，例如 `menu#/system/user`、`action#/system/user:add`。决策与后果见 [ADR 0001](../adr/0001-path-as-permission-identity.md)。

这样做的直接收益是权限数据、路由与菜单树可以直接对照：看到一行权限就知道它保护哪个页面；前端不需要维护一张从权限编码到页面的映射表。代价是页面路径变成契约的一部分：改路由名不是显示层调整，而是权限数据变更，必须同时迁移角色授权、种子数据与 `@PreAuthorize` 里的字符串。

身份唯一性由数据库兜底，而不是只靠服务层查重。`(type, path, action)` 在“有 action”和“无 action”两种形状上各有一个部分唯一索引；空白 `action` 在服务层归一化为 `NULL`，数据库只存一种“没有动作”的表示。细节见 [数据模型](../reference/data-model.md) 与 [ADR 0004](../adr/0004-validation-layering.md)。

## 2. 三种权限各自的职责

| 类型 | 授权字符串示例 | 授予什么 | 不授予什么 |
| --- | --- | --- | --- |
| 菜单权限 `menu` | `menu#/system/user` | 一个页面本身的访问资格 | 页面内任何操作 |
| 目录权限 `directory` | `directory#/system` | 其路径前缀下所有菜单的**可见性** | 任何 API 访问 |
| 操作权限 `action` | `action#/system/user:add` | 某个页面上的一个动作 | 页面访问资格 |

目录权限只控制可见性，这是模型里最容易被误用的一条：持有 `directory#/system` 并不会让 `GET /api/v1/system/users` 通过，接口仍然要求 `menu#/system/user` 或对应的 `action#...`。后端不把目录权限当作授权来源，前端也只把它用于可见性判断（`canView` 与菜单树），不用于 `canAct`。

服务端把有效权限同时展开成“权限编码”和 `type#path[:action]` 两种 authority；业务代码的 `@PreAuthorize` 只用后者，权限编码用于“不能授予自己没有的权限”这类编码级比较。角色本身以 `ROLE_<roleId>` 形式进入 authority 列表，`super` 的三条守卫就依赖它。

## 3. 权限融合

用户的有效权限是：所有**启用**角色所带权限的并集，加上直属权限，再去掉所有**禁用**权限。角色被禁用时，它带的权限整体不参与；权限被禁用时，即使角色仍然引用它也无效。同一个权限被多个角色或直属授权重复持有时只算一次。这套规则叫权限融合（Role Fusion），不叫继承，也不存在“后一个角色覆盖前一个角色”。

种子数据里 `super` 用户同时持有 `super`、`admin`、`user` 三个角色，并额外有一条直属的仪表盘目录权限。这让“多角色取并集、直属权限叠加”在默认数据里就能被观察到，而不是只存在于测试里。

## 4. 角色切换只是前端视图过滤

角色切换改变的是“当前以哪个角色的视角看菜单和操作”，不是登录身份，也不改变后端授权。前端把 `rolePermissions` 的每一项标上来源角色，按 `currentRole` 过滤后与 `userPermissions` 合并；选择 `all` 时使用全部角色权限。过滤结果同时驱动菜单可见性、`canView`、`canAct` 与默认菜单。

后端在此过程中不参与：它始终按权限融合的结果授权。因此一个用户切到权限更少的角色后，界面会隐藏入口，但直接调用 API 仍可能成功——这是有意的取舍：角色切换是视图工具，不是安全边界。它带来的一个真实约束是，切换后当前页面可能不再可见，前端必须回退到新视角下的第一个可见叶子，而不是留在原地显示一个空壳页面。

## 5. 菜单树由后端拥有

`GET /api/v1/auth/menus` 返回**全部启用**的 `menu` 与 `directory` 节点，节点带 `id`、`path`、`type`、`name` 和嵌套 `children`，同级按业务编码升序。它不按用户过滤，也不包含 `action` 节点。前端不再保存菜单标题、层级或顺序，只保存一张“页面路径到图标”的映射；未知目录回退 `Folder`，未知菜单回退 `Circle`。结构与取舍见 [ADR 0002](../adr/0002-backend-menu-tree.md)。

后端返回全量树有两个原因：菜单结构对所有用户相同，按用户裁剪会让“角色切换”需要重新请求；前端本来就会拿到用户的 `rolePermissions`，在本地过滤成本更低。父节点被禁用或缺失的启用节点会被丢弃并记一条警告，菜单树不会把孤儿分支提升为根节点。

菜单标题以数据库 `name` 为准。React 额外允许按 `menu.<path>` 的本地化文案覆盖显示，缺翻译时回落到 `name`；这比 ADR 0002 描述的“只显示数据库名”更宽松，是当前实现的实际行为。无论哪种，菜单的**唯一数据源**仍是数据库，前端没有第二份菜单清单。

路由不是由菜单树生成的：`src/pages/**/index.tsx` 自动注册为路由，容器路径在菜单加载后重定向到第一个可见叶子。这样菜单接口故障只降低侧边栏质量，不会让整个应用无路由可用；未知 URL 仍走正常的 not-found 与 forbidden 路径。

## 6. 菜单可见性规则

可见性只在前端计算，输入是完整菜单树与当前角色视角下的权限列表：

- 叶子节点可见，当且仅当存在同路径的菜单权限，或存在覆盖它的目录权限（按路径边界匹配，`/sys` 不会匹配 `/system`）。
- 容器节点（有子节点的节点）可见，当且仅当至少有一个子节点可见。容器自身的授权不单独决定它是否显示。
- 不可见节点整棵剪掉；默认菜单是剪枝后第一个可见叶子，`/` 与容器路径都跳到它。

可见性从不授予 API 访问。直接输入一个没有权限的 URL，前端路由守卫会跳到 `/forbidden`；如果绕过前端直接调接口，后端返回 `40301` 与 HTTP 403。菜单接口失败只影响侧边栏，不会把整个应用锁死；未知 URL 仍走正常的 not-found 与 forbidden 路径。

## 7. 禁用权限

禁用权限的 `status` 是 `0`。它不授予 authority、不出现在有效权限里、不出现在菜单树里，因而既看不到入口也调不通接口。禁用父节点前必须先禁用它的启用后代：后端拒绝“父节点隐藏、子节点仍生效”的中间状态，提示“请先禁用子权限/子组织”。删除是另一回事：删除父节点会连同子树一起校验引用，子树被用户或角色引用时整体拒绝。

## 8. 编码即顺序

`sys_group` 与 `sys_permission` 没有 `order_num`。同级顺序就是业务编码的字典序：组织根编码 2 位、权限根编码 4 位，子编码 = 父编码 + 2 位数字。编码是主键且不可修改，数据库用 CHECK 约束编码形状和 `parent_id` 前缀一致。理由与替代方案见 [ADR 0003](../adr/0003-code-as-tree-order.md)。

后果需要说清楚：运行时不能调整顺序，重排只能删除再重建节点，而重建会换掉权限编码，连带丢掉引用它的授权；每层最多 99 个子节点；删除留下编码空档但不影响排序。这些代价换来的是“排序不需要维护第二套不变量”，也不会出现空值或重复序号导致的 500。

## 9. 取舍与边界

path 作为身份让权限可读、可 grep，但把路由命名变成高成本决策；目录权限只做可见性，避免了“看起来有权限、实际调不通”的假授权，却要求每个页面都有一条菜单权限；菜单树全量下发让角色切换无需再请求，却把菜单结构暴露给所有已登录用户——结构本身不是敏感信息，这个暴露是被接受的。真正的安全边界始终是后端的 authority 检查，不是菜单是否显示。

> Last verified: 24826bb · 2026-11-07
> 事实来源: CONTEXT.md、docs/adr/0001-path-as-permission-identity.md、docs/adr/0002-backend-menu-tree.md、docs/adr/0003-code-as-tree-order.md、database/postgres/ddl.sql、database/postgres/dml.sql、backend/springboot/src/main/java/com/orange/domain/system/permission/EffectivePermissions.java、backend/springboot/src/main/java/com/orange/controller/system/UserController.java、frontend/react/src/lib/access.ts、frontend/react/src/store/permission.ts、frontend/react/src/components/menu-redirect.tsx、frontend/react/src/config/menu-icons.ts
