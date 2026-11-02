# 系统管理审计报告

> 日期：2026-11-01
> 范围：`vite-shadcn` 系统管理页面与交互、`springboot` 系统管理 API、`database/postgres`
> 状态：**主体问题已修复（2026-11-02），剩余项见下方“修复进度”**
> 相关文档：`PROJECT_ISSUES.md`

---

## 修复进度（2026-11-02）

已修复：

- S1：权限/组织删除递归检查后代引用，无引用时显式删除子树；父级 FK 改为 `RESTRICT`。
- S1：自删/自禁/最后 super 管理员保护。
- S2：角色删除只检查用户引用；角色自身权限在删除时清理。
- S2：越权授予 super/权限、admin 重置 super 密码拦截。
- S2：refresh 轮换改为 `INSERT ... ON CONFLICT DO NOTHING` 原子吊销。
- S2：用户名校验统一、groupId 存在性校验、`AddUserReq.status` 生效。
- S2/S3：不存在资源统一 404；补 405/409 映射；LIKE 通配符转义；查询 `readOnly`。
- S3：权限类型/action 组合校验、状态/类型正则锚点、旧接口缺 id 保护、排序边界保护。
- S3：重置/修改密码清理登录锁定；Swagger 生产 profile 默认关闭。
- S3：新增树节点校验父节点存在。
- S3：种子无密码用户改为禁用；`status` 列 `NOT NULL DEFAULT '1'`。
- 前端：树选择器崩溃、角色下拉为空、编辑弹窗串数据、删除确认、状态开关回滚、分页/选择生命周期、防抖、重复提交、mock 墓碑/组织删除、父级权限回显、ActionAuth 状态开关、错误重试。
- 工程：lint 清零；移除 `src` 内残留构建产物；JWT 私钥移出 Git；`.env.example`；CI 后端 job。

仍存在：

- 操作日志 traceId/变更内容/归档策略。
- 前端 `status` 常量（`StatusSwitch` 已收敛）、树/表格可访问性、新增行定位。
- `queryUserInfo` 多集合 EntityGraph 笛卡尔积；Swagger 生产鉴权。
- 构建体积和依赖大版本升级。

---

## 0. 结论

系统管理主流程可以跑通，但存在几类高风险问题：

1. **数据丢失**：删除父权限/父组织会静默级联删除整棵子树，且可能清空角色/用户授权。
2. **系统锁死**：没有自删、自禁、最后管理员保护；重置超管密码可被有 `user:edit` 的人直接接管。
3. **功能阻断**：树选择器在数据未加载或 id 失效时白屏；用户表单角色下拉永远为空；编辑弹窗会串上一行数据。
4. **交互危险**：删除无确认，树形全选跨页选中全部，可能一次清空大量数据。
5. **契约与一致性**：不存在资源返回 200/500 而不是 404；用户名规则前后不一致；角色删除语义错误；mock 鉴权与真实角色数据脱节。

建议先修 P0/P1，再处理交互体验和性能。

---

# 一、前端系统管理交互

## 严重

### F1. 单值树选择器在加载前/值失效时白屏

- 文件：`src/components/ext/tree-select.tsx:337-365,388-416`；`src/components/group-tree-select.tsx:50-87`；`src/components/permission-tree-single-select.tsx:52-87`；`src/pages/system/group/add-child-dialog.tsx:31-38`；`src/pages/system/permission/edit-dialog.tsx:49-55`；`src/pages/system/user/edit-dialog.tsx:54-59`
- 触发：打开新增子项/新增同级/编辑用户/编辑权限，字段值非空但树数据仍为 `[]`；或分组/权限已被删除。
- 影响：`displayNodes` 返回 `[null]`，渲染 `node.value` 抛 `TypeError`，整页白屏。
- 修复：找不到节点返回 `[]`；加载中显示 loading；悬空 id 显示“已删除”占位；补错误边界。

### F2. 用户表单角色下拉永远为空

