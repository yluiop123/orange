# ORANGE 剩余问题清单

> 更新日期：2026-11-01
> 分析范围：`vite-shadcn`（前端）、`springboot`（后端）、`database`（PostgreSQL）
> 说明：本文只记录**当前仍未完成、未决定或明确接受**的事项。已完成能力压缩到 §0.2，不再逐条展开。

---

## 0. 当前状态

### 0.1 结论

项目可以正常构建和演示。认证、权限、后端菜单树、统一错误响应和安全测试已经收口；剩余问题主要集中在：

1. API 契约与版本仍未统一，前端类型仍靠手写；
2. `dist` 总体积仍偏大，前端还有 20 个 lint warning；
3. 演示 RSA 私钥被提交进仓库，`.env.example` 和演示密钥说明缺失；
4. CI 只跑前端，后端编译和安全集成测试尚未进入流水线；
5. 少量领域/运维债：角色删除策略、操作日志保留、时区展示、`setParams` 刷新方式。

### 0.2 已完成基线

- **认证**：access token 内存保存，refresh token 走 HttpOnly Cookie；refresh 轮换 + jti 黑名单；tokenVersion 吊销；数据库登录限流；首次登录强制改密；401/40302 统一 `Response` 契约；每个请求只解析一次 JWT。
- **权限**：权限身份为 `type + path + action`；禁用权限/角色不再下发 authority；应用层重复权限返回 409；角色融合、角色切换仅作为前端视角过滤。
- **菜单**：`GET /api/user/menus` 返回启用菜单树；前端删除 `routes.ts`，页面路由由文件系统自动生成；前端只保留 `path → 图标` 映射；面包屑和 `/` 默认跳转使用后端菜单树。
- **数据库**：主键、外键、索引、`sys_user.username` 唯一约束齐备；审计字段、操作日志、`timestamptz` + `OffsetDateTime` 已落地。
- **前端**：`src/api/` 服务层；`useResourceList` + `ResourceTable` 深模块；系统页优先 shadcn；403 页面和按钮级 403 对话框；请求取消/竞态处理。
- **质量**：`security` 包按 `jwt` / `auth` / `config` 拆分；`JwtProperties` / `AuthProperties` / `CorsProperties` 集中配置；11 个安全单测 + 6 个 Testcontainers 集成测试。

### 0.3 最新验证结果

| 项目 | 命令/方式 | 结果 |
|---|---|---|
| 前端类型检查 | `pnpm exec tsc -b` | 通过 |
| 前端 lint | `pnpm lint` | 0 errors / 20 warnings |
| 前端测试 | `pnpm test` | 25 passed |
| 权限种子一致性 | `pnpm db:seed:check` | 通过 |
| 前端构建 | `pnpm build` | 成功，约 11 秒 |
| 后端编译 | `mvn -DskipTests compile`（JDK 25） | 成功，88 个主源码文件 |
| 安全单测 | `mvn -Dtest=JwtUtilTest,... test` | 11 passed |
| 安全集成测试 | Testcontainers + PostgreSQL 16 + 真实 HTTP | 6 passed |
| 登录限流 | 后端联调 | 第 6 次失败返回 429 |
| refresh 轮换 | 后端联调 | 旧 refresh 重放返回 401 |
| 登出吊销 | 后端联调 | 旧 access token 返回 401 |
| 401 契约 | 后端联调/集成测试 | 401 + 40101 + traceId |
| 强制改密 | 后端联调/集成测试 | 其它接口 403 + 40302；userInfo/menus 仍可访问 |
| 菜单树 | 后端联调/集成测试 | 6 个根节点，action 不入树，顺序正确 |
| 直接访问 403 | 浏览器实测 | `user` 访问 `/system/user` 跳 `/forbidden` |
| 菜单 Mock | 浏览器实测 | mock 模式与真实后端一致 |

### 0.4 构建体积

