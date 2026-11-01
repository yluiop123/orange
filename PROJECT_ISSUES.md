# ORANGE 项目问题分析报告

> 分析日期：2026-11-01
> 分析范围：`vite-shadcn`（前端）、`springboot`（后端）、`database`（PostgreSQL）
> 验证方式：静态代码审查 + 前端构建/类型检查/lint + 后端 Maven 编译 + 浏览器认证流程实测。
> 说明：本文档只记录当前仍未解决的问题。

---

## 0. 摘要

### 0.1 当前结论

项目可以正常构建和演示，但仍存在以下待处理问题：

1. 认证已补齐主动失效和登录限流，但仍缺少自助修改密码等能力；
2. 数据库缺少主键、唯一约束、外键和索引；
3. 前端没有 API 服务层，Mock 与真实后端存在行为差异；
4. 首屏已优化（Cesium 按需加载、MSW/Leaflet 移出入口），但 dist 总体积仍偏大。

### 0.2 验证结果

| 项目 | 命令 | 结果 |
|---|---|---|
| 前端类型检查 | `pnpm exec tsc -b` | 通过，无输出 |
| 前端构建 | `pnpm build` | 成功，耗时约 1 分 03 秒 |
| 前端 lint | `pnpm lint` | 通过：0 errors / 20 warnings |
| 前端测试 | `pnpm test` | 25 个用例全部通过 |
| 后端编译 | `mvn -DskipTests clean compile`（JDK 25） | `BUILD SUCCESS`，67 个源文件 |
| 登录限流 | 本地单元验证 + 后端联调 | 5 次失败后锁定，第 6 次返回 429 |
| token 版本 | 本地单元验证 + 后端联调 | 登出后旧 access/refresh 均返回 401 |
| 防枚举 | 后端联调 | 用户名不存在与密码错误返回相同提示 |
| 权限校验 | 后端联调 | super/admin 的用户、角色、权限、组织动作均通过；user 返回业务码 40301 |
| REST 接口 | 后端联调 | GET/POST/PATCH/DELETE、批量删除、重置密码通过；旧接口保留为 deprecated |
| 错误契约 | 后端联调 | 400/403/404/409/500 + traceId；前端展示服务端 message |
| 参数校验 | 后端联调 | 缺少字段返回 400 + 40001 + 字段明细 |
| 业务异常信息 | 后端联调 | `code=40002`，message 返回业务原始提示（如“用户不存在”） |
| 角色切换权限 | 浏览器实测 | 切换后菜单/目录权限同步更新；刷新后角色选择保留 |
| 临时密码 | 后端联调 | 新增/重置返回 12 位随机密码；重置后旧密码 401，新密码可登录 |
| 首次登录改密 | 后端联调 | 临时密码登录后 userInfo 标记 mustChange=true；其他接口 40302；改密后旧密码 401、新密码可登录 |
| expiresIn / 主动刷新 | 后端联调 + 代码检查 | 登录/刷新返回 expiresIn；前端在过期前 30 秒主动刷新 |
| refresh 轮换 | 后端联调 | 旧 refresh cookie 重放返回 401，新 cookie 正常换取 token |
| token subject | 后端联调 | JWT subject 为不可变用户 ID，username 作为独立 claim |
| JWT 单次解析 | 代码检查 | 过滤器先解析为 `JwtClaims`，再校验类型/版本/主体，不再重复 parse |
| 401 契约 | 后端联调 | 未登录/无效 token 返回 401 + 40101 + traceId |
| 强制改密 403 | 后端联调 | 其他接口返回 403 + 40302 + traceId；userInfo/menus 仍可访问 |
| 安全单测 | `mvn -Dtest=... test` | 11 个用例全部通过 |
| 登录限流 | 后端联调 | 失败计数写入数据库，第 6 次返回 429 |
| 审计字段 | 数据库检查 | 新建角色 created_by/updated_by 自动写入当前用户 |
| 操作日志 | 数据库检查 | POST/DELETE 写操作记录 username/path/status/耗时 |
| 时间类型 | 数据库/接口检查 | DDL 为 timestamptz，接口返回带时区偏移 |
| 按钮级 403 | 代码检查 | axios 403 统一弹“操作被拒绝”对话框 |
| 重复权限 | 后端联调 | 相同 type/path/action 创建返回 409 |
| 禁用权限 | 后端联调 | 权限 status=0 后 userInfo 不再返回该权限 |
| 禁用角色 | 后端联调 | 角色 status=0 后 userInfo 不再返回该角色及其权限 |
| 权限目录 | `pnpm db:seed:check` + Vitest | JSON 与 dml.sql 同步，路由/权限/locale 一致性测试通过 |
| 403 页面 | 浏览器实测 | 无权限角色访问 `/system/user` 跳转 `/forbidden` 并显示原路径 |
| Mock 持久化 | 浏览器实测 | 角色/组织/权限新增后刷新仍存在，删除后不恢复 |
| Mock 登录 | 浏览器实测 | 新建用户可用临时密码登录，并触发强制改密 |
| 删除用户 | 后端联调 | 带角色/权限的用户可直接删除，关联同步清理 |
| Mock 开关 | 构建/运行检查 | 仅 `.env.development`、`.env.github` 开启，生产构建默认关闭 |
| 404 与登录回跳 | 浏览器实测 | 未知路由显示 404；登录后回到 redirect 地址 |
| Cesium 按需加载 | 开发/生产检查 | `/login` 不请求 Cesium，`/map/cesium` 才加载 |
| shadcn 组件 | 浏览器实测 | 系统管理页新增/列表/弹窗正常，无嵌套按钮告警 |
| 系统列表模块 | 浏览器实测 | 用户/角色/组织/权限列表、选择、树展开、分页、删除正常 |
| 菜单树接口 | 后端联调 | `GET /api/user/menus` 返回 6 个根节点；action 不出现；`/system` 子节点顺序正确 |
| 菜单父级提升 | 后端联调 | 禁用父菜单后，启用的子菜单提升为根节点并记录 warning |
| 强制改密菜单 | 后端联调 | `mustChangePassword=true` 的用户仍可访问 `/api/user/menus` |
| 菜单 Mock | 浏览器实测 | mock 模式的侧边栏与真实后端一致 |
| 前端菜单树 | 浏览器实测 | 侧边栏/面包屑使用数据库名称；`/`、`/dashboard`、`/system` 跳转正确 |
| 角色视角菜单 | 浏览器实测 | 角色切换后菜单按 `currentPermission` 重新过滤 |
| 直接访问 403 | 浏览器实测 | `user` 角色访问 `/system/user` 跳转 `/forbidden` |