- 文件：`src/components/role-select.tsx:8-29`；`src/components/ext/multiple-selector.tsx:203,285-294`
- 触发：打开用户新增/编辑，展开角色选择。
- 影响：`RoleSelect` 异步加载后只更新 `defaultOptions`，但 `MultipleSelector` 的同步 effect 在无 `options` prop 时直接返回，内部 options 永远保持 `[]`。管理员无法添加角色。
- 修复：传 `options={options}`，或让 effect 在无 `options` 时同步 `defaultOptions`。

### F3. 编辑弹窗展示/提交上一行数据

- 文件：`src/pages/system/user/edit-dialog.tsx:75-96,117-125`；`role/edit-dialog.tsx:40-64`；`group/edit-dialog.tsx:40-68`；`permission/edit-dialog.tsx:57-89`
- 触发：关闭后重新打开同一行；从 A 行切到 B 行时请求未返回；详情接口失败。
- 影响：`values` 关闭时未清空；同 id 重开显示旧数据；不同 id 会先显示上一条，请求失败后一直保留；提交时可能用 B 的 id 写入 A 的字段。`getUser` 对不存在用户返回 `data:null`，访问 `user.roles` 抛错。
- 修复：关闭/id 变化时清空；增加 loading/error；详情 null 时中止并提示；请求加取消。

### F4. 权限编辑允许父级设为自身或后代

- 文件：`src/pages/system/permission/edit-dialog.tsx:49-55`；`src/mock/system/permission.ts:227-235`；`src/components/system/resource-list/tree.ts:15-42`
- 触发：编辑权限，在“上级权限”中选择自己或后代。
- 影响：形成环后 `buildTree` 不会把节点放入 roots，节点及后代从列表中消失，前端无恢复入口。
- 修复：树中排除当前节点及后代；mock/后端校验；`buildTree` 增加环检测并把异常节点回退为根。

### F5. 删除无确认，树形全选跨页选中全部

- 文件：`src/pages/system/user/index.tsx:76-85,242-244`；`role/index.tsx:61-70,188-190`；`group/index.tsx:91-100,227-229`；`permission/index.tsx:86-95,253-255`；`src/components/system/resource-list/resource-table.tsx:115-136`
- 触发：点击行内删除/批量删除；组织/权限页点击表头复选框后删除。
- 影响：无确认、无数量提示；树形表头 `toggleAllRowsSelected` 选中整个数据集而非当前页，权限页一次可选中约 48 条并级联删除菜单/操作。
- 修复：统一 AlertDialog，展示选中数/后代数；树形全选明确“当前页/全部”；删除中禁用按钮。

### F6. mock 角色管理与实际鉴权脱节

- 文件：`src/mock/login/user.ts:33-47,83-88`；`src/mock/system/role.ts:64-88,101-110,183-205`
- 触发：编辑角色权限、新建角色分配给用户、重命名/禁用/删除角色。
- 影响：登录权限直接读 `catalog.rolePermissions`，不读角色 store；编辑、新角色、禁用、删除均不影响鉴权；已删除角色仍继续授权。
- 修复：统一角色权限数据源；按 `roleIds` 查角色 store，过滤 deleted/status；变更后刷新 currentPermission 和菜单。

## 高

### F7. 状态开关失败不回滚、无 pending 保护

- 文件：`src/components/system/resource-list/status-switch.tsx:23-33`；四个列表页状态开关位置。
- 触发：切换启用/停用；接口失败或快速连点。
- 影响：页面回调写成 `{ handleStatusChange(...) }`，没有返回 Promise；`await undefined` 立即结束，失败 catch 永不执行，开关保持假成功状态。
- 修复：回调返回 Promise；失败 toast 并回滚；等待期间禁用。

### F8. 异步回调写回过期 `params`

- 文件：`user/index.tsx:76-90`；`role/index.tsx:61-74`；`group/index.tsx:91-108`；`permission/index.tsx:86-99`
- 触发：删除/状态切换/移动未完成时修改筛选或翻页。
- 影响：`.then(() => setParams({ ...params, ... }))` 使用请求发起时的快照，响应回来后覆盖最新输入。
- 修复：使用 `setParams(prev => ...)`；暴露 `refresh()` 或局部更新行数据。

