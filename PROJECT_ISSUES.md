# ORANGE 项目问题与取舍清单

> 更新日期：2026-11-03
> 分析范围：`frontend/react`（前端）、`backend/springboot`（后端）、`database`（PostgreSQL）
> 说明：本文记录**已完成基线、已接受的工程取舍，以及受上游阻塞的升级**。当前没有未决的功能性问题。

---

## 0. 当前状态

### 0.1 结论

项目可以正常构建和演示。认证、权限、后端菜单树、统一错误响应、系统管理高危问题、操作日志和安全测试已经收口；**当前没有未决的功能性问题**。剩余事项均为已接受的工程取舍或受上游阻塞的升级，见 §4。

### 0.2 已完成基线

- **认证**：access token 内存保存，refresh token 走 HttpOnly Cookie；refresh 轮换 + jti 黑名单；tokenVersion 吊销；数据库登录限流；首次登录强制改密；401/40302 统一 `Response` 契约；每个请求只解析一次 JWT。
- **权限**：权限身份为 `type + path + action`；禁用权限/角色不再下发 authority；应用层重复权限返回 409；角色融合、角色切换仅作为前端视角过滤。
- **菜单**：`GET /api/v1/auth/menus` 返回启用菜单树；前端删除 `routes.ts`，页面路由由文件系统自动生成；前端只保留 `path → 图标` 映射；面包屑和 `/` 默认跳转使用后端菜单树。
- **数据库**：主键、外键、索引、`sys_user.username` 与权限身份唯一约束齐备；编码、权限形状由 CHECK 兜底；审计字段、操作日志、`timestamptz` + `OffsetDateTime` 已落地。
- **前端**：`src/api/` 服务层；`useResourceList` + `ResourceTable` 深模块；系统页优先 shadcn；403 页面和按钮级 403 对话框；请求取消/竞态处理。
- **质量**：`security` 包按 `jwt` / `auth` / `config` 拆分；`JwtProperties` / `AuthProperties` / `CorsProperties` 集中配置；27 个后端单测 + 19 个 Testcontainers 集成测试；lint 0 warning。

### 0.3 最新验证结果

| 项目 | 命令/方式 | 结果 |
|---|---|---|
| 前端类型检查 | `pnpm exec tsc -b` | 通过 |
| 前端 lint | `pnpm lint` | 0 errors / 0 warnings |
| 前端测试 | `pnpm test` | 40 passed |
| 权限种子一致性 | `pnpm db:seed:check` | 通过 |
| 前端构建 | `pnpm build` | 成功，约 11 秒 |
| 后端编译 | `mvn -DskipTests compile`（JDK 25） | 成功 |
| 后端单测 | `mvn -Dtest=JwtUtilTest,... test` | 27 passed |
| 后端集成测试 | Testcontainers + PostgreSQL 16 + 真实 HTTP | 19 passed |
| 后端合计 | 单测 + 集成 | 46 passed |
| OpenAPI 快照 | `/api-docs` + `openapi-typescript` | 生成并用于前端 DTO |
| 操作日志 | 集成测试 | 记录 traceId、请求体、路径和操作人；请求体脱敏并截断 |
| 日志保留 | 配置检查 | 默认保留 90 天，每天凌晨清理 |
| Trace ID | 集成测试 | 响应头、错误响应和操作日志使用同一个 ID |
| 登录限流 | 后端联调 | 第 6 次失败返回 429 |
| refresh 轮换 | 后端联调 | 旧 refresh 重放返回 401 |
| 登出吊销 | 后端联调 | 旧 access token 返回 401 |
| 401 契约 | 后端联调/集成测试 | 401 + 40101 + traceId |
| 强制改密 | 后端联调/集成测试 | 其它接口 403 + 40302；user-info/menus 仍可访问 |
| 菜单树 | 后端联调/集成测试 | 6 个根节点，action 不入树，顺序正确 |
| 权限/组织级联删除 | 集成测试 | 后代引用返回 409；无引用时显式删除整棵子树 |
| 权限身份唯一 | 集成测试（直连 SQL） | 重复 `(type,path)` 与 `(type,path,action)` 被唯一索引拒绝 |
| 权限数据形状 | 集成测试（直连 SQL） | 空白 `path`、`menu` 携带 `action` 被 CHECK 拒绝 |
| 空查询参数 | 集成测试 | 组织/权限列表接受空串筛选，返回 200 |
| 自删/自禁/最后管理员 | 集成测试 | 当前用户不可禁用；至少保留一个启用的 super |
| 越权授予/重置超管 | 集成测试 | admin 不能授予 super、不能重置 super 密码 |
| refresh 并发重放 | 集成测试 | 旧 refresh 重放返回 401 |
| 系统管理交互 | 前端检查 | 树选择器/角色下拉/编辑弹窗/删除确认/停用确认/分页选择/防抖已修复 |
| 操作日志页面 | 前端构建 | `/system/operation-log` 已注册菜单、路由和 Mock |
| JWT 密钥外置 | 集成测试 | 密钥缺失时自动生成临时密钥；仓库不再跟踪 PEM |
| 后端 CI | 工作流检查 | 新增 JDK 25 编译 + 安全测试 job |
| 直接访问 403 | 浏览器实测 | `user` 访问 `/system/user` 跳 `/forbidden` |
| 菜单 Mock | 浏览器实测 | mock 模式与真实后端一致 |