### 0.3 构建体积

- `dist` 总体积约 **35.93 MB**
- `dist/assets` 共 **941 个 JS 文件**，约 **22.72 MB**
- 入口 chunk `index-*.js` 约 **0.42 MB**（gzip 约 132.8 KB），优化前约 1.11 MB
- `index.html` 不再同步加载 `Cesium.js`（开发和生产都不会注入全局脚本）
- `dist/cesium-package` 约 **12.5 MB**，其中 `Cesium.js` 约 **5.8 MB**；保留本地资源，仅访问 `/map/cesium` 时加载
- 最大 chunk 约 **6.39 MB**（Babylon，路由懒加载）

### 0.4 前端依赖版本

| 依赖 | 版本 | 说明 |
|---|---|---|
| react / react-dom | 19.3.1 | 最新 |
| vite | 8.3.5 | 最新，构建改用 Rolldown |
| eslint | 10.14.0 | 最新 |
| msw | 3.0.3 | 最新，Worker 已重新生成 |
| zod | 4.6.7 | 最新 |
| react-router | 8.5.1 | 最新 |
| cesium | 1.146.0 | 最新，仍使用本地资源 |
| tailwindcss | 4.3.3 | 最新 |
| typescript | 5.9.3 | 未升 7.0：`typescript-eslint` 尚不支持 |
| @tanstack/react-table | 8.21.3 | 未升 9.x：API 重写，需单独迁移 |
| recharts | 2.15.4 | 未升 3.x：类型与示例页不兼容 |
| react-resizable-panels | 3.0.6 | 未升 4.x：组件导出重命名 |

---

## 1. 接口设计问题

### 1.1 命名与版本不一致

