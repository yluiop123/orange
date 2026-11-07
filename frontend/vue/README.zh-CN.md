# ORANGE Vue 前端

Vue 3 + Vuetify 实现，产品范围与 React 参考实现一致；本页只列安装、命令、目录、依赖与偏差。

## 环境与安装

- Node.js（版本由 Vite 8 决定）与 pnpm；`package.json` 的 `packageManager` 为 `pnpm@12.15.0`。
- 本目录自带 `pnpm-lock.yaml`。

```bash
cd frontend/vue
pnpm install
```

`.env.development` 默认 `VITE_MOCK_ENABLE=true`，无后端也能登录；账号 `super / super`、`admin / admin`、`user / user`。`.env.local` 被 `*.local` 规则忽略。

## 命令

| 命令 | 实际执行 | 用途 |
| --- | --- | --- |
| `pnpm dev` | `vite --port 5174` | 开发服务器，固定 5174 |
| `pnpm build` | `vue-tsc -b && vite build` | 类型检查后生产构建 |
| `pnpm preview` | `vite preview --port 5174` | 预览构建产物 |
| `pnpm typecheck` | `vue-tsc -b` | 只做类型检查 |
| `pnpm test` | `vitest run` | 单测（`src/**/*.test.ts`，node 环境） |
| `pnpm test:watch` | `vitest` | 监听模式 |
| `pnpm lint` | `eslint . --max-warnings=0` | ESLint，零警告 |
| `pnpm format` | `prettier --write .` | 格式化 |

## 目录结构

```text
frontend/vue/
  src/
    api/            axios 实例、auth 与各资源请求、手写类型
    auth/           token、refresh、session hint、强制改密标记
    components/     ActionAuth、FormDialog、ResourceTable、layout/、showcase/
    composables/    useAccess、useResourcePage、usePageTitle
    config/         permissions.json（同步副本）、menu-icons.ts
    i18n/           index.ts、zh-CN.ts、en-US.ts
    layouts/        AppLayout.vue
    lib/            access、menu、menu-title、path、tree-code、validation
    mock/           axios adapter 与内存种子
    router/         路由表与全局守卫
    stores/         auth、menu、ui、pinia
    styles/         main.css、system.css
    views/          system、dashboard、chart、map、three、component、login、errors
    App.vue / main.ts
  .env / .env.development
  vite.config.ts / vitest.config.ts
```

## 本栈依赖

`package.json` 共 17 个运行时依赖、18 个开发依赖。

| 类别 | 依赖 |
| --- | --- |
| 框架与 UI | `vue`、`vuetify`、`@mdi/font` |
| 路由、状态、i18n | `vue-router`、`pinia`、`vue-i18n` |
| HTTP | `axios` |
| 图表 | `echarts`、`chart.js`、`d3` |
| 地图 | `leaflet`、`ol`、`@deck.gl/core`、`@deck.gl/layers`、`cesium` |
| 3D | `three`、`@babylonjs/core` |

Vuetify 组件全量注册在 `src/main.ts`，默认表单变体为 `outlined`、`density: comfortable`，图标集为 MDI。

## 与契约的关系

- 契约是 `contracts/openapi.json`，但本栈没有代码生成脚本；`src/api/types.ts` 手写 `Envelope`、`PageResult` 与实体类型，`src/api/*.ts` 返回 `response.data.data`。
- `src/api/http.ts` 的基地址是 `VITE_API_BASE`（默认 `/api/v1/`），统一带 `Authorization` 与 `Locale`，`withCredentials: true` 以携带 refresh Cookie。
- 401 时单飞 `POST /auth/refresh` 后重试一次；403 打开 forbidden 对话框，`40302` 打开强制改密。
- 端点与错误码见 [HTTP 契约](../../contracts/openapi.json)。

## 本栈约定与偏差

- 路由用 `createWebHistory`；页面在 `src/router/index.ts` 手工登记，容器路径 `CONTAINER_PATHS` 也是手写清单，新增容器必须同步改它。
- 全局守卫 `router.beforeEach` 检查 public 路由、token、user-info、菜单与 `canView`；动作权限由 `ActionAuth` 组件控制。
- mock 不是 MSW，而是替换 `http.defaults.adapter` 的 Axios adapter（`src/mock/index.ts` + `seed.ts`），状态在内存中。
- 菜单标题由 `src/lib/menu-title.ts` 从 `src/config/permissions.json` 按 Page Path 取中英文，缺失时回退后端名称。
- 主题是 Vuetify 的 `light` / `dark` 主题对象；颜色选择器直接改 `theme.themes.value`，持久化 key 为 `orange.theme` / `orange.color`。
- 图表页有替换：AntV 页面用 ECharts 渲染，Recharts 页面用 Chart.js；`/map/l7` 不加载 L7，使用 tokenless 的点层卡片演示。
- Cesium 由 `vite-plugin-cesium-build` 复制到 `cesium-package/`，只在 `/map/cesium` 动态加载，使用 OpenStreetMap 影像，不需要 Ion token。
- 单测 4 个文件，覆盖 access、path、tree-code、page-clamp；没有 DOM 组件测试。

## 延伸阅读

- [前端总览：架构、设计系统、权限可见性、新增页面、mock 切换](../../frontend/README.md)
- [仓库技术栈与命令总表](../../README.md)
- [HTTP 契约](../../contracts/openapi.json)

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/vue/package.json、frontend/vue/vite.config.ts、frontend/vue/vitest.config.ts、frontend/vue/.env*、frontend/vue/src/main.ts、frontend/vue/src/router/index.ts、frontend/vue/src/api/http.ts、frontend/vue/src/lib/menu-title.ts、frontend/vue/src/mock/index.ts、frontend/vue/src/views/chart/AntvView.vue、frontend/vue/src/views/chart/RechartView.vue、frontend/vue/src/views/map/CesiumView.vue、frontend/vue/src/views/map/L7View.vue
