[English](README.md) | 简体中文

# 前端

三套单页应用——React、Vue、Angular——针对同一份 HTTP 契约实现同一个管理后台。
它们共享事实与约定，但不共享运行时代码：每套栈各自维护 `package.json`、构建流程与
组件库。请选择要改的栈：[React](react/README.zh-CN.md)（行为与视觉基线）、
[Vue](vue/README.zh-CN.md)、[Angular](angular/README.zh-CN.md)。

## 三栈边界

| 关注点 | React | Vue | Angular |
| --- | --- | --- | --- |
| 入口 | `src/main.tsx` → `App.tsx` | `src/main.ts` → `App.vue` | `src/main.ts` → `app.config.ts` |
| 路由 | React Router 8，`HashRouter` | Vue Router 4，`createWebHistory` | `provideRouter` |
| 状态 | Zustand | Pinia | signals + 可注入 service |
| API | Axios 实例 | Axios 实例 | `HttpClient` + 拦截器 |
| Mock | MSW | Axios adapter | HTTP 拦截器 |
| 单测 | Vitest | Vitest | `ng test`（Vitest builder） |

页面分别位于 `src/pages/**/index.tsx`（React）、`src/views/**/*.vue`（Vue）与
`src/app/pages/**/*.component.ts`（Angular）。布局、路由表、访问控制、鉴权 store、
语言文件与 mock handler 在三套栈中遵循同样的分层。

共享的是可验证的事实，不是可执行代码：OpenAPI 契约
（[../contracts/openapi.json](../contracts/openapi.json)）、权限目录与种子数据
（[../database/](../database/)）、跨栈检查脚本（[../scripts/](../scripts/)）。
仓库刻意不设 workspace 共享包：JSX、SFC 与 Angular 模板无法共用组件实现，共享层
还会把三套 Vite/Angular 版本绑在一起。

## 路由与权限可见性

路由是代码里的页面集合，菜单树则由 `GET /api/v1/auth/menus` 返回。前端只负责渲染、
图标与可见性，绝不用菜单树生成路由。Page Path 就是权限身份：`/system/user` 既是一条
路由，也是它所需的权限节点。

| 能力 | 含义 |
| --- | --- |
| `canView(path)` | 菜单权限精确匹配，或目录权限按路径前缀覆盖 |
| `canAct(path, action)` | 同一 Page Path 上存在对应动作权限 |
| `visibleMenuTree(nodes)` | 至少一个子节点可见时，容器节点才可见 |
| `firstVisibleLeaf(nodes)` | 根路径与容器路径的默认落点 |

守卫落在各栈路由器提供的位置：

- React 没有逐路由守卫。`layout.tsx` 在渲染 `<Outlet />` 前调用 `access.canView`，
  失败则跳 `/forbidden`；`/` 与容器路径交给 `MenuRedirect`。
- Vue 在 `router.beforeEach` 中依次检查公开路由、token、用户、菜单与 `canView`，
  不通过时跳 `/forbidden`。
- Angular 在 Shell 上挂 `authGuard`、`identityGuard`，每条 `page()` 路由挂
  `permissionGuard`。

菜单标题统一来自 `GET /api/v1/auth/menus`：后端在 `sys_permission` 里保存 `name` 与
`name_en`，按 `Locale` 请求头返回对应语言，前端不再维护菜单标题目录。只有图标仍在
本地按路径映射，因为权限表没有图标列。

角色切换只是前端视图过滤：把用户权限与所选角色的权限合并后重算菜单和操作按钮，
从不改变后端 Authority。切到不含当前路径的角色时，落到 `firstVisibleLeaf` 或
`/forbidden`。

## API 与 mock 切换

三套栈都调用 `/api/v1`，发送 `Authorization: Bearer <access token>` 与
`Locale: zh|en`，并解包 `{ code, message, data, timestamp, traceId }`。分页统一为
`{ total, list, page, size, totalPages }`。access token 只放内存；页面刷新依赖
HttpOnly refresh Cookie；401 时只做一次单飞刷新并重试一次。`40302`（强制改密）与
其他 403 都在 fetch/axios 层统一处理。

| 栈 | 开关文件 | mock 开 | 真实后端 |
| --- | --- | --- | --- |
| React | `.env.development.local` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` |
| Vue | `.env.development.local` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` |
| Angular | `src/environments/environment.local.ts` | `mock: true` | `mock: false` |

Vite 的加载顺序是 `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`，
后者覆盖前者，进程环境变量优先级最高。因此 `.env.<mode>` 会覆盖 `.env.local`：
开发模式下关 mock 要写在 `.env.development.local`，或直接传进程环境变量。
React 与 Vue 的 `.env.development` 默认开启 mock，所以 `pnpm dev` 不依赖后端。

Angular 没有 `.env`。`pnpm start` 固定执行 `ng serve --configuration local`，换上
`environment.local.ts`（`apiBase: '/api/v1'`、`mock: false`），并通过
`proxy.conf.json` 把 `/api` 代理到 `http://127.0.0.1:8080`。

改开关后必须重启 dev server：Vite 只在启动时求值 `import.meta.env`，Angular 同理
应用 `fileReplacements`。临时切换可把变量传给进程，例如
`VITE_MOCK_ENABLE=false pnpm dev`。

