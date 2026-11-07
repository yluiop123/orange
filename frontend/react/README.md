# ORANGE React 前端

React 19 + Vite 实现，是 Orange 的参考前端；本页只列安装、命令、目录、依赖与偏差，不重复架构说明。

## 环境与安装

- Node.js（版本由 Vite 8 决定）与 pnpm；`package.json` 的 `packageManager` 为 `pnpm@10.28.2`。
- 本目录自带 `pnpm-lock.yaml`，使用 pnpm 安装。

```bash
cd frontend/react
pnpm install
```

本地开发默认启用 mock：`.env.development` 中 `VITE_MOCK_ENABLE=true`，演示账号 `super / super`。`.env.local` 被 `*.local` 规则忽略，仅影响本机。

## 命令

| 命令 | 实际执行 | 用途 |
| --- | --- | --- |
| `pnpm dev` | `vite` | 开发服务器，端口取 `VITE_PORT`，默认 5173 |
| `pnpm build` | `tsc -b && vite build` | 类型检查后生产构建 |
| `pnpm build:github` | `tsc -b && vite build --mode github` | GitHub Pages 构建，base 为 `/orange/` |
| `pnpm preview` | `vite preview` | 预览生产构建 |
| `pnpm preview:github` | `vite preview --mode github` | 预览 Pages 构建 |
| `pnpm lint` | `eslint .` | ESLint |
| `pnpm typecheck` | `tsc -b` | 只做类型检查 |
| `pnpm test` | `vitest run` | 单测（`src/**/*.test.ts`，node 环境） |
| `pnpm test:watch` | `vitest` | 监听模式 |
| `pnpm gen:api` | `openapi-typescript ../../contracts/openapi.json -o src/api/schema.d.ts` | 从契约重新生成类型 |
| `pnpm analyze` | `cross-env ANALYZE=true vite build` | 生成 `dist/stats.html` 体积报告 |

## 目录结构

```text
frontend/react/
  public/mockServiceWorker.js   MSW worker
  src/
    api/            axios 请求模块；schema.d.ts 为生成文件
    auth/           access token、refresh、session hint
    components/     ui/（shadcn 生成）、ext/、system/、壳组件
    config/         permissions.json（同步副本）、menu-icons.ts
    hooks/          use-mobile
    lib/            axios、access、path、menu、page-routes、tree-code
    locale/         zh-CN.ts、en-US.ts
    mock/           MSW handler 与内存数据
    pages/          按 Page Path 分目录，页面必须叫 index.tsx
    store/          zustand：user、menu、permission、theme、locale
    themes/         7 套配色 CSS
    App.tsx / layout.tsx / main.tsx / index.css
  .env / .env.development / .env.github
  vite.config.ts / vitest.config.ts / components.json
```

## 本栈依赖

`package.json` 共 67 个运行时依赖、24 个开发依赖。下面只列与页面能力相关的部分，完整清单以文件为准。

| 类别 | 依赖 |
| --- | --- |
| 图表 | `@ant-design/plots`、`@observablehq/plot`、`echarts`、`echarts-for-react`、`recharts`、`d3-geo` |
| 地图 | `cesium`、`@deck.gl/core`、`@deck.gl/layers`、`@deck.gl/react`、`@antv/larkmap`、`leaflet`、`react-leaflet`、`ol`、`react-openlayers`、`resium` |
| 3D | `three`、`@react-three/fiber`、`@react-three/drei`、`@react-three/postprocessing`、`@babylonjs/core`、`@babylonjs/loaders` |
| 表格与拖拽 | `@tanstack/react-table`、`@tanstack/match-sorter-utils`、`@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/modifiers`、`@dnd-kit/utilities` |
| UI 与交互 | `@base-ui/react`、`cmdk`、`sonner`、`vaul`、`embla-carousel-react`、`framer-motion`、`lucide-react`、`@tabler/icons-react`、`class-variance-authority`、`clsx`、`tailwind-merge` |
| 表单 | `react-hook-form`、`@hookform/resolvers`、`zod`、`input-otp`、`react-dropzone`、`react-day-picker` |
| 状态、路由、i18n | `zustand`、`react-router`（HashRouter）、`react-intl`、`axios`、`date-fns` |
| 样式与主题 | `tailwindcss`、`@tailwindcss/vite`、`tailwindcss-animate`、`tailwind-scrollbar`、`next-themes`、`colorjs.io` |
| 上传与其他 | `@uppy/core`、`@uppy/react`、`@uppy/tus`、`qrcode.react`、`react-resizable-panels`、`leva`、`@faker-js/faker` |

Cesium 由 `vite-plugin-cesium-build` 打包，页面按需加载，不需要 Ion token。

## 与契约的关系

- 契约是 `contracts/openapi.json`。`pnpm gen:api` 生成 `src/api/schema.d.ts`；该文件头写明由 openapi-typescript 生成，不手改。
- `src/api/system/*.ts` 从 `components["schemas"][...]` 组合页面用的 `User`、`Role`、`Group`、`Permission` 类型，再发请求并返回 `data`。
- Axios 基地址是 `VITE_BASE_API`，默认 `/api/v1/`；实例统一带 `Authorization` 与 `Locale`，并处理 401 单飞刷新、403 与 40302。
- 契约变更流程是先生成、再改调用点；端点与错误码不在本页复述，见 [API 参考](../../docs/reference/api.md)。

## 本栈约定与偏差

- 路由固定 `HashRouter`，没有路由模式开关；页面路径由 `src/lib/page-routes.ts` 从 `pages/**/index.tsx` 自动收集，新增页面不改路由表。
- mock 用 MSW；`src/main.tsx` 只在 `VITE_MOCK_ENABLE=true` 时动态加载 `src/mock`。
- 菜单标题用 `menu.<path>` 的 react-intl key，数据库 `name` 作 `defaultMessage` 兜底；Vue/Angular 改用共享权限目录，三端策略并不完全一致。
- 主题是 CSS 变量：`<html class="dark">` 加 `theme-<color>`，状态存 `theme-mode` / `theme-color`。
- `build:github` 产出部署在 `/orange/`；CI 只在 push 时发布 React 到 GitHub Pages。
- 单测跑在 node 环境，覆盖 access、path、permission catalog、tree-code、page-clamp、permission 合并；没有 DOM 组件测试。

## 延伸阅读

- [前端架构](../../docs/frontend/architecture.md)
- [设计系统](../../docs/frontend/design-system.md)
- [用 React 新增一个受权限保护的页面](../../docs/frontend/your-first-page.md)
- [在 mock 与真实后端之间切换](../../docs/frontend/connect-api-and-mocks.md)
- [技术栈参考](../../docs/reference/stacks.md)

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/package.json、frontend/react/vite.config.ts、frontend/react/vitest.config.ts、frontend/react/.env*、frontend/react/src/main.tsx、frontend/react/src/App.tsx、frontend/react/src/lib/page-routes.ts、frontend/react/src/lib/menu.ts、frontend/react/src/lib/axios.ts、frontend/react/src/locale/zh-CN.ts、frontend/react/src/config/permissions.test.ts