| 指标 | 当前值 |
|---|---|
| `dist` 总体积 | 约 **35.92 MB** |
| JS 文件数 | **1017** |
| JS 总体积 | 约 **29.74 MB** |
| 入口 `index-*.js` | 约 **0.39 MB** |
| `cesium-package` | 约 **12.52 MB** |
| 最大 chunk | Babylon 约 **6.09 MB** |
| 其它大 chunk | Cesium 5.8 MB、L7 4.5 MB、Swagger 1.36 MB、AntV 1.28 MB、ECharts 1.17 MB |

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

## 1. 高优先级剩余问题

### 1.1 API 契约与版本

- [ ] 没有 `/api/v1` 版本前缀。
- [ ] 命名不统一：`/api/user/userInfo` 使用 camelCase，其它接口多为小写/复数。
- [ ] 认证接口 `/api/user/*` 与系统接口 `/api/system/*` 分组不统一。
- [ ] 部分接口直接返回 JPA 实体，部分返回 Bean/DTO。
- [ ] 查询参数仍是 `filterField/filterValue`，没有收敛为 `keyword/status/sort/groupId` 等显式参数。
- [ ] 前端 `src/api/types.ts` 仍是手写类型，可能与后端 OpenAPI 漂移。

建议：

- 统一 `/api/v1`；
- 认证接口迁到 `/api/v1/auth/*`；
- 列表查询统一为 `keyword`、`status`、`sort` 等显式参数；
- 用 `openapi-typescript` 从 `/api-docs` 生成类型，替换手写 DTO。

### 1.2 安全与运维

- [ ] **演示 RSA 私钥已提交到仓库**：`springboot/src/main/resources/keys/private_key.pem` 被 Git 跟踪。生产部署必须轮换密钥并改为外部 Secret/环境变量，仓库只保留公钥或生成脚本。
- [ ] 缺少 `.env.example`：根目录、前端、后端都没有示例环境变量文件，也没有演示密钥/生产密钥的说明。
- [ ] 生产跨站部署仍受刷新 Cookie 限制：需要同域或子域；跨站需要 `SameSite=None; Secure`，并受浏览器第三方 Cookie 策略影响。
- [ ] access token 不能单独吊销，只能靠 `tokenVersion` 吊销该用户全部会话；如需单 token 吊销，可复用 jti 黑名单。
- [ ] CI 只跑前端：`.github/workflows/main.yml` 没有 `mvn compile`、后端测试或 Testcontainers 集成测试。

建议：

1. 先把私钥从仓库移出，补密钥轮换文档和 `.env.example`；
2. CI 增加后端编译 + 安全单测；Docker 可用时再跑 Testcontainers 集成测试；
3. 如确实需要单 token 吊销，再扩展黑名单，不提前设计。

### 1.3 构建体积与 lint

- [ ] `dist` 约 35.92 MB、1017 个 JS 文件，部署产物偏大。
- [ ] 大 chunk：Babylon 6.09 MB、Cesium 5.8 MB、L7 4.5 MB、Swagger 1.36 MB、AntV 1.28 MB、ECharts 1.17 MB。
- [ ] 前端仍有 **20 个 lint warning**，主要集中在 `components/ui/*` 和演示页面。

建议：

- `/swagger` 如果只用于演示，改为外链后端 Swagger UI，移除 `swagger-ui-react`；
- 不需要的 3D/地图演示页和依赖（Babylon、L7、MapLibre、Three）可以按实际演示范围裁剪；
- 用 `pnpm analyze` 检查重复依赖和异常 chunk；
- 20 个 warning 分批清零，先处理业务代码，再处理 shadcn 源码。

### 1.4 数据与领域

- [ ] 删除仍有权限或用户引用的角色返回 409，必须先手动清空关联。需要明确策略：继续 409，还是删除时自动清理 `sys_role_permission` / `sys_user_role`。
- [ ] 操作日志只记录 HTTP 维度和查询参数，没有记录请求体差异。
- [ ] `sys_operation_log` 没有归档、保留期或清理任务。
- [ ] 登录/刷新链路仍可继续用缓存优化；用户列表的组织名称仍是单独一次查询。
- [ ] 前端直接展示服务端时间字符串，没有按用户时区格式化。