### F9. 筛选/删除后分页不重置也不夹紧

- 文件：`resource-table.tsx:105-113,218,240-262`；`user/index.tsx:223-230`；`role/index.tsx:158-162`
- 触发：第 3 页输入筛选；客户端分页筛选/删除/展开。
- 影响：服务端页超出范围，显示空表和“3 / 1”；客户端 `pageIndex` 可能停在“2 / 1”空页。
- 修复：筛选/排序时 `page:1`；监听 `pageTotal` 夹紧；删除/新增后重置到有效页。

### F10. 选择状态生命周期不一致

- 文件：`resource-table.tsx:233-245`
- 触发：翻页/筛选加载中立即点批量删除；服务端页状态切换后重取。
- 影响：服务端页只在“新数据到达后”清空选择，加载期间旧行仍可被删除；客户端/树形页筛选时隐藏的选择仍保留。
- 修复：page/筛选参数变化时同步清空选择；加载中禁用删除；提供清空选择入口。

### F11. 筛选输入每次按键都发请求

- 文件：四个列表页筛选框；`use-resource-list.ts:47-77`
- 触发：连续输入。
- 影响：每个字符触发完整列表请求、loading 抖动和选择清空。
- 修复：300ms 防抖、trim、重置页码；保留上次数据直到新响应。

### F12. 表单无提交中状态，可重复提交

- 文件：`src/components/dialog-form.tsx:115-117`；`user/add-dialog.tsx:75-94`；`user/index.tsx:70-75`；`src/mock/system/user.ts:313-339`
- 触发：双击保存；双击重置密码。
- 影响：新增用户创建两个随机 id 账号，只有一个临时密码可见；mock 不校验用户名唯一；重置密码并发时临时密码可能被覆盖。
- 修复：`formState.isSubmitting` 禁用按钮；提交中禁止关闭；用户名唯一性校验；重置密码加 pending 和确认。

### F13. mock 删除后重建同 id 永远不可见

- 文件：`role.ts:39-88,158-165,183-191`；`group.ts:88-95,217-225`；`permission.ts:60-86,227-235`；`user.ts:340-363`
- 触发：删除后同 id 重建；编辑已删除行。
- 影响：`deleted` 墓碑仍保留；创建返回成功但列表过滤掉；PATCH 不存在 id 返回 200。
- 修复：创建时清除墓碑或返回 409；更新不存在返回 404。

### F14. 删除组织不清理用户，留下悬空 groupId

- 文件：`src/mock/system/group.ts:268-292`；`src/mock/system/user.ts:224-247`
- 触发：删除仍有用户归属的组织。
- 影响：用户列表显示原始 groupId；编辑用户打开分组树触发 F1；数据完整性破坏。
- 修复：删除前检查用户并阻止/转移，或置空 groupId；树选择器兼容失效 id。

### F15. 权限树“只选父级”展示错误

- 文件：`src/components/ext/tree-select.tsx:54-77,89-124`
- 触发：编辑只包含父级 id 的角色（如种子角色 `user` 仅有 `0000`）。
- 影响：父节点因所有子节点未全选而显示未选中，回显不展示父节点 chip，管理员可能误授权/误撤销。
- 修复：显式选中的父节点本身应显示 checked，并在回显中展示。

## 中

