# 三套前端共享的架构

本页解释 React、Vue、Angular 三套 SPA 为什么这样分层、哪些东西共享、哪些必须各写一遍；适合要同时改三端或评审架构的人。

## 一个产品，三个独立构建

| 维度 | React | Vue | Angular |
| --- | --- | --- | --- |
| 框架 | React 19 + Vite 8 | Vue 3.5 + Vite 8 | Angular 21.2 |
| 入口 | `src/main.tsx` → `src/App.tsx` | `src/main.ts` → `src/App.vue` | `src/main.ts` → `app.config.ts` |
| 路由 | React Router 8，`HashRouter` | Vue Router 4，`createWebHistory` | Angular Router，`provideRouter` |
| 状态 | Zustand | Pinia | signals + injectable service |
| API | Axios 实例 | Axios 实例 | `HttpClient` + 拦截器 |
| UI 库 | shadcn 组件 + Base UI | Vuetify 3 | Angular Material 3 |
| i18n | react-intl | vue-i18n | `I18nService` 字典 |
| mock | MSW | Axios adapter | HTTP 拦截器 |
| 单测 | Vitest | Vitest | `ng test`（Vitest builder） |

三个 `package.json` 各自维护依赖与脚本，没有 workspace 级的共享包。共享的是事实与约定，不是运行时代码。

## 目录分层

| 层 | React | Vue | Angular |
| --- | --- | --- | --- |
| 页面 | `src/pages/**/index.tsx` | `src/views/**/*.vue` | `src/app/pages/**/*.component.ts` |
| 布局 | `src/layout.tsx`、`src/components/app-sidebar.tsx` | `src/layouts/AppLayout.vue` | `src/app/layout/shell.component.ts` |
| 路由 | `src/App.tsx` + `src/lib/page-routes.ts` | `src/router/index.ts` | `src/app/app.routes.ts` |
| 访问模型 | `src/lib/access.ts`、`src/store/access.ts` | `src/lib/access.ts`、`src/composables/useAccess.ts` | `src/app/core/access.ts`、`AuthService` |
| API | `src/api`、`src/lib/axios.ts` | `src/api` | `src/app/core/api.service.ts`、`system-api.service.ts` |
| 鉴权 | `src/auth` | `src/auth` | `src/app/core/auth.service.ts`、`token.store.ts` |
| 状态 | `src/store` | `src/stores` | signals 在 service 内 |
| i18n | `src/locale` | `src/i18n` | `src/app/core/i18n.service.ts` |
| 样式 | `src/index.css`、`src/themes` | `src/styles` + Vuetify theme | `src/styles.scss` |
| mock | `src/mock` | `src/mock` | `src/app/mock` |

## API 层与契约

三端都调用 `contracts/openapi.json` 描述的 `/api/v1` 接口，并解包 `{ code, message, data, timestamp, traceId }`。分页统一是 `{ total, list, page, size, totalPages }`。

- React 用 `pnpm gen:api` 把契约生成到 `src/api/schema.d.ts`，`src/api/system/*.ts` 在生成的 `components["schemas"][...]` 上组合业务类型，再调 Axios。
- Vue 没有生成步骤，`src/api/types.ts` 手写 envelope、分页与实体类型，`src/api/*.ts` 直接返回 `response.data.data`。
- Angular 在 `core/models.ts` 手写镜像类型，`ApiService` 泛型解包，`system-api.service.ts` 按资源分组；URL 前缀由 `auth.interceptor.ts` 用 `environment.apiBase` 拼接。

请求头一致：`Authorization: Bearer <access token>` 与 `Locale: zh|en`。access token 只放内存；页面刷新靠 HttpOnly refresh Cookie，401 时单飞刷新并重试一次。三端都在 fetch/axios 层统一处理 `40302`（强制改密）与其他 403。

契约变更时三端都要跟；只有 React 有生成器，Vue/Angular 的类型漂移靠 review 和构建发现。端点清单以 [API 参考](../reference/api.md) 为准。

## 权限与守卫

三套实现共享同一套访问语义，代码各自一份：

| 能力 | 含义 |
| --- | --- |
| `canView(path)` | 菜单权限精确匹配，或目录权限按路径前缀覆盖 |
| `canAct(path, action)` | 同一 Page Path 上存在对应动作权限 |
| `visibleMenuTree(nodes)` | 容器节点在至少一个子节点可见时可见 |
| `firstVisibleLeaf(nodes)` | 根路径与容器路径的默认落点 |

守卫落点不同：

- React 没有逐路由守卫。`layout.tsx` 在渲染 `<Outlet />` 前用 `access.canView` 判断，失败 `<Navigate to="/forbidden">`；根路径和 `containerPaths` 交给 `MenuRedirect`。
- Vue 在 `router.beforeEach` 里依次检查 public 路由、token、`fetchUser`、菜单加载、`canView`；失败跳 `/forbidden` 并带 `from`。
- Angular 在 Shell 上挂 `authGuard` 与 `identityGuard`，每个页面路由由 `page()` 挂 `permissionGuard`，守卫读 `data.path`。

