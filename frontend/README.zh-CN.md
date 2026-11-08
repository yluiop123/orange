[English](README.md) | 简体中文

# 前端

三个单页应用——React、Vue、Angular——针对同一份 HTTP 契约实现同一个管理后台。
它们共享事实与约定，不共享运行时代码：每套栈各自维护 `package.json`、构建配置和
组件库。

| 技术栈 | 目录 | 开发端口 | 技术栈文档 |
| --- | --- | --- | --- |
| React 19 + Vite + shadcn/Base UI | `frontend/react` | 5173 | [react/README.zh-CN.md](react/README.zh-CN.md) |
| Vue 3 + Vuetify 3 + Vite | `frontend/vue` | 5174 | [vue/README.zh-CN.md](vue/README.zh-CN.md) |
| Angular 21 + Material | `frontend/angular` | 4200 | [angular/README.zh-CN.md](angular/README.zh-CN.md) |

## API 约定

三套前端都调用 `/api/v1`，发送 `Authorization: Bearer <access token>` 和
`Locale: zh|en`，并统一解包：

```json
{ "code": 200, "message": "success", "data": {}, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

分页固定为 `{ total, list, page, size, totalPages }`。访问令牌只存在内存中；刷新页面
依赖 HttpOnly refresh Cookie；401 时只发起一次单飞刷新并重试一次。`40302` 表示需要
先修改初始密码，其他 403 进入无权限状态。

冻结的消费方快照是 [openapi.json](openapi.json)。React 用 `pnpm gen:api` 生成
`src/api/schema.d.ts`；Vue 与 Angular 手写类型。三个应用各自在 `/swagger`（React 为
`#/swagger`）提供 Swagger 页面，读取 `public/swagger.html` 与 `public/openapi.json`，
不会向运行中的后端请求文档。

## 认证与权限

- 菜单树来自 `GET /api/v1/auth/menus`，不是前端路由表。后端用
  `sys_permission.name` 作为默认名称，并在 `sys_permission_i18n` 中保存各语言名称，
  根据 `Locale` 请求头选择。
- `canView(path)` 要求精确的菜单权限，或匹配路径前缀的目录权限；
  `canAct(path, action)` 要求同一 Page Path 下存在对应动作权限。目录权限只影响可见性。
- 角色切换只是前端过滤：根据所选角色重新计算菜单和按钮，后端 Authority 不变。
- 守卫位置因路由而异：React 在 `layout.tsx` 检查 `canView`；Vue 在
  `router.beforeEach` 检查；Angular 给路由挂 `authGuard`、`identityGuard` 和
  `permissionGuard`。

## UI、主题与样式

默认强调色为中性色（浅色 `#18181b`，深色 `#fafafa`）。Orange 是七种可选主题色之一：
`blue`、`green`、`orange`、`red`、`rose`、`violet`、`yellow`。三套前端默认深色，只有
用户明确保存过浅色时才使用浅色。持久化键分别为 `theme-mode` / `theme-color`
（React）、`orange.theme` / `orange.color`（Vue）、`orange.angular.theme` /
`orange.angular.color`（Angular）。

请使用语义类名与 token（`bg-background`、`text-foreground`、
`text-muted-foreground`、`border-border`，或 Vuetify/Material 等价物），确保浅色、
深色和主题色都正常。不要硬编码 `#fff` 或 `gray-100`。

三套前端共享的布局尺寸：顶栏 `4rem`，侧栏 `16rem`（折叠 `3rem`，移动端 `18rem`），
页面内边距 `0.75rem`，内容间距 `1rem`，圆角 `0.625rem`。

## Mock

开发模式默认启用浏览器内 Mock，因此没有后端也能浏览演示页面。

| 技术栈 | 实现 | Mock 文件 | 默认 | 关闭方式 |
| --- | --- | --- | --- | --- |
| React | MSW | `src/mock/` + `public/mockServiceWorker.js` | 开启（`.env.development`） | `VITE_MOCK_ENABLE=false` |
| Vue | Axios adapter | `src/mock/index.ts`、`seed.ts` | 开启（`.env.development`） | `VITE_MOCK_ENABLE=false` |
| Angular | HTTP 拦截器 | `src/app/mock/` | 关闭（`environment.local.ts`） | `?mock=0` 或 `mock: false` |

Vite 环境文件优先级为 `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`。
因此开发时要关闭 Mock，应改 `.env.development.local` 或进程环境变量，而不是
`.env.local`。修改开关后需要重启 dev server。Angular 没有 `.env` 文件：
`pnpm start` 使用 `local` 配置和 `environment.local.ts`，临时切换可用 `?mock=1`。

Mock 覆盖 UI、样式、国际化、路由和截图；它无法验证 refresh Cookie 轮换、CORS、
登录锁定、参数校验或后端授权。

## 运行配置

| 配置项 | React | Vue | Angular |
| --- | --- | --- | --- |
| 开发服务器 | `0.0.0.0:5173` | `0.0.0.0:5174` | `localhost:4200` |
| 端口位置 | `vite.config.ts`（`VITE_PORT`） | `vite.config.ts`（`VITE_PORT`） | `angular.json`（`serve.options.port`） |
| API 地址 | `VITE_BASE_API`（`/api/v1/`） | `VITE_API_BASE`（`/api/v1/`） | `environment.apiBase`（`/api/v1`） |
| 开发代理 | `/api` → `VITE_PROXY_TARGET` | `/api` → `VITE_PROXY_TARGET` | `/api` → `proxy.conf.json` |
| 环境文件 | `.env`、`.env.development`、`.env.github` | `.env`、`.env.development` | `src/environments/environment*.ts` |

默认代理目标是 `http://127.0.0.1:8080`（Spring Boot）。请统一使用 `127.0.0.1`
而不是 `localhost`：它们属于不同源，不共享 Cookie。代理只对 dev server 生效；
生产构建需要同源部署，或后端显式开启 CORS。

## 新增页面

1. 新建页面：`src/pages/**/index.tsx`（React）、`src/views/**/*.vue` 加路由项
   （Vue），或组件加 `page()` / `container()`（Angular）。
2. 在 [../database/permissions.json](../database/permissions.json) 中加入菜单、动作
   节点和角色授权。根权限编码为 4 位，每深一层追加 2 位；同级顺序由编码决定。
3. 把种子区块同步到七个 `database/*/dml.sql`，并手工更新 React/Vue 的 Mock 目录；
   Angular 的 `core/permission-catalog.ts` 也是手写镜像。
4. 补页面级翻译（React `react-intl`、Vue `vue-i18n`、Angular `i18n.service.ts`）。
   菜单标题不在前端翻译：改权限种子里的 `name` 与 `translations`。
5. 跑该栈的测试和类型检查，再分别用 `super` 账号和缺少该权限的角色验证页面。

## 测试

| 技术栈 | 命令 |
| --- | --- |
| React | `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` |
| Vue | `pnpm test`、`pnpm typecheck`、`pnpm lint`、`pnpm build` |
| Angular | `pnpm test`、`pnpm run build`、`pnpm run lint` |

React 的 `pnpm test` 还会双向校验页面与菜单权限，并检查
`database/postgres/dml.sql` 中的权限种子区块。仓库没有自动化端到端套件；各栈测试
覆盖单元与组件行为。

完整技术栈矩阵见[仓库 README](../README.zh-CN.md)。