- **F16 错误态是死路**：`use-resource-list.ts:67-73`、`resource-table.tsx:264-276` 错误时整表被一行文本替换，无重试；首次 `loading:false` 先闪“暂无数据”。
- **F17 删除/移动按钮状态与反馈缺失**：无选择时静默；边界移动仍可点；成功无 toast；并发移动有竞态。
- **F18 状态开关/勾选未做按钮级鉴权**：仅页面权限用户仍可切换状态；mock 不返回 403。
- **F19 缺少自我/在用记录保护**：可删除/停用自己、删除在用角色、删除有用户/子节点的组织。
- **F20 新增子项/同级后看不到新记录**：客户端分页 `page:1` 无效，新行在别的页/折叠区。
- **F21 i18n 与校验缺口**：树选择器/角色选择/权限类型仍有硬编码；权限表单 Zod 无中文消息；手机号仅中国大陆格式；语言切换不重新请求列表。
- **F22 树/表格可访问性不足**：树触发器不可聚焦、节点标题是 span、展开按钮无 `aria-expanded`、行级 checkbox 无区分标签、筛选无 label。
- **F23 权限类型/分组父子语义不一致**：前端可选 `function`/`api`，后端只支持三种；分组编辑不能换父级，但新增子项可选择任意父级；角色状态筛选非受控。
- **F24 重复请求与全表重渲染**：每次打开弹窗重新拉组织/权限树；权限树 `getCheckStatus` 近似 O(n²)；`fieldNames` 每次新对象导致 memo 失效。
- **F25 源码内残留构建产物**：`src/pages/system/*/dist/*.js`、`src/mock/system/dist/*`，不会被路由使用但增加误读和仓库体积。

---

# 二、后端系统管理 API

## S1 严重

### B1. 删除父权限静默删除整棵子树并清空授权

- 文件：`PermissionServiceImpl.java:60-99`；`ddl.sql:59,117-118,183-184`
- 触发：删除自身未被引用、但子权限被引用的目录/菜单。
- 影响：只检查选中行，子节点不在 `list` 中；DB `ON DELETE CASCADE` 删除整棵子树，并清空 `sys_role_permission`/`sys_user_permission` 授权；接口仍返回 200。
- 修复：递归收集后代逐个校验引用，有引用 409；无引用显式递归删除并返回数量；`parent_id` 改 `RESTRICT`。

### B2. 删除组织的后代用户检查缺失

- 文件：`GroupServiceImpl.java:59-94`；`ddl.sql:20,153`
- 触发：删除父组织，后代组织下有用户。
- 影响：只检查选中 ID，后代用户触发 FK 冲突 → 500；无用户时静默删除整棵子树。
- 修复：检查所有后代 ID 的用户；`parent_id` 改 `RESTRICT`，应用层显式级联。

### B3. 无自删/自禁/最后管理员保护

- 文件：`UserServiceImpl.java:165-172,193-204`；`UserController.java:62-71,80-94`
- 触发：唯一管理账号删除/禁用自己；任意 `user:delete` 删除 `super`。
- 影响：系统可能永久锁死，只能改库恢复。
- 修复：禁止 self-delete/self-disable；保持至少一个启用管理账号；保护种子超管；返回 409。

## S2 高

### B4. 角色删除语义错误

- 文件：`RoleServiceImpl.java:133-141`
- 触发：删除任何有权限的角色（包括种子角色）。
- 影响：`role.getPermissions()` 是角色自身授权集合，不是外部引用；三个种子角色都永远 409「已被权限引用」。
- 修复：只检查 `sys_user_role` 引用；删除时清理 `sys_role_permission`。

### B5. 用户名重复/组织不存在返回 500

- 文件：`UserServiceImpl.java:122-137`；`GlobalExceptionHandler.java:99-106`；`UserRepository.java:14`
- 触发：重复 username；groupId 不存在。
- 影响：唯一约束/FK 冲突 → 500，没有字段级错误。
- 修复：前置 `existsByUsername` → 409、`existsById(groupId)` → 400；补 `DataIntegrityViolationException → 409`。

### B6. 用户名规则前后不一致

- 文件：`AddUserReq.java:23`（允许下划线）vs `LoginReq.java:14`（禁止下划线）；`EditUserReq.java:24` 无 pattern
- 触发：创建 `john_doe`；编辑 username 为含 `-`/`_`/中文。
- 影响：创建成功但永远登录不了。
- 修复：三处共用同一正则常量。

### B7. groupId 未校验，清空后写入 `''` → 500

- 文件：`EditUserReq.java:31`；`UserServiceImpl.java:157-159`；前端 `user/edit-dialog.tsx:103`
- 触发：编辑用户清空组织后保存。
- 影响：FK 冲突 → 500。
- 修复：`@NotBlank` + 组织存在校验；或明确 `""` 转 null 并允许解绑。