### 0.4 构建体积

| 指标 | 当前值 |
|---|---|
| `dist` 总体积 | 约 **34.39 MB** |
| JS 文件数 | **1015** |
| JS 总体积 | 约 **28.39 MB** |
| 入口 `index-*.js` | 约 **0.30 MB** |
| `cesium-package` | 约 **12.52 MB**（其中 `Cesium.js` 5.8 MB） |
| 最大 chunk | Babylon 约 **6.09 MB** |
| 其它大 chunk | L7 4.5 MB、AntV 1.28 MB、ECharts 1.17 MB |

这些页面均已路由懒加载，不影响首屏，但会拉高部署产物体积和文件数。

### 0.5 前端依赖版本

| 依赖 | 版本 | 说明 |
|---|---|---|
| react / react-dom | 19.3.1 | 最新 |
| vite | 8.3.5 | 最新，Rolldown 构建 |
| eslint | 10.14.0 | 最新 |
| msw | 3.0.3 | 最新 |
| zod | 4.6.7 | 最新 |
| react-router | 8.5.1 | 最新 |
| cesium | 1.146.0 | 最新，本地自托管 |
| tailwindcss | 4.3.3 | 最新 |
| typescript | 5.9.3 | 未升 7.0：`typescript-eslint` 尚不支持 |
| @tanstack/react-table | 8.21.3 | 未升 9.x：API 重写，需单独迁移 |
| recharts | 2.15.4 | 未升 3.x：类型与示例页不兼容 |
| react-resizable-panels | 3.0.6 | 未升 4.x：组件导出重命名 |

---

## 1. 高优先级问题（已收口）

### 1.1 API 契约与版本

- [x] 统一 `/api/v1` 前缀；认证接口在 `/api/v1/auth/*`，系统接口在 `/api/v1/system/*`。
- [x] `/api/user/userInfo` 已改为 `/api/v1/auth/user-info`，其余接口保持小写/复数或 kebab-case。
- [x] 用户列表新增 `keyword/status/sort/direction`，旧的 `filterField/filterValue/orderField/orderValue` 保留兼容；角色列表新增 `sort/direction`。
- [x] 操作日志新增只读接口 `GET /api/v1/system/operation-logs`，使用显式过滤参数。
- [x] 组织/权限/角色列表已改为 `GroupBean` / `PermissionBean` / `RoleBean` 响应 DTO，不再直接序列化 JPA 实体。
- [x] 前端 `src/api/schema.d.ts` 由 `openapi.json` 生成；用户、角色、组织、权限、操作日志的响应/请求类型已改用生成类型，`PageResult` 泛型仍是前端辅助类型。

重新生成类型：

```bash
# 需要 Docker（Testcontainers）
cd backend/springboot
mvn -Dtest=SecurityIntegrationTest#openApiSpecIsAvailable \
  -Dopenapi.snapshot=../../contracts/openapi.json test
cd ../../frontend/react
pnpm gen:api
```

### 1.2 安全与运维

