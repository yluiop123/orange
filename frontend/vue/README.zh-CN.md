[English](README.md) | 简体中文

# Orange · Vue 前端

基于 Vue 3 + Vuetify 的实现，产品范围与 React 基准一致。本页说明安装、命令、目录、
配置和本栈差异；共同约定见 [../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | Vue 3.5 | `package.json` |
| 构建 | Vite 8、`@vitejs/plugin-vue`、TypeScript 5.9 | `package.json`、`vite.config.ts` |
| UI | Vuetify 3.13、Material Design Icons | `src/main.ts` |
| 状态与路由 | Pinia 3、Vue Router 4（`createWebHistory`） | `src/stores/`、`src/router/` |
| HTTP | Axios | `src/api/http.ts` |
| Mock | 自定义 Axios adapter + 内存种子数据 | `src/mock/` |
| 国际化 | `vue-i18n` 11 | `src/i18n/` |
| 测试 | Vitest | `vitest.config.ts` |
| 图表与地图 | ECharts、Chart.js、D3、Cesium、deck.gl、Leaflet、OpenLayers、Babylon.js | `package.json` |

## 环境要求与安装

- Node.js 20.19+ 或 22.12+，pnpm 12.15.0。
- 本目录有自己的 `pnpm-lock.yaml`。

```bash
cd frontend/vue
pnpm install
pnpm dev        # http://127.0.0.1:5174
```

## 常用命令

| 命令 | 实际执行 | 作用 |
| --- | --- | --- |
| `pnpm dev` | `vite --port 5174` | 开发服务器，端口 5174 |
| `pnpm build` | `vue-tsc -b && vite build` | 类型检查后生产构建 |
| `pnpm preview` | `vite preview --port 5174` | 预览构建产物 |
| `pnpm typecheck` | `vue-tsc -b` | 只做类型检查 |
| `pnpm test` | `vitest run` | 单元测试 |
| `pnpm test:watch` | `vitest` | 监听模式 |
| `pnpm lint` | `eslint . --max-warnings=0` | 代码检查，零警告 |
| `pnpm format` | `prettier --write .` | 格式化 |

## 目录结构

```text
frontend/vue/
  src/
    api/            Axios 实例、认证与资源请求、手写类型
    auth/           令牌、刷新、会话提示、强制改密标记
    components/     ActionAuth、FormDialog、ResourceTable、layout/、showcase/
    composables/    useAccess、useResourcePage、usePageTitle
    config/         permissions.json、menu-icons.ts
    i18n/           index.ts、zh-CN.ts、en-US.ts
    layouts/        AppLayout.vue
    lib/            access、menu、path、tree-code、validation
    mock/           Axios adapter 与内存种子
    router/         路由表与全局守卫
    stores/         auth、menu、ui、pinia
    styles/         main.css、system.css
    views/          system、dashboard、chart、map、three、component、login、errors
    App.vue / main.ts
  .env / .env.development
  vite.config.ts / vitest.config.ts
```

## 路由、状态与接口

- 使用 `createWebHistory`。页面和 `CONTAINER_PATHS` 都在 `src/router/index.ts` 手写
  注册；新增容器时两处都要改。
- `router.beforeEach` 检查公开路由、令牌、用户信息、菜单和 `canView`，失败跳转
  `/forbidden`。操作按钮由 `ActionAuth` 控制。
- `src/api/http.ts` 使用 `VITE_API_BASE`（默认 `/api/v1/`），始终发送
  `Authorization` 与 `Locale`，并设置 `withCredentials: true` 以携带 refresh Cookie。
  401 时单飞刷新一次并重试。
- 本栈没有代码生成脚本，`src/api/types.ts` 手写 `Envelope`、`PageResult` 和实体类型。

## UI 与样式

Vuetify 组件在 `src/main.ts` 全局注册，表单默认 `outlined`，密度 `comfortable`，
图标使用 MDI。主题使用 Vuetify 的 `light` / `dark` 主题对象；颜色选择器直接写
`theme.themes.value`，持久化键为 `orange.theme` / `orange.color`。应用默认深色。

Cesium 由 `vite-plugin-cesium-build` 复制到 `cesium-package/`，只在 `/map/cesium`
动态加载；底图为 OpenStreetMap，不需要 Ion token。

## 运行配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| 开发服务器 | `0.0.0.0:5174` | `vite.config.ts` / `package.json` | 改 `VITE_PORT` 或 `--port` |
| API 地址 | `/api/v1/` | `.env`（`VITE_API_BASE`） | 修改环境文件或导出同名变量 |
| 开发代理 | `http://127.0.0.1:8080` | `.env`（`VITE_PROXY_TARGET`） | 指向其他后端 |
| Mock | 开发环境开启 | `.env.development`（`VITE_MOCK_ENABLE=true`） | 改为 `VITE_MOCK_ENABLE=false` |

## 连接后端与 Mock

| 模式 | 配置 | 说明 |
| --- | --- | --- |
| Mock | `VITE_MOCK_ENABLE=true` | 开发默认；自定义 Axios adapter 返回种子数据 |
| 代理后端 | `VITE_MOCK_ENABLE=false` + `VITE_PROXY_TARGET` | Vite 代理 `/api`，Cookie 保持同源 |
| 直连后端 | `VITE_API_BASE=http://127.0.0.1:8080/api/v1/` | 需要后端 CORS 与跨站 Cookie 配置 |

Vite 优先级为 `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`。
本地关闭 Mock 请使用 `.env.development.local` 或进程变量。

| 环境 | 文件 |
| --- | --- |
| 基础 | `.env` |
| 开发 | `.env.development` |
| 本地覆盖（已 gitignore） | `.env.local`、`.env.development.local` |
| 生产 | 基础配置 + 构建时环境变量 |

## 本栈差异

- 路由为手写，不从文件系统自动收集。
- Mock 替换 `http.defaults.adapter`，不是 MSW。
- 部分图表页有替代实现：AntV 页面用 ECharts，Recharts 页面用 Chart.js，
  `/map/l7` 不加载 L7。
- 单元测试为 4 个文件，覆盖 access、path、tree-code 和 page-clamp；没有 DOM 组件测试。

## 延伸阅读

- [前端总览](../README.zh-CN.md)
- [HTTP 契约](../openapi.json)
- [仓库 README](../../README.zh-CN.md)