角色切换在三端都是 UI 视图过滤：把 `userPermissions` 与所选角色的 `rolePermissions` 合并后重算菜单与动作按钮，从不改变后端 Authority。切换到不含当前路径的角色时，落到 `firstVisibleLeaf` 或 `/forbidden`。模型细节见 [权限模型](../reference/permission-model.md) 与 [ADR 0001](../adr/0001-path-as-permission-identity.md)。

## 菜单与标题

菜单树由后端 `GET /api/v1/auth/menus` 返回，前端只负责渲染、图标与可见性。三端都不从菜单树生成路由；路由是代码里的页面集合。

标题策略有实际差异：

- React 把 Page Path 转成 `menu.system.user` 这样的 key，用 react-intl 翻译，后端 `name` 作为 `defaultMessage` 兜底。
- Vue 与 Angular 从共享权限目录按 Page Path 取 `name.zh` / `name.en`，找不到时用后端名称。React/Vue 的目录由 `database/permissions.json` 同步生成，Angular 是手写镜像。

因此新增菜单时，React 要补 locale 的 `menu.*`，Vue 依赖同步后的 catalog，Angular 必须手动改 `permission-catalog.ts`。这也是三端最容易漂移的一处。

## i18n

页面正文都由各栈的 i18n 文件提供：React 是 `src/locale/{zh-CN,en-US}.ts`，Vue 是 `src/i18n/{zh-CN,en-US}.ts`，Angular 是 `i18n.service.ts` 里的 `EN` / `ZH` 常量。语言存 `localStorage` 的 `locale`，同时写 `document.documentElement.lang`，请求带 `Locale` 头。

后端返回的业务数据与错误消息不翻译；菜单名称按上一节的策略处理。演示页的部分图表标题保留库名或英文，这是移植时的已知偏差。

## 主题与组件库

- React 用 CSS 变量 + Tailwind 语义类，`<html class="dark">` 与 `theme-<color>` 切换；7 套配色文件在 `src/themes`。
- Vue 用 Vuetify 的 `light` / `dark` 主题对象，主色、表面色、边框色在 `src/main.ts` 的 `themes` 中定义，配色切换直接改 `theme.themes.value`。
- Angular 用 CSS 变量 + Material system token，`html.dark` 切换；`styles.scss` 把 `--app-*` 映射到 `--mat-sys-*`。

三套的默认主色都是中性色（浅色 `#18181b`、深色 `#fafafa`），橙色只是品牌色与可选配色之一。组件库选择因此不同：React 要的是可改源码的 shadcn/Base UI，Vue 要开箱即用的 Vuetify 组件与主题系统，Angular 要 Material/CDK 的无障碍与表单集成。token 映射见 [设计系统](./design-system.md)。

## 为什么三套不许共用代码

1. 运行时与编译模型不同：React 的 JSX、Vue 的 SFC、Angular 的装饰器与模板编译无法共享组件实现。
2. UI 原语不同：shadcn、Vuetify、Material 的 DOM、主题变量、表单与浮层行为都不一样，共享层只能抽到最薄的工具函数。
3. 状态与路由模型不同：Zustand、Pinia、signals 的订阅方式与守卫时机不同，强行抽象会把三端都锁进最低公分母。
4. 构建与升级耦合：共享包会把三套 Vite/Angular 版本绑在一起，单栈升级要同时改三端。

共享的是可验证的事实：OpenAPI 契约、`database/permissions.json` 权限目录、设计 token、E2E 与截图对齐脚本。代价是同一页面要写三遍；缓解手段是 `scripts/e2e/*` 的行为回归与 `scripts/e2e/parity.mjs` 的视觉 diff，而不是共享组件。移植规则与允许的偏差见 [移植与偏差](../explanation/porting-and-deviations.md)。

## 相关阅读

- 第一次在 React 加页面：[用 React 新增一个受权限保护的页面](./your-first-page.md)
- 三栈页面映射：[在 Vue 与 Angular 里新增同一个页面](./add-a-page.md)
- mock 与真实后端：[在 mock 与真实后端之间切换](./connect-api-and-mocks.md)
- 后端菜单树决策：[ADR 0002](../adr/0002-backend-menu-tree.md)

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/package.json、frontend/vue/package.json、frontend/angular/package.json、frontend/react/src/App.tsx、frontend/react/src/layout.tsx、frontend/react/src/lib/page-routes.ts、frontend/react/src/lib/access.ts、frontend/react/src/lib/menu.ts、frontend/vue/src/router/index.ts、frontend/vue/src/lib/menu-title.ts、frontend/angular/src/app/app.routes.ts、frontend/angular/src/app/core/guards.ts、frontend/angular/src/app/core/menu-labels.ts、frontend/angular/src/app/core/permission-catalog.ts、frontend/angular/src/styles.scss、frontend/vue/src/main.ts、frontend/react/src/store/theme.ts、docs/adr/0001-path-as-permission-identity.md、docs/adr/0002-backend-menu-tree.md