- [x] JWT 私钥已移出 Git；缺失时后端生成临时密钥，生产通过 `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` 挂载固定 PEM。说明见 `docs/security/jwt-keys.md`。
- [x] 已补 `.env.example`，覆盖后端数据库/JWT/Cookie/限流和前端 Vite 变量。
- [x] 刷新 Cookie 已支持 `SameSite=None; Secure` 和跨子域 `Cookie-Domain`；跨站场景剩余的第三方 Cookie 限制属于浏览器策略，不是应用缺陷。
- [x] 会话吊销采用 `tokenVersion`，一次注销该用户全部会话；单 token 吊销不在当前需求内。
- [x] CI 已增加后端 JDK 25 编译 + 安全测试 job；Testcontainers 在 GitHub Ubuntu 的 Docker 环境运行。

### 1.3 构建体积与 lint

- [x] 前端 lint 已清零（0 errors / 0 warnings）。
- [x] 已移除前端 `/swagger` 静态页和 `swagger-ui-react` 依赖，需要接口文档时直接访问后端 `/swagger-ui.html`。
- [x] `dist` 体积和大 chunk 已确认来源为 3D/地图演示页，决定全部保留并接受当前体积，见 §4。

### 1.4 数据与领域

- [x] 角色删除已改为只检查 `sys_user_role` 引用；角色自身权限在删除时清理，不再“有权限就永远删不掉”。
- [x] 操作日志已记录 traceId、请求体（脱敏、截断）、操作人、路径、状态、耗时和 IP；新增 `/system/operation-log` 查询页。
- [x] `sys_operation_log` 增加保留期配置和每日清理任务，默认保留 90 天。
- [x] `queryUserInfo` 和认证链路改为“角色权限 + 直属权限”两次查询，避免多集合 EntityGraph 笛卡尔积。
- [x] 前端新增 `formatDateTime`，系统管理列表和操作日志按浏览器时区格式化时间。

### 1.5 系统管理审计修复进度

完整报告：`docs/audits/system-management-2026-11-01.md`

已修复（2026-11-02）：

- 权限/组织删除递归检查后代引用，无引用时显式级联删除；父级 FK 改为 `RESTRICT`；
- 自删/自禁/最后 super 管理员保护；
- 角色删除语义修正；
- 越权授予 super/权限、admin 重置 super 密码拦截；
- refresh 轮换改为数据库原子插入，堵住并发重放；
- 用户名校验统一、groupId 存在性校验、`AddUserReq.status` 生效；
- 不存在资源统一 404；补充 405/409 异常映射；LIKE 通配符转义；查询 `readOnly`；
- 权限类型/action 组合校验、状态/类型正则锚点、旧 `POST .../edit` 缺 id 保护；
- 排序改造：移除 `order_num`、上移/下移/置顶和 `addBrother`；同级顺序由编码决定，删除不再重排；父级/长度/前缀由数据库 CHECK 约束（ADR 0003）；重置/修改密码清理登录锁定；
- Business Code 规则收敛为后端 `TreeCodePolicy` + `PermissionShapePolicy`；前端和 Mock 共用 `tree-code-policy.ts` 与同一份 fixture；数据库增加 `ck_sys_permission_action_shape`，拒绝 menu/directory 带 action、action 类型缺 action 的非法权限；
- Group/Permission 的 BFS 删除、祖先包含、禁用守卫收敛到纯内存 `TreeIndex`；两个 service 不再各自维护树算法；
- 新增树节点校验父节点存在；
- 种子无密码用户改为禁用；`status` 列 `NOT NULL DEFAULT '1'`；
- `application.yaml` 默认关闭 Swagger/OpenAPI，本地通过 `SPRINGDOC_ENABLED=true` 开启；`application-prod.yaml` 继续关闭；
- 前端树选择器崩溃、角色下拉为空、编辑弹窗串数据、删除确认、状态开关回滚、分页/选择生命周期、防抖、重复提交、mock 墓碑/组织删除等问题；
- 树构建收敛为 `buildTree` / `buildChildrenTree`；三个选择器和 Mock 菜单复用同一装配逻辑；`TreeSelect` 只接收归一化节点，移除 `fieldNames` 二次映射；参考数据加载收敛为 `useReferenceData`；
- 前端访问判断收敛为 `createAccess` / `useAccess`；layout、ActionAuth、sidebar、MenuRedirect 共用 `canView` / `canAct` / `visibleMenuTree` / `firstVisibleLeaf`；
- 后端有效权限收敛为 `EffectivePermissions`；Spring authorities 与 `/auth/user-info` 同源；新增 `@PreAuthorize` 与 `permissions.json` 的覆盖测试，路径改名会在 CI 失败；
- 操作日志收敛为 `OperationLogRecorder` + `OperationLogPolicy`；写入和查询共用一份列定义；请求体通过显式 `OperationLogContext` 传递；脱敏、截断、敏感路径和 IP 解析可单测；
- 用户/角色/组织/权限四个列表页的生命周期收敛为 `useResourcePage`；选择、删除、状态写入、页码夹紧和刷新契约只维护一处；状态筛选收敛为 `StatusFilter`；
- 用户编辑禁止改用户名，新增用户必须选择组织，用户列表显示禁用组织名称；
- 禁用父组织/权限前要求先禁用子节点；组织/权限文本筛选返回祖先，保持树层级；权限列表支持按类型筛选；
- 权限树取消父节点级联选择；停用/动作节点标记为不可选，已选中的停用项仍可移除；角色下拉标记停用角色，组织/权限下拉保留已选停用项；
- 重置密码/停用增加二次确认；禁止删除或停用当前登录账号；删除后页码夹紧，删除确认显示名称；
- 组织/权限查询允许空串筛选，组织列表不再因为 `id=` 返回 400；
- 权限身份唯一性下沉为两个部分唯一索引；`type`/`path` 改为 `NOT NULL`，空白 `action` 归一化为 `NULL`；删除状态/类型 CHECK 中不会命中的 `IS NULL` 分支（ADR 0004）；
- 移除前端 `/swagger` 静态页和 `swagger-ui-react` 依赖；
- lint 清零；移除 `src` 内残留构建产物；菜单文案和 `StatusSwitch` 常量收敛。