### B8. `AddUserReq.status` 被静默忽略

- 文件：`AddUserReq.java:41-42`；`UserServiceImpl.java:123-136`
- 触发：创建时传 `status:"0"`。
- 影响：仍创建为启用账号。
- 修复：读取并校验 status，显式 `setStatus`；或删除字段。

### B9. 权限/角色编辑可越权授予

- 文件：`UserServiceImpl.java:174-184`；`RoleServiceImpl.java:115-122`
- 触发：有 `user:edit` 的账号把自己 roles 改为 `["super"]`；有 `role:edit` 的账号给角色挂管理权限。
- 影响：完整提权，绕过 RBAC。
- 修复：只能授予自己拥有的权限子集；高权限授予需额外权限；审计。

### B10. 重置密码可接管超管，明文临时密码回包

- 文件：`UserController.java:73-78`；`UserServiceImpl.java:207-218`
- 触发：任意 `user:edit` 对 `super` 重置密码。
- 影响：直接拿到超管临时密码；响应无 `Cache-Control: no-store`。
- 修复：目标权限等级校验 + 二次认证；临时密码一次性展示并加 no-store；不写日志；建议邮件/短信下发。

### B11. 排序边界/空 order NPE

- 文件：`GroupServiceImpl.java:114-126`；`PermissionServiceImpl.java:117-129`
- 触发：第一个子节点 `up`；最后一个 `down`；`order_num` 为 NULL。
- 影响：NPE → 500。
- 修复：空值判断返回 400/409 或静默；`order` 列 `NOT NULL DEFAULT 0`。

### B12. 排序无唯一约束/无并发控制

- 文件：`ddl.sql:10,50`；`GroupServiceImpl.java:193-212`；`PermissionServiceImpl.java:200-223`
- 触发：两个管理员同时添加兄弟；历史重复 order。
- 影响：`queryByParentIdAndOrder` 命中多条 → 500；乐观锁冲突 → 500。
- 修复：`UNIQUE(parent_id, order_num)`；移动/插入加锁；乐观锁冲突映射 409。

### B13. 不存在资源返回 200/500 而不是 404

- 文件：`UserServiceImpl.java:186-189,266-269`；`RoleServiceImpl.java:100-102,145-148`；`GroupServiceImpl.java:178-180,220-222,235-236`；`PermissionServiceImpl.java:105-107,185-187,230-232,257-259`
- 触发：查询/编辑/移动不存在的资源；详情返回 null；组织返回空对象；角色 NPE。
- 影响：前端无法区分成功/不存在；审计显示“修改成功”但未改。
- 修复：统一 `orElseThrow(NOT_FOUND)`。

### B14. 每请求重新加载用户 + 权限图

- 文件：`JwtRequestFilter.java:52-53`；`JwtUserDetailsService.java:24-38`；`PermissionAuthorityBuilder.java:33-40`
- 触发：任意请求。
- 影响：约 `1 + 1 + N(roles) + 1` 条 SQL + 全量 authority 重建。
- 修复：`@EntityGraph` 一次取回，或按 `userId + tokenVersion` 做短 TTL 缓存。

### B15. `queryUserInfo` 多集合 EntityGraph 笛卡尔积

- 文件：`UserRepository.java:16-20`；`UserServiceImpl.java:298-353`
- 触发：每次 `GET /api/user/userInfo`。
- 影响：`roles × roles.permissions × permissions` 行数膨胀。
- 修复：拆两个查询或 DTO 投影。

### B16. 种子用户密码为 NULL → 登录 500

- 文件：`dml.sql:132-152,156`；`LoginController.java:64-69`
- 触发：用 `user001` 等账号登录。
- 影响：`matches(raw, null)` 抛 `IllegalArgumentException`，落入通用 catch → 500。
- 修复：种子补临时密码或禁用；密码为空/无编码前缀返回 401。

### B17. `sys_user.status` 可空且 NULL 视为启用