三套 mock 实现不同：React 用 MSW 与 `public/mockServiceWorker.js`，Vue 替换 Axios
adapter 并加载种子数据，Angular 在 HTTP 拦截器里返回内存响应。mock 适合改 UI、
样式、i18n、路由与截图；不要用它验证 refresh Cookie 轮换、CORS、登录锁定、字段
校验或后端授权。

开发时前端把 `/api` 代理到后端，浏览器看到同源请求，refresh Cookie 才能携带。
默认目标是 `http://127.0.0.1:8080`（Spring Boot）；后端换端口时改代理目标，而不是
改源码里的 API 前缀。`localhost` 与 `127.0.0.1` 是不同 Origin，Cookie 不共享，
优先统一用 `127.0.0.1`。代理只在 dev server 生效；生产构建需要同源部署或后端
显式开启 CORS。

## 设计系统

React 在 `src/index.css` 定义默认中性 token；Vue 在 Vuetify theme 中复用同一组
值；Angular 在 `styles.scss` 把 `--app-*` 映射到 `--mat-sys-*`。

| Token | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | `#0a0a0a` | 页面底色 |
| `--foreground` | `#18181b` | `#fafafa` | 主文字 |
| `--primary` | `#18181b` | `#fafafa` | 主按钮、选中态 |
| `--muted` / `--secondary` | `#f4f4f5` | `#27272a` | 次级表面 |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | 次要文字 |
| `--border` / `--input` | `#e4e4e7` | `#3f3f46` | 边框、输入框 |
| `--destructive` | `#ef4444` | 深红 | 删除、错误 |
| `--sidebar` | `#fafafa` | `#18181b` | 侧边栏 |

默认主色是中性色：浅色 `#18181b`、深色 `#fafafa`。橙色只是品牌色，也是七套可选
配色之一（`blue`、`green`、`orange`、`red`、`rose`、`violet`、`yellow`）。选中非
默认配色时 `<html>` 加 `theme-<color>`；React/Angular 用 `html.dark` 切深色，Vue
调用 `theme.change('dark')`。三套都默认深色，只有显式存过 `light` 才用浅色。持久化
key 分别是 `theme-mode`/`theme-color`、`orange.theme`/`orange.color` 与
`orange.angular.theme`/`orange.angular.color`。

尺寸以代码为准，不沿用已废弃的样式指南：

| 项 | 值 |
| --- | --- |
| 顶栏 | `4rem`（`h-16`、`--orange-header-height`、`--app-header-height`） |
| 侧边栏 | `16rem`；收起 `3rem`；移动端 `18rem` |
| 页面内边距 / 内容间距 | `0.75rem` / `1rem` |
| 圆角 | 默认 `0.625rem`，配色主题 `0.65rem` |
| 表格行 / 按钮 | `2.5rem` / `2.25rem` |

字体使用系统 UI 栈，不加载 Web Font。Vue/Angular 的页面标题为
`1.25rem/1.75rem/700`（`.orange-title`），正文为 `1rem/1.75rem/400`。

只使用语义类：`bg-background`、`text-foreground`、`text-muted-foreground`、
`border-border`、`rounded-lg`，或 Vuetify/Material 的等价写法。它们会自动跟随
深浅色与七套配色，不要写死 `#fff` 或 `gray-100`。

## 加页面的最短路径

1. 新建页面文件：`src/pages/reports/sales/index.tsx`（React，路由由
   `import.meta.glob` 自动收集），或视图加 `src/router/index.ts` 子路由（Vue），
   或组件加 `page()` 与 `container()`（Angular）。
2. 在 [../database/permissions.json](../database/permissions.json) 加入目录、菜单与
   动作节点，并授权给角色。权限编码根级 4 位，每深一层追加 2 位，同级顺序由编码
   决定。
3. 在仓库根目录执行 `pnpm run permissions:sync`：它会给七个
   `database/*/dml.sql` 重新生成种子区块，并更新 React/Vue 的 mock 目录；Angular 的
   `core/permission-catalog.ts` 只服务 mock，需要手改。
4. 补页面级翻译（React 的 `page.reports.sales.*`、Vue 的页面 key、Angular 的
   `i18n.service.ts`）。菜单标题不在前端翻译：在权限种子里填 `name` 与 `name_en`。
5. 用设计 token 写样式，操作按钮包进 `ActionAuth`（React/Vue）或调用
   `auth.canAct(path, 'add')`（Angular）。
6. 跑该栈的单测与类型检查，再分别用 `super` 账号和缺少该权限的角色验证页面。

目录权限只影响菜单可见性，不授予接口调用权。动作权限必须匹配同一 Page Path 与
action 名，最终仍由后端 Authority 拒绝越权请求。

## 测试

| 栈 | 命令 |
| --- | --- |
| React | `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` |
| Vue | `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` |
| Angular | `pnpm test`、`pnpm run build`、`pnpm run lint` |

React 的 `pnpm test` 会双向校验页面与菜单权限，并检查
`database/postgres/dml.sql` 里的生成区块。`pnpm gen:api` 从契约重新生成
`src/api/schema.d.ts`；Vue 与 Angular 手写 envelope 类型，契约变更靠 review 与
构建发现。

本仓库没有自动化的端到端套件；各前端的测试命令覆盖单元与组件行为，
[../scripts/](../scripts/) 里是跨栈检查脚本。

产品层面的说明见[仓库 README](../README.zh-CN.md)。