仍存在：无未决事项；相关取舍见 §4。

---

## 2. 中低优先级工程债（已收口）

### 2.1 前端数据层

- [x] `setParams` 已改为函数式更新；`useResourceList` 暴露显式 `refetch`，错误态可重试。
- [x] DTO、页面和 Mock 的状态类型已收敛到 `src/lib/status.ts` 的 `Status` 常量和类型。
- [x] 不引入 TanStack Query，继续使用 `useResourceList`；现有封装已覆盖取消、竞态、重试和错误态，见 §4。
- [x] `SidebarGroupLabel` 和 `MenuRedirect` 的文案已走 i18n。

### 2.2 UI 与可访问性

- [x] 树选择器已补复选框/单选框/展开按钮/筛选框的 `aria-label` 与 `aria-expanded`。
- [x] 用户/角色列表默认按创建时间倒序，新增后回到第 1 页即可看到新行。
- [x] 组织/权限树新增后不自动跳页，接受当前行为，见 §4。
- [x] 仍保留原生元素的位置：文件选择 `<input type="file">`、拖拽排序手柄、`InputNumber`/`Mentions` 的底层输入。这些是组件库约束，不是待替换项。
- [x] 英文界面下菜单和面包屑显示数据库中文名，这是已确认的取舍；如果未来要恢复英文菜单，需要给 `sys_permission` 增加多语言字段或翻译表。

---

## 3. 依赖升级

已决定暂缓，等上游兼容后再分项迁移，见 §4：

- TypeScript 7：被 `typescript-eslint` 阻塞。
- TanStack Table 9：表格 API 重写。
- recharts 3：类型和示例页不兼容。
- react-resizable-panels 4：组件导出重命名。

---

## 4. 已接受的设计取舍

以下不是待办，除非重新打开决策：

- 动态路由、数据级权限不在当前权限模型内。
- 不引入 Flyway，继续直接维护 `database/postgres/ddl.sql`、`dml.sql`；已有数据库需手工同步差异。
- 菜单标题使用数据库 `name`；英文界面显示中文菜单名。
- 组织/权限的编码同时承担身份和同级顺序，创建后不可变；不支持运行时重排，调整顺序需删除重建并重新授权（ADR 0003）。
- 角色切换是 UI 视角过滤，后端 authority 始终是所有角色的并集。
- 菜单增删改在前端下次刷新后生效，不做实时推送。
- Cesium 使用本地自托管资源，不依赖外部 CDN。
- 文件选择、拖拽手柄等保留原生元素。
- 保留全部 3D/地图演示页，接受约 34 MB 的 `dist` 体积；页面已路由懒加载，不阻塞首屏。
- 组织/权限树新增节点后不自动跳页；用户/角色列表已用创建时间倒序保证新增行在第 1 页可见。
- 依赖大版本升级（TypeScript 7、TanStack Table 9、recharts 3、react-resizable-panels 4）统一暂缓，等上游兼容后分项迁移。
- 不引入 TanStack Query，继续使用 `useResourceList`。