- 文件：`ddl.sql:141,152`；`JwtUserDetailsService.java:34`
- 触发：历史/手工数据 status 为 NULL。
- 影响：空状态账号可登录，绕过禁用。
- 修复：`status NOT NULL DEFAULT '1'`；入口按 `"1".equals(status)` 判断。

## S3 中

- **B18 权限类型/action 不匹配**：`type=action` 但不填 `action`，生成死权限；`menu/directory` 应禁止 action。`AddChildPermissionReq.java:25`、`PermissionAuthorityBuilder.java:58-67`。
- **B19 状态/类型正则未锚点**：`[01]`、`menu|action|directory` 允许 `"10"`、`"menux"` 穿透到 DB CHECK → 500。`StatusReq.java:13`、`Edit*Req`。
- **B20 遗留 `POST .../edit` 缺 id → 500**：DTO 无 `@NotBlank`；建议下线旧接口。`UserController.java:116-121` 等。
- **B21 组织/权限列表无分页/无上限**：`GroupController.java:30`、`PermissionController.java:29`。
- **B22 LIKE 未转义、`lower(col) LIKE` 不走索引**：`UserServiceImpl.java:79-88` 等。
- **B23 page 无上限、批量 ids 无长度限制**：`QueryUserReq.java:30-34`、`UserController.java:91` 等。
- **B24 `orderValue` 未校验**：非 `asc` 一律 descending。`UserServiceImpl.java:65-67`。
- **B25 查询缺 `@Transactional(readOnly=true)`**：列表/详情方法。
- **B26 删除前引用检查 N+1**：`RoleServiceImpl.java:133-139`、`PermissionServiceImpl.java:66-73`。
- **B27 refresh 轮换先查后写，有并发重放窗口**：`LoginController.java:93-106`、`TokenBlacklistService.java:24-39`。
- **B28 重置密码后不清除登录锁定**：`UserServiceImpl.java:207-218`。
- **B29 操作日志覆盖不足**：无变更内容、无 traceId、同步写、无保留策略。`OperationLogInterceptor.java:41-71`。
- **B30 菜单树对任意登录用户返回全部启用菜单**：普通用户可拿到 `/system/*` 路由结构。`MenuController.java:23-28`、`MenuServiceImpl.java:34-70`。
- **B31 列表/详情结构不一致，实体直接暴露**：`RoleController.java:32-43`；`RoleBean` 缺 status。
- **B32 业务错误码靠中文子串推断**：`GlobalExceptionHandler.java:45-53`。
- **B33 缺少 405/404/409 映射**：`GlobalExceptionHandler.java:65-106`。
- **B34 新增树节点不校验父节点存在/状态**：`GroupServiceImpl.java:138-150`、`PermissionServiceImpl.java:141-153`。
- **B35 组织缓存问题**：本地 Caffeine + 可变实体 + null key 500；多实例陈旧。`GroupServiceImpl.java:233-237`。
- **B36 禁用组织下用户 groupName 为空**：`UserServiceImpl.java:95-108`。
- **B37 密码策略弱、改密无限流**：`ChangePasswordReq.java`、`UserServiceImpl.java:222-238`。
- **B38 Swagger 生产无鉴权**：`SecurityConfig.java:35-37,59`。

## S4 低

