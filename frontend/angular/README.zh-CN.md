[English](README.md) | 简体中文

# ORANGE Angular 前端

Angular 21 + Angular Material 实现，产品范围与 React 参考实现一致；本页只列安装、命令、目录、依赖与偏差。

## 环境与安装

- Node.js 与 pnpm；`package.json` 的 `packageManager` 为 `pnpm@12.15.0`。
- 本目录自带 `pnpm-lock.yaml`，用 `pnpm install --frozen-lockfile` 复现锁定版本。

```bash
cd frontend/angular
pnpm install --frozen-lockfile
```

`pnpm start` 使用 `local` 配置，用 `src/environments/environment.local.ts` 替换 `src/environments/environment.ts`。该配置的 `mock` 默认为 `false`，指向 8080 的真实后端；要脱离后端，访问时带 `?mock=1`（选择会存入 `orange.mock.enabled`），不要改这个受版本控制的文件。

## 命令

| 命令 | 实际执行 | 用途 |
| --- | --- | --- |
| `pnpm start` | `ng serve --port 4200 --configuration local` | 开发服务器，端口 4200，带 `proxy.conf.json` |
| `pnpm build` | `ng build` | 生产构建（默认 `production` 配置） |
| `pnpm run watch` | `ng build --watch --configuration development` | 开发配置监听构建 |
| `pnpm test` | `ng test --watch=false` | 单测（`@angular/build:unit-test`，Vitest） |
| `pnpm lint` | `ng lint` | ESLint + angular-eslint |
| `pnpm run ng` | `ng` | 直接调用 Angular CLI |

没有独立 `typecheck` 脚本；`ng build` 与 `ng test` 都会做严格模板类型检查。

## 目录结构

```text
frontend/angular/
  public/                      静态资源（品牌图等）
  src/
    environments/              environment.ts / .development.ts / .local.ts
    app/
      core/                    auth、interceptor、access、menu、i18n、models、tree-code
      layout/                  shell、sidebar-item、menu-redirect
      mock/                    in-memory backend、mock-data、interceptor
      pages/                   login、system、dashboard、chart、map、three、component
      shared/                  dialogs、EChart 包装、选择器、chart-presets
      app.config.ts            providers 与 app initializer
      app.routes.ts            路由表
    main.ts / styles.scss
  angular.json / proxy.conf.json / tsconfig*.json
```

## 本栈依赖

`package.json` 共 20 个运行时依赖、14 个开发依赖。

| 类别 | 依赖 |
| --- | --- |
| 框架与 UI | `@angular/{animations,cdk,common,compiler,core,forms,material,platform-browser,router}`（21.2.x） |
| 响应式与运行时 | `rxjs`、`tslib` |
| 图表 | `echarts`、`d3` |
| 地图 | `leaflet`、`ol`、`@deck.gl/core`、`@deck.gl/geo-layers`、`@deck.gl/layers` |
| 3D | `three`、`@babylonjs/core` |

Cesium 没有列在依赖里：`/map/cesium` 在运行时从 Cesium CDN 加载固定的 1.147 版本，离线时显示静态回退。Material 使用 Material 3 主题，主色与圆角在 `src/styles.scss` 中被覆盖为与 React 一致的中性色。

## 与契约的关系

- 契约是 `contracts/openapi.json`；本栈没有生成脚本，`src/app/core/models.ts` 手写镜像 `Envelope`、`PageResult`、`UserInfo`、`MenuNode` 等类型。
- `ApiService` 统一解包 `{ code, message, data }`，非 200 代码转成 `ApiError`；`system-api.service.ts` 按资源封装调用。
- `auth.interceptor.ts` 用 `environment.apiBase` 给相对 URL 加前缀，并附加 `Authorization` 与 `Locale`；401 时通过 `RefreshService` 单飞刷新后重试一次。
- `RefreshService` 用 `fetch` 而不是 `HttpClient`，避免 refresh 请求再次进入拦截器造成递归。
- 端点与错误码见 [HTTP 契约](../../contracts/openapi.json)。

## 本栈约定与偏差

- 路由在 `src/app/app.routes.ts` 手工登记。`page(path, permissionPath, loader)` 会挂 `permissionGuard`，`container('system')` 等负责容器跳转；新增页面与容器都要改这里。
- mock 是 `mock.interceptor.ts` + `mock-backend.ts` 的内存实现，排在 auth 拦截器之后；`?mock=1` 会持久化到 `orange.mock.enabled`，`?mock=0` 清除。
- 菜单标题来自 `GET /api/v1/auth/menus`（`sys_permission.name` / `name_en`，后端按 `Locale` 请求头选择）；权限目录 `permission-catalog.ts` 只服务于 mock，不参与真实菜单渲染。
- i18n 字典在 `src/app/core/i18n.service.ts` 的 `EN` / `ZH` 常量里，没有独立 locale 文件。
- 主题与配色切换存在（`ThemeToggleComponent`、颜色菜单），持久化 key 为 `orange.angular.theme`、`orange.angular.color`，默认深色。
- 图表页有替换：AntV 与 Recharts 页面都用 ECharts 渲染，`/map/l7` 用 Leaflet 底图加 SVG 流线，不加载 L7。
- 根工作流的 `deploy` 只发布 React；本栈只跑 build/lint/test，没有独立 GitHub Pages 配置。
- 单测 4 个 spec，覆盖 access、page-clamp、tree-code 与 mock backend；没有端到端套件，E2E 由 `scripts/e2e/*` 外部驱动。

## 延伸阅读

- [前端总览：架构、设计系统、权限可见性、新增页面、mock 切换](../../frontend/README.zh-CN.md)
- [仓库技术栈与命令总表](../../README.zh-CN.md)
- [HTTP 契约](../../contracts/openapi.json)

> Last verified: c7b6531 · 2026-11-08
> 事实来源：frontend/angular/package.json、frontend/angular/angular.json、frontend/angular/proxy.conf.json、frontend/angular/src/environments/environment*.ts、frontend/angular/src/app/app.config.ts、frontend/angular/src/app/app.routes.ts、frontend/angular/src/app/core/guards.ts、frontend/angular/src/app/core/auth.interceptor.ts、frontend/angular/src/app/core/refresh.service.ts、frontend/angular/src/app/core/permission-catalog.ts、frontend/angular/src/app/core/i18n.service.ts、frontend/angular/src/app/mock/mock-backend.ts、frontend/angular/src/app/pages/map/cesium/map-cesium.component.ts、frontend/angular/src/app/pages/chart/rechart/chart-rechart.component.ts、frontend/angular/src/styles.scss