- `/api/user/userInfo` 使用 camelCase，其他接口多为小写/复数；
- `/api/user/*` 与 `/api/system/*` 分组不统一；
- 没有 API 版本号；
- 有的接口返回实体，有的返回 Bean。

建议：

- 统一 `/api/v1`；
- 认证接口统一放 `/api/v1/auth/*`；
- 返回 DTO，不返回 JPA 实体。

### 1.2 查询参数仍需统一

- 已补齐 `page=1`、`size=10`、最大 `size=100`，分页响应包含 `page/size/totalPages`；
- `filterField`、`orderField` 已加白名单，非法字段返回 400；
- 搜索已改为大小写不敏感的前缀匹配。
- 仍在使用 `filterField/filterValue`，而不是显式的 `keyword/status/sort` 参数。

建议：把查询参数收敛为 `keyword`、`groupId`、`status`、`sort`，前端同步调整。

### 1.3 权限模型设计

已确认的设计（见 `CONTEXT.md`、`docs/adr/0001-path-as-permission-identity.md`）：

- 权限身份是 `type + path + action`，不新增独立 code 列；
- `menu` 精确对应一个页面，`directory` 覆盖其路径前缀下的所有菜单；
- `directory` 只控制可见范围，后端鉴权仍需 `menu` / `action` authority；
- 同一资源的不同动作分别建 `action` 权限；
- 角色融合决定可见范围，前端切换角色只是视角筛选；
- `path` 是稳定契约，路由改名视为权限数据变更。

已修复：

- `status=0` 的权限和角色不再下发 authority，也不再出现在 userInfo；
- 新增/编辑权限时应用层检查 `(type, path, action)` 重复，返回 409；
- 前端动作权限匹配复用 `isSamePath`。

仍存在：

- 数据库层没有 `(type, path, action)` 唯一约束（按决策不加）；
- 动态路由/数据级权限不在当前模型内。

### 1.4 认证接口剩余缺口

已完成：

- 登录/刷新返回 `expiresIn`，前端临近过期时主动刷新；
- token subject 改为不可变用户 ID，username 放入单独 claim，兼容旧 token；
- refresh token 轮换并记录旧 `jti`，重放旧 refresh token 返回 401；
- 登录失败计数改为数据库存储，多实例共享；
- refresh Cookie 支持 `Secure`、`SameSite`、`Domain` 配置；
- 每个请求只解析一次 access token，解析结果使用 `JwtClaims`；
- 401 统一返回 `Response` 契约（`40101` + traceId），不再使用 `sendError`；
- 强制改密 `40302` 与 401 共用 `SecurityResponseWriter`；
- `PermissionAuthorityBuilder` 集中处理角色/权限 authority 与禁用过滤；
- 安全包统一构造器注入，删除死代码和重复校验；
- 新增 `JwtUtil`、`LoginAttemptService`、`PermissionAuthorityBuilder` 单元测试。

仍存在：

- 生产部署仍要求同域或子域 Cookie，跨站第三方 Cookie 有限制；
- access token 无法单独吊销（仍依赖 tokenVersion）；如需单 token 吊销可复用 jti 黑名单。

---

## 2. 数据库与领域模型

### 2.1 N+1 查询

- 用户列表已改为一次加载组织名称并构建 `Map<id, name>`；
- `queryUserInfo` 已通过 `@EntityGraph(attributePaths = {"roles", "roles.permissions", "permissions"})` 一次加载角色和权限。
- 仍需关注：组织名称查询仍是单独一次；登录/刷新链路可继续用缓存优化。

### 2.2 审计字段与操作日志

已完成：

- `sys_user/sys_role/sys_group/sys_permission` 增加 `created_by`、`updated_by`，通过 Spring Data JPA Auditing 自动填充；
- 新增 `sys_operation_log`，记录系统写操作的 username、method、path、status、耗时、IP；
- 新增 `@EnableJpaAuditing` 与 `AuditorAware`，自动从 SecurityContext 获取操作人。

仍存在：

- 操作日志目前只记录 HTTP 维度和查询参数，没有记录请求体差异；
- 日志表没有定期归档策略。

### 2.3 时区与时间类型

已完成：

