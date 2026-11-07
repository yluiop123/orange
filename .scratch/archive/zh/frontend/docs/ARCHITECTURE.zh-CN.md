> [English](./ARCHITECTURE.md) | 简体中文

# 前端架构

## 形态

三个独立 SPA 实现同一个产品。它们共享 HTTP 契约、菜单数据和视觉语言，但不共享代码。
一个页面的改动只有在 React、Vue、Angular 三端一致后才算完成。

```text
frontend/
  react/     React 19 + Vite + Tailwind + shadcn/Base UI + Zustand
  vue/       Vue 3.5 + Vite + Vuetify 3 + Pinia
  angular/   Angular 21 + Angular Material + signals
  docs/      本文档
```

## 分层

| 层 | React | Vue | Angular |
| --- | --- | --- | --- |
| 外壳 | `src/App.tsx`、布局组件 | `src/layouts/AppLayout.vue` | `src/app/layout/shell.component.ts` |
| 路由 | React Router 8，`HashRouter` | Vue Router 4，`createWebHistory` | Angular Router，`provideRouter` |
| 状态 | Zustand（`src/store`） | Pinia（`src/stores`） | signals + 可注入服务 |
| API 客户端 | Axios（`src/lib/axios.ts`） | Axios（`src/api`） | `HttpClient` + 拦截器 |
| 国际化 | react-intl（`src/locale`） | vue-i18n（`src/i18n`） | `I18nService`（`src/app/core`） |
| 主题 | CSS 变量 + `data-theme` | Vuetify 主题 + CSS 变量 | CSS 变量 + Material token |
| 组件库 | shadcn/Base UI | Vuetify | Angular Material |
| 测试 | Vitest | Vitest | Angular builder + Vitest |

路由、菜单、主题变量和页签样式的框架无关规则见
[STYLE-GUIDE.zh-CN.md](./STYLE-GUIDE.zh-CN.md)。页面内容以 React 为基准移植，
同一个菜单项不要自行设计不同布局。

## 外壳

每个应用渲染相同的外壳：

1. 登录页（左右分栏 + 品牌区，顶部语言与主题控件）。
2. 侧栏，菜单树来自 `GET /auth/menus`。
3. 顶栏：面包屑、折叠按钮、语言切换、主题切换。
4. 内容区：页面容器；有页签的页面使用分段式页签列表。

侧栏固定，内容区负责滚动。菜单文案、图标、顺序和可见性来自后端响应，前端只负责渲染。
访问过滤必须与 React 规则一致：

- 路径在用户授权路径内时菜单可见。
- 至少一个子菜单可见时父菜单可见。
- 切换到没有当前路径权限的角色时，跳转到第一个可见页面。

## 会话与 API

- Access token 只保存在内存中，不写入 `localStorage`。
- Refresh token 是 HttpOnly cookie，作用域限制在 API 认证路径。
- 单个 single-flight refresh 处理并发 `401`，只轮换一次 token。
- `40302`（需要修改初始密码）打开不可关闭的对话框；其他 `403` 展示服务端消息，
  同时仍然拒绝该请求。
- 所有请求携带 `Locale: zh|en`；后端回传 `traceId`。

## Mock 与真实模式

| 应用 | Mock 开关 | 实现 |
| --- | --- | --- |
| React | `VITE_MOCK_ENABLE` | MSW worker（`src/mock`） |
| Vue | `VITE_MOCK_ENABLE` | 浏览器内演示适配器 |
| Angular | `ANGULAR_MOCK_ENABLE` 或 `?mock=1` | 浏览器内演示适配器 |

Mock 覆盖登录、刷新、菜单、CRUD、操作日志和主要错误码。真实模式使用 Vite/Angular
代理，让 refresh cookie 保持同源。

## 视觉一致性

- 默认主色为中性色（浅色 `#18181b`，深色 `#fafafa`）；品牌橙只用于登录 logo 等
  品牌元素。
- 分段页签容器高 32px，胶囊高 25px，内边距 3px，容器圆角 10px，胶囊圆角 8px。
  选中态使用与 React 实现相同的阴影和边框关系。
- 菜单、按钮、链接和选中页签跟随主色变化。
- 完整 token 与组件规则见 [STYLE-GUIDE.zh-CN.md](./STYLE-GUIDE.zh-CN.md)。

## 测试

- 单元测试覆盖访问过滤、树码策略、路径匹配和分页钳制。
- [`../../scripts/e2e`](../../scripts/e2e/README.md) 下的 Playwright 套件覆盖
  Mock/真实模式下的登录、导航、CRUD 与权限流程。
- 视觉检查对比三端同一路由的截图。