- **B39 成功响应 traceId 恒为 null**：`Response.java:28-36`。
- **B40 创建返回 200 而非 201；删除 message 重复**：`UserController.java:46-51` 等。
- **B41 删除逐条 `existsById`+`delete`+`flush`**：`GroupServiceImpl.java:74-79`、`PermissionServiceImpl.java:80-85`。
- **B42 `getRemoteAddr()` 反代后 IP 不准**：`LoginController.java:49`、`OperationLogInterceptor.java:67`。
- **B43 登录限流用户名小写化但查询区分大小写**：`LoginAttemptService.java:99-105`。
- **B44 关联表缺反向索引**：`ddl.sql:113-119,179-185,200-206`。
- **B45 日志/吊销/登录尝试表无清理任务**：`ddl.sql:208-239`。
- **B46 角色/组织 name 无唯一约束**：`ddl.sql:84-95,7-21`。
- **B47 新用户/角色 UUID 与种子编码混用，默认按 id 排序随机**：`User.java:35-38`、`RoleServiceImpl.java:80-81`。
- **B48 `show-sql: true` 常开**：`application.yaml:29`。
- **B49 `QueryGroupReq.id` 拒绝空串，前端清空筛选发送 `id=` → 400**：`QueryGroupReq.java:12-15`。
- **B50 默认管理员口令与 RSA 私钥随仓库分发**：`dml.sql:153-157`、`keys/private_key.pem`。
- **B51 大量 `@Deprecated` 兼容接口重复实现**：`UserController.java:96-129` 等。
- **B52 未使用的 `Delete*Req` DTO**：`domain/system/*/req/Delete*Req.java`。

---

# 三、Top 10 合并修复清单

1. **权限删除级联**：递归校验后代引用，409 或显式级联删除并返回数量；`parent_id` 改 `RESTRICT`。
2. **组织删除级联**：检查所有后代用户，409；`parent_id` 改 `RESTRICT`。
3. **自删/自禁/最后管理员保护**：禁止操作当前用户，保留至少一个启用管理账号，保护种子超管。
4. **角色删除语义**：只按 `sys_user_role` 引用判 409，删除时清理 `sys_role_permission`。
5. **统一输入校验与错误码**：用户名三处同规则；groupId 存在性；`DataIntegrityViolationException → 409`、`OptimisticLock → 409`、`405/404` 映射。
6. **修复树选择器崩溃 + 角色下拉为空**：找不到节点返回 `[]`；`MultipleSelector` 同步 options。
7. **修复编辑弹窗状态**：关闭清空、loading/error、null 保护、防止旧值写新 id。
8. **删除确认与选择范围**：统一 AlertDialog；树形全选限制当前页/明确全部；加载中禁用批量操作。
9. **状态开关 Promise/回滚/防连点**；异步回调用函数式 `setParams` 或 `refresh`。
10. **分页/筛选/防抖**：筛选重置页码、客户端分页夹紧、输入防抖、提交/重置密码 pending 与唯一性校验。

---

# 四、建议修复批次

## 批次 A：数据丢失与系统锁死

- B1 权限删除级联
- B2 组织删除级联
- B3 自删/自禁/最后管理员
- B4 角色删除语义
- B9 越权授予
- B10 重置超管密码
- B27 refresh 并发重放

## 批次 B：系统管理功能阻断

- F1 树选择器崩溃
- F2 角色下拉为空
- F3 编辑弹窗串数据
- F4 权限父子环
- F5 删除确认/树形全选
- F7 状态开关回滚
- F8 过期 params
- F9/F10 分页与选择生命周期

## 批次 C：契约与一致性

- B5/B6/B7/B8 用户校验
- B13 不存在资源 404
- B18/B19 权限类型与正则
- B31 DTO 对齐
- B32/B33 异常映射
- F6 mock 角色数据源
- F13 mock 墓碑
- F14 组织删除悬空用户
- F15 父级权限回显

## 批次 D：性能与可观测性

- B14/B15 权限图加载与笛卡尔积
- B21/B22/B23 分页、LIKE、参数上限
- B25/B26 readOnly 与删除检查 N+1
- B29 操作日志结构化 + traceId
- B30 菜单树按权限过滤
- F11/F24 防抖、树缓存、memo
- F25 清理 `dist` 构建产物

---

# 五、说明

- 本报告是静态审计结论，未修改代码。
- 前端问题大多同时存在于 mock 链路；修复时优先保证真实后端契约正确，再同步 mock。
- 后端问题涉及 DDL 的，需要同时更新 `database/postgres/ddl.sql` 和已有数据库。
- 部分问题属于“设计取舍”（如角色切换仅前端过滤、菜单树返回全量），已在 `PROJECT_ISSUES.md` §4 单独列出，不混在 bug 里。