### 1.5 系统管理审计发现（2026-11-01）

完整报告：`docs/audits/system-management-2026-11-01.md`

最高优先级：

1. 删除父权限/父组织会级联删除整棵子树，可能清空授权或返回 500；
2. 无自删/自禁/最后管理员保护；重置超管密码可被 `user:edit` 接管；
3. 角色删除语义错误：有权限的角色永远 409；
4. 树选择器加载前/失效 id 白屏；用户表单角色下拉永远为空；编辑弹窗串上一行数据；
5. 删除无确认，树形全选跨页选中全部；
6. 不存在资源返回 200/500 而非 404；用户名/groupId 校验前后不一致；
7. 每个请求重新加载权限图；`queryUserInfo` 多集合 EntityGraph 产生笛卡尔积；
8. 筛选每次按键请求、分页不夹紧、选择生命周期不一致；
9. mock 角色鉴权与真实角色数据脱节；
10. 私钥、默认口令、Swagger 生产无鉴权等运维安全项。

建议按审计报告 §四的 A/B/C/D 批次处理：数据丢失与锁死 → 功能阻断 → 契约一致性 → 性能与可观测性。

---

## 2. 中低优先级工程债

### 2.1 前端数据层

- [ ] `setParams({ ...params })` 被用来制造新对象、触发重新取数；依赖对象身份而不是显式 `refetch` 信号，容易误用。
- [ ] `status` 仍是字符串 `"0"`/`"1"` 散落在页面、Mock 和 DTO 中，没有共享枚举/常量。
- [ ] 可以引入 TanStack Query 统一缓存、重试、失效和请求状态；当前 `useResourceList` 已能工作，属于优化项，不是必须。
- [ ] `SidebarGroupLabel` 仍硬编码 `"Menu"`，`MenuRedirect` 的 Loading 文案也仍是硬编码，未走 i18n。

### 2.2 UI 与可访问性

- [ ] 仍保留原生元素的位置：文件选择 `<input type="file">`、拖拽排序手柄、`InputNumber`/`Mentions` 的底层输入。这些是组件库约束，不是待替换项。
- [ ] 英文界面下菜单和面包屑显示数据库中文名，这是已确认的取舍；如果未来要恢复英文菜单，需要给 `sys_permission` 增加多语言字段或翻译表。

---

## 3. 依赖升级

以下升级都需要单独迁移，不建议和业务改动混在一起：

- [ ] TypeScript 7：被 `typescript-eslint` 阻塞。
- [ ] TanStack Table 9：表格 API 重写。
- [ ] recharts 3：类型和示例页不兼容。
- [ ] react-resizable-panels 4：组件导出重命名。

---

## 4. 已接受的设计取舍

以下不是待办，除非重新打开决策：

- 数据库层不加 `(type, path, action)` 唯一约束，重复由应用层检查并返回 409。
- 动态路由、数据级权限不在当前权限模型内。
- 不引入 Flyway，继续直接维护 `database/postgres/ddl.sql`、`dml.sql`；已有数据库需手工同步差异。
- 菜单标题使用数据库 `name`；英文界面显示中文菜单名。
- 角色切换是 UI 视角过滤，后端 authority 始终是所有角色的并集。
- 菜单增删改在前端下次刷新后生效，不做实时推送。
- Cesium 使用本地自托管资源，不依赖外部 CDN。
- 文件选择、拖拽手柄等保留原生元素。

---

## 5. 建议处理顺序

### P0：安全与可运维

1. 移出演示 RSA 私钥，补密钥轮换说明和 `.env.example`。
2. CI 增加后端编译 + 安全单测；Docker 可用时跑 Testcontainers。
3. 明确角色删除策略（409 还是自动清理关联）。

### P1：API 契约

