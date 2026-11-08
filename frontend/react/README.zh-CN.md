[English](README.md) | 简体中文

# Orange · React 前端

基于 React 19 + Vite 的实现，也是 Orange 的前端基准。本页只说明安装、命令、目录、
配置和本栈差异；共同约定见 [../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | React 19、React DOM 19 | `package.json` |
| 构建 | Vite 8、TypeScript 5.9、SWC React 插件 | `package.json`、`vite.config.ts` |
| UI | shadcn 风格组件 + Base UI、Tailwind CSS 4、lucide/Tabler 图标 | `src/components/`、`package.json` |
| 状态与路由 | Zustand、React Router 8（`HashRouter`） | `src/store/`、`src/App.tsx` |
| HTTP | Axios | `src/lib/axios.ts` |
| Mock | MSW 3 | `src/mock/`、`public/mockServiceWorker.js` |
| 国际化 | `react-intl` | `src/locale/` |
| 测试 | Vitest | `vitest.config.ts` |
| 地图与图表 | ECharts、Recharts、Ant Design Plots、Cesium、deck.gl、Leaflet、OpenLayers、Babylon.js | `package.json` |

## 环境要求与安装

- Node.js 20.19+ 或 22.12+，pnpm 12.15.0。
- 本目录有自己的 `pnpm-lock.yaml`。

```bash
cd frontend/react
pnpm install
pnpm dev        # http://127.0.0.1:5173
```

## 常用命令

| 命令 | 实际执行 | 作用 |
| --- | --- | --- |
| `pnpm dev` | `vite` | 开发服务器，端口 5173 |
| `pnpm build` | `tsc -b && vite build` | 类型检查后生产构建 |
| `pnpm build:github` | `tsc -b && vite build --mode github` | GitHub Pages 构建，base 为 `/orange/` |
| `pnpm preview` | `vite preview` | 预览生产构建 |
| `pnpm preview:github` | `vite preview --mode github` | 预览 Pages 构建 |
| `pnpm lint` | `eslint .` | 代码检查 |
| `pnpm typecheck` | `tsc -b` | 只做类型检查 |
| `pnpm test` | `vitest run` | 单元测试 |
| `pnpm test:watch` | `vitest` | 监听模式 |
| `pnpm gen:api` | `openapi-typescript ../openapi.json -o src/api/schema.d.ts` | 从快照重新生成接口类型 |
| `pnpm analyze` | `cross-env ANALYZE=true vite build` | 生成 `dist/stats.html` 包体报告 |

## 目录结构

```text
frontend/react/
  public/mockServiceWorker.js   MSW worker
  src/
    api/            Axios 封装；schema.d.ts 由脚本生成
    auth/           访问令牌、刷新、会话提示
    components/     ui/、ext/、system/、布局组件
    config/         permissions.json、menu-icons.ts
    hooks/          通用 hooks
    lib/            axios、access、path、menu、page-routes、tree-code
    locale/         zh-CN.ts、en-US.ts
    mock/           MSW handler 与内存数据
    pages/          每个 Page Path 一个目录，入口为 index.tsx
    store/          Zustand：user、menu、permission、theme、locale
    themes/         主题色 CSS
    App.tsx / layout.tsx / main.tsx / index.css
  .env / .env.development / .env.github
  vite.config.ts / vitest.config.ts / components.json
```

## 路由、状态与接口

- 固定使用 `HashRouter`。页面路由由 `src/lib/page-routes.ts` 从
  `pages/**/index.tsx` 自动收集，新增页面通常不需要改路由表。
- Zustand 保存用户、菜单、权限、主题和语言。访问令牌只在内存中，刷新页面依靠
  HttpOnly refresh Cookie。
- `src/lib/axios.ts` 使用 `VITE_BASE_API`（默认 `/api/v1/`），始终发送
  `Authorization` 与 `Locale`；401 时单飞刷新一次，同时处理 403 和 40302。
- `layout.tsx` 在渲染子路由前检查 `access.canView`；`MenuRedirect` 处理 `/` 和容器
  路径。操作按钮由 `ActionAuth` 包裹。
- `src/api/schema.d.ts` 由 `frontend/openapi.json` 生成，不要手改。

## UI 与样式

组件位于 `src/components`；shadcn 风格的 `ui/` 层基于 Base UI 与 Tailwind CSS 4。
默认强调色为中性色，另有七种可选主题色。请使用 `src/index.css` 中的语义 token；
主题通过 `<html class="dark">` 和 `theme-<color>` 应用，持久化键为 `theme-mode`、
`theme-color`。应用默认深色。

Cesium 由 `vite-plugin-cesium-build` 打包，只在 Cesium 页面按需加载，不需要 Cesium
Ion token。

## 运行配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| 开发服务器 | `0.0.0.0:5173` | `vite.config.ts` | 改 `VITE_PORT` 或默认端口 |
| API 地址 | `/api/v1/` | `.env`（`VITE_BASE_API`） | 修改环境文件或导出同名变量 |
| 开发代理 | `http://127.0.0.1:8080` | `.env`（`VITE_PROXY_TARGET`） | 指向其他后端 |
| Mock | 开发环境开启 | `.env.development`（`VITE_MOCK_ENABLE=true`） | 改为 `VITE_MOCK_ENABLE=false` |
| Pages base | `/orange/` | `.env.github`（`VITE_BASE`） | 修改 `.env.github` |

## 连接后端与 Mock

| 模式 | 配置 | 说明 |
| --- | --- | --- |
| Mock | `VITE_MOCK_ENABLE=true` | 开发默认；MSW 在浏览器内拦截请求 |
| 代理后端 | `VITE_MOCK_ENABLE=false` + `VITE_PROXY_TARGET` | Vite 代理 `/api`，Cookie 保持同源 |
| 直连后端 | `VITE_BASE_API=http://127.0.0.1:8080/api/v1/` | 需要后端 CORS 与跨站 Cookie 配置 |

Vite 优先级为 `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`。
开发时关闭 Mock 请使用 `.env.development.local` 或进程变量；`.env.local` 会被
`.env.development` 覆盖。

| 环境 | 文件 |
| --- | --- |
| 基础 | `.env` |
| 开发 | `.env.development` |
| GitHub Pages | `.env.github` |
| 本地覆盖（已 gitignore） | `.env.local`、`.env.development.local` |
| 生产 | 基础配置 + 构建时环境变量 |

## 本栈差异

- 固定 Hash 路由，没有 history 模式开关。
- 只有启用 Mock 时才动态 import MSW。
- 单元测试运行在 Node 环境，覆盖 access、path、权限目录、tree-code、page-clamp 和
  权限合并；没有 DOM 组件测试。
- `build:github` 由 CI 在 push 到 `main` 时发布到 GitHub Pages。

## 延伸阅读

- [前端总览](../README.zh-CN.md)
- [HTTP 契约](../openapi.json)
- [仓库 README](../../README.zh-CN.md)