---

## 5. 建议处理顺序

### P0：安全与可运维（已完成）

1. [x] 移出演示 RSA 私钥，补密钥轮换说明和 `.env.example`。
2. [x] CI 增加后端编译 + 安全测试；Testcontainers 在 GitHub Docker 环境运行。
3. [x] 角色删除策略：只检查用户引用，删除时清理角色权限关联。

### P1：API 契约

4. [x] `/api/v1` + 认证接口分组 + 查询参数收敛。
5. [x] OpenAPI 生成前端类型，替换手写 DTO。
6. [x] 操作日志 traceId/变更内容/保留策略；前端时区格式化。

### P2：工程质量（已收口）

7. [x] 构建体积：保留 3D/地图演示页，接受当前体积。
8. [x] `status` 常量已收敛；树选择器可访问性已补；新增行定位按 §4 接受现状。
9. [x] 不引入 TanStack Query，继续使用 `useResourceList`。

### P3：依赖升级（已暂缓）

10. TypeScript 7、TanStack Table 9、recharts 3、react-resizable-panels 4 等上游兼容后分项迁移。

---

## 6. 关键文件索引

| 模块 | 文件 |
|---|---|
| Agent 约定 | `AGENTS.md`、`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` |
| 领域词汇 | `CONTEXT.md` |
| 权限身份 ADR | `docs/adr/0001-path-as-permission-identity.md` |
| 菜单树 ADR | `docs/adr/0002-backend-menu-tree.md` |
| 业务编码 ADR | `docs/adr/0003-code-as-tree-order.md` |
| 校验分层 ADR | `docs/adr/0004-validation-layering.md` |
| 系统管理审计 | `docs/audits/system-management-2026-11-01.md` |
| 校验规则总览 | `docs/validation-rules.md` |
| 前端请求封装 | `frontend/react/src/lib/axios.ts` |
| 前端 API 层 | `frontend/react/src/api/` |
| OpenAPI 快照/生成类型 | `contracts/openapi.json`、`frontend/react/src/api/schema.d.ts` |
| 操作日志 | `OperationLogInterceptor.java`、`OperationLogController.java`、`src/pages/system/operation-log/` |
| 前端认证 | `frontend/react/src/auth/` |
| 前端用户状态 | `frontend/react/src/store/user.ts` |
| 前端菜单状态 | `frontend/react/src/store/menu.ts` |
| 前端路由 | `frontend/react/src/App.tsx`、`src/lib/page-routes.ts` |
| 前端菜单渲染 | `src/components/menu-redirect.tsx`、`src/components/sidebar-menutree.tsx`、`src/config/menu-icons.ts` |
| 系统列表模块 | `frontend/react/src/components/system/resource-list/` |
| 权限目录 | `frontend/react/src/config/permissions.json` |
| 权限种子生成 | `scripts/sync-permission-seed.mjs` |
| 前端测试 | `frontend/react/src/config/permissions.test.ts` 等 |
| 后端安全配置 | `backend/springboot/src/main/java/com/orange/security/SecurityConfig.java` |
| 后端安全属性 | `backend/springboot/src/main/java/com/orange/security/config/JwtProperties.java`、`AuthProperties.java`、`CorsProperties.java` |
| 后端 JWT | `backend/springboot/src/main/java/com/orange/security/jwt/JwtUtil.java`、`JwtClaims.java`、`JwtRequestFilter.java` |
| 后端认证服务 | `backend/springboot/src/main/java/com/orange/security/auth/JwtUserDetailsService.java`、`LoginAttemptService.java`、`TokenBlacklistService.java` |
| 后端 authority | `backend/springboot/src/main/java/com/orange/security/auth/PermissionAuthorityBuilder.java` |
| 后端授权守卫 | `backend/springboot/src/main/java/com/orange/security/auth/GrantGuard.java` |
| 后端查询工具 | `backend/springboot/src/main/java/com/orange/util/QueryUtils.java` |
| 生产配置 | `backend/springboot/src/main/resources/application-prod.yaml` |
| JWT 密钥说明 | `docs/security/jwt-keys.md`、`scripts/generate-jwt-keys.mjs` |
| 环境变量示例 | `.env.example` |
| 删除确认弹窗 | `frontend/react/src/components/system/confirm-delete-dialog.tsx` |
| 后端 401/403 输出 | `backend/springboot/src/main/java/com/orange/security/SecurityResponseWriter.java` |
| 后端登录 | `backend/springboot/src/main/java/com/orange/controller/login/LoginController.java` |
| 后端菜单 | `backend/springboot/src/main/java/com/orange/controller/login/MenuController.java`、`service/system/impl/MenuServiceImpl.java` |
| 后端全局异常 | `backend/springboot/src/main/java/com/orange/controller/GlobalExceptionHandler.java` |
| 后端安全测试 | `backend/springboot/src/test/java/com/orange/security/` |
| 数据库 DDL | `database/postgres/ddl.sql` |
| 数据库 DML | `database/postgres/dml.sql` |
| CI | `.github/workflows/main.yml` |

