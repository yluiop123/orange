# 在 mock 与真实后端之间切换

本页给出三套前端各自的开关、mock 数据落点与代理/CORS 注意事项，供你在没有后端、切换真实接口或排查跨域时直接照做。

## 开关矩阵

| 栈 | 开关文件 | mock 开 | 真实后端 | API 前缀 |
| --- | --- | --- | --- | --- |
| React | `.env.development.local`、`.env.development` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` | `VITE_BASE_API=/api/v1/` |
| Vue | `.env.development.local`、`.env.development` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` | `VITE_API_BASE=/api/v1/` |
| Angular | `src/environments/environment.local.ts` | `mock: true` | `mock: false` | `apiBase: '/api/v1'` |

Vite 的优先级（后者覆盖前者）是 `.env` < `.env.local` < `.env.[mode]` < `.env.[mode].local`；进程环境变量优先级最高。**注意：`.env.development` 会覆盖 `.env.local`**，所以关闭开发模式的 mock 要写在 `.env.development.local` 或直接传进程环境变量。`frontend/react/.env.development` 与 `frontend/vue/.env.development` 默认把 mock 打开，因此 `pnpm dev` 不依赖后端。Angular 没有 `.env`，`npm start` 固定使用 `local` 配置并替换 `environment.ts`。

## 切换步骤

React：

```bash
cd frontend/react
# 编辑 .env.development.local（不入库）：VITE_MOCK_ENABLE=false，VITE_PROXY_TARGET=http://127.0.0.1:8080
pnpm dev     # http://localhost:5173

# 或者不改文件，临时用进程环境变量（优先级最高；Windows PowerShell 用 $env:VITE_MOCK_ENABLE='false'）
VITE_MOCK_ENABLE=false pnpm dev
```

Vue：

```bash
cd frontend/vue
# 编辑 .env.development.local（不入库）：VITE_MOCK_ENABLE=false，VITE_PROXY_TARGET=http://127.0.0.1:8080
pnpm dev     # http://localhost:5174

VITE_MOCK_ENABLE=false pnpm dev
```

Angular：

```bash
cd frontend/angular
# 编辑 src/environments/environment.local.ts：mock: false
npm start    # http://localhost:4200，代理见 proxy.conf.json
```

改完必须重启 dev server；Vite 的 `import.meta.env` 与 Angular 的 `fileReplacements` 都只在启动时求值。

## mock 数据在哪里

| 栈 | 入口 | 数据与协议 |
| --- | --- | --- |
| React | `src/mock/index.ts` | MSW `setupWorker`，handler 分在 `mock/login`、`mock/system`；页面通过 `public/mockServiceWorker.js` 拦截 `/api/v1/*` |
| Vue | `src/mock/index.ts`、`src/mock/seed.ts` | Axios adapter，直接替换 `http.defaults.adapter`；登录、菜单、用户/角色/组织/权限/日志的种子在 `seed.ts` |
| Angular | `src/app/mock/mock.interceptor.ts`、`mock-backend.ts`、`mock-data.ts` | HTTP 拦截器，在 auth 拦截器之后返回内存响应；`?mock=1` 会写入 `localStorage` 的 `orange.mock.enabled` |

React 的 mock 由 `main.tsx` 在挂载应用前动态 `import('@/mock')`；Vue 在 `main.ts` 里 `installMock()`；Angular 由 `app.config.ts` 注册 `mockInterceptor`。

## 何时用 mock

- 只改 UI、样式、i18n 或路由，后端尚未启动。
- 演示、截图、三栈视觉对齐：`scripts/e2e/parity.mjs` 按 mock 账号 `super/super` 登录。
- 断网或受限环境下的冒烟。

不要用 mock 验证：HttpOnly refresh Cookie 的真实轮换、CORS、登录锁定、后端字段校验、后端授权拒绝。这些必须连真实后端；mock 只覆盖 UI 走得到的流程。

## 真实后端的端口与代理

三套 dev server 都把 `/api` 代理到后端，浏览器看到的是同源请求，refresh Cookie 才能正常携带：

| 栈 | 代理目标来源 | 默认值 |
| --- | --- | --- |
| React | `vite.config.ts` 的 `VITE_PROXY_TARGET` | `http://127.0.0.1:8080` |
| Vue | `vite.config.ts` 的 `VITE_PROXY_TARGET` | `http://127.0.0.1:8080` |
| Angular | `proxy.conf.json` | `http://127.0.0.1:8080` |

Spring Boot 默认监听 8080；其他后端端口见 [技术栈参考](../reference/stacks.md)。若后端不在 8080，改代理目标而不是改源码里的 API 前缀。

代理只在 dev server 生效，`pnpm build` / `ng build` 的产物不含代理。部署后要么让前端与 API 同源，要么显式配置后端 CORS。

## CORS 注意

- Spring Boot 的 `application.yaml` 默认允许 `http://localhost:5173`、`http://localhost:5174`、`http://localhost:4200`；换端口或换主机名要同步改 `CORS_ALLOWED_ORIGINS` / `CORS_ORIGINS`。
- 直接跨域时把 `VITE_BASE_API` / `VITE_API_BASE` / `apiBase` 写成绝对地址，后端必须允许该 Origin 且带 `Access-Control-Allow-Credentials: true`；否则 refresh Cookie 不会发送。
- `localhost` 与 `127.0.0.1` 是不同 Origin，Cookie 也不共享。三套仓库模板同时出现两种写法，推荐统一用 `127.0.0.1`，避免 Windows 上解析到 IPv6 后连不上。
- React/Vue 的 Axios 与 Angular 的 `fetch` 都带 `withCredentials` / `credentials: 'include'`；后端不返回凭证头时，表现为刷新页面即掉登录。

## 排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| mock 下请求 404 | mock 路由未覆盖该 path | 在对应 mock 文件补 handler；Vue/Angular 补分支 |
| 控制台报 CORS | 用了绝对 API 地址且后端未放行 Origin | 改回代理，或配置后端 CORS 与凭证 |
| 刷新后回到登录页 | refresh Cookie 未发送/已过期 | 确认同源、`credentials` 与后端 Cookie 作用域 |
| 改 `.env.local` 不生效 | 被 `.env.[mode]` 覆盖（如 `.env.development` 的 `VITE_MOCK_ENABLE=true`），或 dev server 未重启 | 写到 `.env.development.local`，或传进程环境变量，然后重启 |
| 端口被占用 | 5173/5174/4200 已有进程 | 释放端口，或改 `VITE_PORT`（React/Vue） |

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/.env、frontend/react/.env.development、frontend/react/.env.local、frontend/react/vite.config.ts、frontend/react/src/main.tsx、frontend/react/src/mock/index.ts、frontend/vue/.env、frontend/vue/.env.development、frontend/vue/.env.local、frontend/vue/vite.config.ts、frontend/vue/src/main.ts、frontend/vue/src/mock/index.ts、frontend/angular/src/environments/environment*.ts、frontend/angular/proxy.conf.json、frontend/angular/src/app/app.config.ts、frontend/angular/src/app/mock/mock.interceptor.ts、backend/springboot/src/main/resources/application.yaml