- DDL 的 `create_time/update_time/expires_at` 改为 `timestamptz`；
- 实体和 DTO 改为 `OffsetDateTime`，JSON 输出带时区偏移。

仍存在：

- 前端目前直接展示服务端返回的时间字符串，没有按用户时区格式化。

---

## 3. 前端工程与性能

### 3.1 构建总体积仍偏大（首屏已优化）

已完成：

- Cesium 改为 `/map/cesium` 页面按需加载，`index.html` 不再同步加载 5.48 MB 的 `Cesium.js`；
- Cesium 继续使用本地 `dist/cesium-package` 资源，不依赖外部 CDN；
- MSW 改为动态导入，生产关闭 Mock 时不会进入首屏；
- Leaflet 的 JS/CSS 从入口移到 Leaflet 相关页面；
- 布局改为懒加载，登录页不再下载侧边栏；
- 路由组件缓存，避免 locale 切换时重新创建 lazy 组件。

效果：

- 入口 chunk 从约 1.11 MB 降到约 0.37 MB（gzip 354 KB → 120.5 KB）；
- `/login` 不请求 Cesium，`/map/cesium` 才加载；
- 首屏不再受 Cesium 影响。

说明：Cesium 资源保持本地自托管，因此 `dist` 总量仍包含约 12.5 MB 的 `cesium-package`。

仍存在：

- `dist` 总量约 35.9 MB，其中 Cesium 本地资源约 12.5 MB；
- Babylon 约 6.39 MB，LarkMap/L7 约 4.72 MB，Swagger UI 约 1.43 MB，AntV charts 约 1.34 MB，ECharts 约 1.22 MB；
- Vite 8（Rolldown）产物 chunk 数明显增加（932 个 JS 文件），总量和部署文件数都偏高；
- 这些页面均已按路由懒加载，不影响首屏，但会拉高总体积和部署产物大小。

建议：

- 如果 `/swagger` 只用于演示，可改为外链后端 Swagger UI，移除 `swagger-ui-react`，可减少约 1.2 MB；
- 如果不需要 3D/地图演示页，可移除对应的 Babylon、L7、MapLibre、Three 依赖，总体积会明显下降；
- 继续对大依赖做体积预算；
- 用 `pnpm analyze` 检查重复依赖和异常 chunk。

### 3.2 组件直接调用 axios，没有 API 服务层

已完成：

- 新增 `src/api/types.ts` 与 `src/api/system/{user,role,group,permission}.ts`；
- 用户/角色/组织/权限列表页和新增、编辑、重置密码、移动、删除等操作全部改为调用 API 层；
- `group-tree-select`、`permission-tree-select`、`permission-tree-single-select` 等业务组件也不再直接 `axios.get`；
- 列表请求统一支持 `AbortSignal`。

仍存在：

- 类型仍为手写，可能与后端 OpenAPI 漂移。

建议：用 `openapi-typescript` 从 `/api-docs` 生成类型并替换手写 DTO。

### 3.3 useEffect 取数存在竞态

已完成：

- 用户、角色、组织、权限四个列表页统一使用 `AbortController` 清理请求；
- 增加 `loading` / `error` 状态，失败时展示错误而不是继续显示旧数据；
- 快速切分页/筛选时，已取消的请求不会回写状态；
- 四个页面已抽成 `useResourceList` + `ResourceTable` 深模块，列表页合计从约 1940 行降到约 1070 行；
- `ResourceTable` 区分服务端分页和客户端分页，树形展开列、选择级联、列显隐都在模块内；
- 状态开关改为乐观更新，等待服务端返回期间不会回弹；
- 权限路径筛选已贯通 API、Mock 和后端查询。

仍存在的优化项：可以用 TanStack Query 统一缓存、重试和失效。

### 3.4 错误处理仍不完整

已完成：

- 列表页有显式 error 状态；
- 业务弹窗统一 `catch`，错误提示由 axios 拦截器集中处理；
- 后端已返回真实 HTTP 状态和 `traceId`；
- 新增 `/forbidden` 403 页面，路由无权限时跳到该页并显示原访问路径；
- 按钮级 403 统一弹出“操作被拒绝”对话框；
- 初始密码未修改时，后端拦截其他接口，前端强制弹出修改密码对话框；
- 系统写操作写入 `sys_operation_log`。