4. `/api/v1` + 认证接口分组 + 查询参数收敛。
5. OpenAPI 生成前端类型，替换手写 DTO。
6. 操作日志保留策略和前端时区格式化。

### P2：工程质量

7. 降低构建体积，清理 20 个 lint warning。
8. 用显式 `refetch` 替换 `setParams({ ...params })`。
9. 收敛 `status` 常量和菜单 i18n 残留。

### P3：依赖升级

10. TypeScript 7、TanStack Table 9、recharts 3、react-resizable-panels 4 分项迁移。

---

## 6. 关键文件索引

| 模块 | 文件 |
|---|---|
| Agent 约定 | `AGENTS.md`、`docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` |
| 领域词汇 | `CONTEXT.md` |
| 权限身份 ADR | `docs/adr/0001-path-as-permission-identity.md` |
| 菜单树 ADR | `docs/adr/0002-backend-menu-tree.md` |
| 系统管理审计 | `docs/audits/system-management-2026-11-01.md` |
| 前端请求封装 | `vite-shadcn/src/lib/axios.ts` |
| 前端 API 层 | `vite-shadcn/src/api/` |
| 前端认证 | `vite-shadcn/src/auth/` |
| 前端用户状态 | `vite-shadcn/src/store/user.ts` |
| 前端菜单状态 | `vite-shadcn/src/store/menu.ts` |
| 前端路由 | `vite-shadcn/src/App.tsx`、`src/lib/page-routes.ts` |
| 前端菜单渲染 | `src/components/menu-redirect.tsx`、`src/components/sidebar-menutree.tsx`、`src/config/menu-icons.ts` |
| 系统列表模块 | `vite-shadcn/src/components/system/resource-list/` |
| 权限目录 | `vite-shadcn/src/config/permissions.json` |
| 权限种子生成 | `scripts/sync-permission-seed.mjs` |
| 前端测试 | `vite-shadcn/src/config/permissions.test.ts` 等 |
| 后端安全配置 | `springboot/src/main/java/com/orange/security/SecurityConfig.java` |
| 后端安全属性 | `springboot/src/main/java/com/orange/security/config/JwtProperties.java`、`AuthProperties.java`、`CorsProperties.java` |
| 后端 JWT | `springboot/src/main/java/com/orange/security/jwt/JwtUtil.java`、`JwtClaims.java`、`JwtRequestFilter.java` |
| 后端认证服务 | `springboot/src/main/java/com/orange/security/auth/JwtUserDetailsService.java`、`LoginAttemptService.java`、`TokenBlacklistService.java` |
| 后端 authority | `springboot/src/main/java/com/orange/security/auth/PermissionAuthorityBuilder.java` |
| 后端 401/403 输出 | `springboot/src/main/java/com/orange/security/SecurityResponseWriter.java` |
| 后端登录 | `springboot/src/main/java/com/orange/controller/login/LoginController.java` |
| 后端菜单 | `springboot/src/main/java/com/orange/controller/login/MenuController.java`、`service/system/impl/MenuServiceImpl.java` |
| 后端全局异常 | `springboot/src/main/java/com/orange/controller/GlobalExceptionHandler.java` |
| 后端安全测试 | `springboot/src/test/java/com/orange/security/` |
| 数据库 DDL | `database/postgres/ddl.sql` |
| 数据库 DML | `database/postgres/dml.sql` |
| CI | `.github/workflows/main.yml` |

---

## 7. 说明

- 本报告基于当前工作区代码，核心流程已用本地 PostgreSQL + Spring Boot 联调验证。
- 数据库结构、种子与权限数据统一维护在 `database/postgres/ddl.sql`、`dml.sql`，不再单独保留迁移文件；已有数据库需按 DDL/DML 差异手工同步。
- 当前登出会递增 `tokenVersion`，因此会注销该用户的所有会话。
- `README.zh-CN.md` 的未提交修改属于用户原有工作，未做改动。
- `AGENTS.md` 和 `docs/agents/*` 是本次 agent 技能 setup 新增的未提交文件。