---

## 7. 说明

- 本报告基于当前工作区代码，核心流程已用本地 PostgreSQL + Spring Boot 联调验证。
- 数据库结构、种子与权限数据统一维护在 `database/postgres/ddl.sql`、`dml.sql`，不再单独保留迁移文件；已有数据库需按 DDL/DML 差异手工同步。
- 当前登出会递增 `tokenVersion`，因此会注销该用户的所有会话。
- 已有数据库需要手工补操作日志字段和索引：

```sql
ALTER TABLE public.sys_operation_log ADD COLUMN IF NOT EXISTS trace_id varchar(64);
ALTER TABLE public.sys_operation_log ADD COLUMN IF NOT EXISTS request_body text;
CREATE INDEX IF NOT EXISTS idx_sys_operation_log_trace ON public.sys_operation_log(trace_id);
CREATE INDEX IF NOT EXISTS idx_sys_operation_log_username ON public.sys_operation_log(username);
```

- 已有数据库在增加权限身份约束前，先归一化数据并检查重复：

```sql
-- 1. 空白 action 统一为 NULL；按实际数据修正缺失的 type/path
UPDATE public.sys_permission
SET action = NULL
WHERE action IS NOT NULL AND btrim(action) = '';

SELECT id FROM public.sys_permission WHERE type IS NULL OR btrim(path) = '';

-- 2. 重复身份必须先处理，否则唯一索引会失败
SELECT type, path, action, count(*)
FROM public.sys_permission
GROUP BY type, path, action
HAVING count(*) > 1;

-- 3. 替换旧约束
ALTER TABLE public.sys_permission
  DROP CONSTRAINT IF EXISTS ck_sys_permission_status,
  DROP CONSTRAINT IF EXISTS ck_sys_permission_type,
  DROP CONSTRAINT IF EXISTS ck_sys_permission_action_shape;

ALTER TABLE public.sys_permission
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN path SET NOT NULL;

ALTER TABLE public.sys_permission
  ADD CONSTRAINT ck_sys_permission_status CHECK (status IN ('0', '1')),
  ADD CONSTRAINT ck_sys_permission_type CHECK (type IN ('menu', 'action', 'directory')),
  ADD CONSTRAINT ck_sys_permission_path CHECK (btrim(path) <> ''),
  ADD CONSTRAINT ck_sys_permission_action_shape CHECK (
    (type = 'action' AND action IS NOT NULL AND btrim(action) <> '')
    OR (type IN ('menu', 'directory') AND action IS NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_sys_permission_identity_action
  ON public.sys_permission(type, path, action) WHERE action IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sys_permission_identity_no_action
  ON public.sys_permission(type, path) WHERE action IS NULL;
```

- 组织和角色的 `status` CHECK 只是去掉了永远不会命中的 `IS NULL` 分支，行为不变，已有数据库无需同步。
- 校验分层与唯一性决策见 `docs/adr/0004-validation-layering.md`。

- `README.zh-CN.md` 的未提交修改属于用户原有工作，未做改动。
- `AGENTS.md` 和 `docs/agents/*` 是本次 agent 技能 setup 新增的未提交文件。