仍存在：

- 操作日志暂不记录请求体差异；
- 日志归档和保留策略待补充。

### 3.5 原生 HTML 控件已尽量替换为 shadcn

已完成：

- 业务页面、`components/ext/*`、仪表盘中的 `<button>` 基本替换为 `Button`；
- 文本/数字/时间输入替换为 `Input`，多行输入替换为 `Textarea`；
- 可关闭 Tag、多选标签、树选择展开、上传删除、颜色预设等交互统一使用 `Button`；
- 手写复选框替换为 `Checkbox`，范围输入替换为 `Slider`；
- `nav-user` 使用 `DropdownMenu` / `DropdownMenuRadioGroup`；
- `PasswordDialog`、404 页面使用 shadcn `Dialog` / `Button`；
- `TooltipTrigger` 内不再嵌套原生 `<button>`，避免嵌套按钮导致的无障碍问题；
- 侧边栏菜单不再向 shadcn `SidebarMenuButton` 传 `tooltip`，避免 Base UI `render` 警告；菜单项本身改为 `Link` 渲染，避免 `<a><button>` 嵌套；
- MSW 只对未匹配的 `/api/*` 请求告警，不再刷屏提示页面、模块和静态资源。

仍保留原生元素的位置：

- 文件选择 `<input type="file">`（由 react-dropzone / Uppy 管理，必须保留原生 input）；
- 拖拽排序手柄（需要直接绑定 dnd-kit 的 `listeners` / `attributes`）；
- 自定义输入框内部实现（如 `InputNumber`、`Mentions` 的底层输入，外层已统一为 shadcn 组件）。

### 3.6 菜单与权限配置

已统一：

- 新增 `vite-shadcn/src/config/permissions.json` 作为权限目录单一数据源；
- `scripts/sync-permission-seed.mjs` 从该 JSON 生成 `dml.sql` 的权限和角色授权块；
- Mock 的角色、权限和登录权限数据全部从同一目录读取；
- 删除重复的 `mock/components/permission.ts`、`mock/components/group.ts`；
- 新增测试校验：`dml.sql` 必须与目录同步，每个叶子菜单权限必须有对应页面文件，每个页面必须有对应菜单权限，目录权限不能对应页面；
- CI 增加 `pnpm db:seed:check`，防止手工改 SQL 后忘记同步；
- 后端新增 `GET /api/user/menus`，返回启用的 `menu` / `directory` 树，节点包含 `id/path/type/name/order/children`；
- 前端删除 `src/routes.ts`，页面路由由 `src/lib/page-routes.ts` 从 `src/pages/**/index.tsx` 自动生成；
- 前端只保留 `src/config/menu-icons.ts` 的 `path → 图标` 映射，未知路径按类型回退；
- 菜单标题使用数据库 `name`，不再依赖 locale 的 `menu.*`；
- 菜单父级路径和 `/` 由 `MenuRedirect` 跳到当前角色下第一个可见叶子；
- 菜单接口失败时侧边栏和默认跳转显示重试，页面路由不受影响。

仍存在：

- 英文界面菜单显示数据库中文名（已确认的取舍）；
- 新增菜单仍需同时新增页面文件和权限数据；
- 角色切换仍是前端视角过滤，后端 authority 始终是角色并集；
- 菜单增删改在前端下次刷新后生效，不实时推送。

---

## 4. 建议修复路线

### 第一批：影响功能可用性

- [x] 分页参数默认值 + 校验 + 排序白名单
- [x] `sys_user.username` 唯一约束 + 冲突处理

### 第二批：安全与认证

- [x] 重置密码改为随机临时密码
- [x] 增加自助修改密码接口 + 首次登录强制改密
- [x] 登录/刷新返回 expiresIn，前端提前刷新
- [x] token subject 改为用户 ID
- [x] refresh token 轮换 + jti 黑名单
- [x] 登录失败计数数据库化
- [x] Cookie Secure/SameSite/Domain 可配置
- [ ] 补 `.env.example` 和演示密钥说明

### 第三批：工程质量

