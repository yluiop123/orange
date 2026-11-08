[English](README.md) | 简体中文

# Orange · Angular 前端

基于 Angular 21 + Angular Material 的实现，产品范围与 React 基准一致。本页说明安装、
命令、目录、配置和本栈差异；共同约定见 [../README.zh-CN.md](../README.zh-CN.md)。

## 技术栈与依赖

| 项 | 版本 / 说明 | 来源 |
| --- | --- | --- |
| 框架 | Angular 21.2（`core`、`common`、`forms`、`router`、`platform-browser`） | `package.json` |
| UI | Angular Material 21、Angular CDK、SCSS | `src/styles.scss` |
| 构建 | Angular CLI 21（`@angular/build:application`）、TypeScript 5.9 | `angular.json` |
| 响应式 | RxJS 7.8、signals 与可注入服务 | `src/app/core/` |
| HTTP | `HttpClient` + 拦截器 | `src/app/core/` |
| Mock | HTTP 拦截器 | `src/app/mock/` |
| 国际化 | `core/i18n.service.ts` | `src/app/core/` |
| 测试 | Angular unit-test builder（Vitest） | `angular.json` |
| 图表与地图 | ECharts、D3、Leaflet、OpenLayers、deck.gl、Babylon.js | `package.json` |

## 环境要求与安装

- Node.js 20.19+ 或 22.12+，pnpm 12.15.0。
- 本目录有自己的 `pnpm-lock.yaml`。

```bash
cd frontend/angular
pnpm install --frozen-lockfile
pnpm start      # http://localhost:4200
```

## 常用命令

| 命令 | 实际执行 | 作用 |
| --- | --- | --- |
| `pnpm start` | `ng serve --port 4200 --configuration local` | 开发服务器 4200，使用 `proxy.conf.json` |
| `pnpm build` | `ng build` | 生产构建 |
| `pnpm run watch` | `ng build --watch --configuration development` | 监听构建 |
| `pnpm test` | `ng test --watch=false` | 单元测试 |
| `pnpm lint` | `ng lint` | ESLint + angular-eslint |
| `pnpm run ng` | `ng` | 直接调用 Angular CLI |

没有单独的 typecheck 脚本；`ng build` 与 `ng test` 都会做严格的模板类型检查。

## 目录结构

```text
frontend/angular/
  public/                      静态资源
  src/
    environments/              environment.ts / .development.ts / .local.ts
    app/
      core/                    认证、拦截器、access、menu、i18n、models
      layout/                  外壳、侧栏、菜单重定向
      mock/                    内存后端与拦截器
      pages/                   login、system、dashboard、chart、map、three、component
      shared/                  对话框、ECharts 包装、选择器
      app.config.ts            providers 与 app initializer
      app.routes.ts            路由表
    main.ts / styles.scss
  angular.json / proxy.conf.json / tsconfig*.json
```

## 路由、状态与接口

- 路由在 `src/app/app.routes.ts` 手写注册。`page(path, permissionPath, loader)`
  会挂 `permissionGuard`，`container('system')` 处理容器重定向；新增页面和容器都要
  改这里。
- 状态使用 Angular signals 与可注入服务，没有外部状态库。
- `ApiService` 统一解包 `{ code, message, data }`，非 200 业务码转成 `ApiError`；
  `system-api.service.ts` 按资源封装调用。
- `auth.interceptor.ts` 用 `environment.apiBase` 补全相对地址，并附加
  `Authorization` 与 `Locale`。401 时通过 `RefreshService` 单飞刷新并重试一次。
  `RefreshService` 使用 `fetch`，避免刷新请求再次进入拦截器。

## UI 与样式

Material 使用 Material 3 主题；主色与圆角在 `src/styles.scss` 中覆盖为与 React
一致的中性色。主题与主题色切换使用 `orange.angular.theme` / `orange.angular.color`，
默认深色。

Cesium 不是依赖：`/map/cesium` 从 Cesium CDN 加载固定 1.147 版本，离线时显示静态
回退。部分图表页有替代实现：AntV 与 Recharts 页面都用 ECharts，`/map/l7` 使用
Leaflet 底图与 SVG 流向线。

## 运行配置

| 配置项 | 当前值 | 配置位置 | 修改方式 |
| --- | --- | --- | --- |
| 开发服务器 | `localhost:4200` | `angular.json`（`serve.options.port`） | 改端口或传 `--port` |
| API 地址 | `/api/v1` | `src/environments/environment*.ts` | 修改 `apiBase` |
| 开发代理 | `http://127.0.0.1:8080` | `proxy.conf.json` | 修改 `target` |
| Mock | `local` 配置默认关闭 | `environment.local.ts`（`mock: false`） | 改为 `mock: true` 或打开 `?mock=1` |

## 连接后端与 Mock

| 模式 | 配置 | 说明 |
| --- | --- | --- |
| Mock | 当前环境 `mock: true`，或 `?mock=1` | 内存拦截器；`?mock=0` 清除已保存的选择 |
| 代理后端 | `apiBase: '/api/v1'` + `proxy.conf.json` | dev server 把 `/api` 代理到 8080 |
| 直连后端 | `apiBase: 'http://127.0.0.1:8080/api/v1'` | 需要后端 CORS 与 Cookie 配置 |

`pnpm start` 使用 `local` 配置，把 `environment.ts` 替换为 `environment.local.ts`。
入库文件默认 `mock: false`，因此开发服务器需要 8080 上的后端。临时使用 Mock 时用
`?mock=1`，不要修改入库文件。

| 环境 | 文件 | 选择方式 |
| --- | --- | --- |
| 生产 | `environment.ts` | `ng build`（默认） |
| 开发 | `environment.development.ts` | `--configuration development` |
| 本地 | `environment.local.ts` | `pnpm start` / `--configuration local` |

## 本栈差异

- 权限目录 `src/app/core/permission-catalog.ts` 是手写镜像；新增权限时要同时改它和
  `ROLE_PERMISSIONS`。
- 国际化字典在 `i18n.service.ts` 的 `EN` / `ZH` 常量中，没有独立语言文件。
- CI 只发布 React；Angular 只跑构建、lint 和测试，没有 Pages 配置。
- 单元测试为 4 个 spec，覆盖 access、page-clamp、tree-code 和 Mock 后端；没有端到端
  测试。

## 延伸阅读

- [前端总览](../README.zh-CN.md)
- [HTTP 契约](../openapi.json)
- [仓库 README](../../README.zh-CN.md)