- [x] 清理 `src/**/dist`，修正 ESLint ignore
- [x] Cesium 按需加载、MSW/Leaflet 移出首屏
- [ ] 进一步缩减 Swagger UI 等大型演示页 chunk
- [x] 清理未使用依赖
- [x] 引入 Vitest 和 CI lint/typecheck/test
- [ ] 引入 Flyway（当前项目约定：直接维护 `ddl.sql`/`dml.sql`，暂不引入迁移文件）
- [x] 补数据库主键/外键/索引
- [x] 前端增加 `src/api/` 服务层
- [ ] 用 OpenAPI 生成前端类型，替换手写 DTO
- [x] Mock 用户 CRUD 改为 localStorage
- [x] Mock 角色/组织/权限 CRUD 持久化
- [x] Mock 登录接入用户 store，新建用户可登录并强制改密
- [x] 页面和业务组件优先使用 shadcn 组件
- [x] 权限目录单一数据源 + SQL 生成与一致性校验
- [x] 403 页面级提示 + 按钮级 403 对话框
- [x] 审计字段 + 操作日志
- [x] timestamptz + OffsetDateTime
- [x] 系统列表页抽成 `useResourceList` + `ResourceTable`
- [ ] 菜单由后端驱动（标题/图标/排序也由后端返回）

---

## 5. 附录

### 5.1 关键文件索引

| 模块 | 文件 |
|---|---|
| 前端请求封装 | `vite-shadcn/src/lib/axios.ts` |
| 前端认证 | `vite-shadcn/src/auth/` |
| 前端用户状态 | `vite-shadcn/src/store/user.ts` |
| 系统列表模块 | `vite-shadcn/src/components/system/resource-list/` |
| 状态开关 | `vite-shadcn/src/components/system/resource-list/status-switch.tsx` |
| 领域词汇 | `CONTEXT.md` |
| 权限身份 ADR | `docs/adr/0001-path-as-permission-identity.md` |
| 前端国际化 | `vite-shadcn/src/store/locale.ts` |
| 前端路由 | `vite-shadcn/src/App.tsx`、`src/lib/page-routes.ts` |
| 前端菜单 | `vite-shadcn/src/store/menu.ts`、`src/components/menu-redirect.tsx`、`src/config/menu-icons.ts` |
| 前端布局/权限 | `vite-shadcn/src/layout.tsx`、`src/components/sidebar-menutree.tsx` |
| 后端安全配置 | `springboot/src/main/java/com/orange/security/SecurityConfig.java` |
| 后端 JWT | `springboot/src/main/java/com/orange/security/JwtUtil.java`、`JwtClaims.java` |
| 后端 401/403 输出 | `springboot/src/main/java/com/orange/security/SecurityResponseWriter.java` |
| 后端权限加载 | `springboot/src/main/java/com/orange/security/JwtUserDetailsService.java` |
| 后端 authority 组装 | `springboot/src/main/java/com/orange/security/PermissionAuthorityBuilder.java` |
| 后端 token 版本 | `springboot/src/main/java/com/orange/security/AuthUser.java` |
| 后端登录限流 | `springboot/src/main/java/com/orange/security/LoginAttemptService.java` |
| 后端安全单测 | `springboot/src/test/java/com/orange/security/` |
| 后端登录 | `springboot/src/main/java/com/orange/controller/login/LoginController.java` |
| 后端全局异常 | `springboot/src/main/java/com/orange/controller/GlobalExceptionHandler.java` |
| 后端用户服务 | `springboot/src/main/java/com/orange/service/system/impl/UserServiceImpl.java` |
| 数据库 DDL | `database/postgres/ddl.sql` |
| 数据库 DML | `database/postgres/dml.sql` |
| Mock 用户接口 | `vite-shadcn/src/mock/system/user.ts` |

### 5.2 说明

- 本报告基于当前工作区代码，核心流程已用本地 PostgreSQL + Spring Boot 联调验证；
- 数据库结构、种子与权限数据统一维护在 `database/postgres/ddl.sql`、`dml.sql`，不再单独保留迁移文件；已有数据库需按 DDL/DML 差异手工同步；
- 当前登出会递增 `tokenVersion`，因此会注销该用户的所有会话；
- `README.zh-CN.md` 的未提交修改属于用户原有工作，未做改动。
