> [English](./CONFIGURATION.md) | 简体中文

# 前端配置

每个前端都把配置放在自己的代码目录下。仓库根目录不再有共享的 `config/`，
也没有生成器：直接复制或修改应用目录中的文件，然后重启开发服务器。

## React

| 文件 | 是否提交 | 用途 |
| --- | --- | --- |
| `.env` | 是 | 共享默认值：部署 base、API 前缀、代理目标 |
| `.env.development` | 是 | 开发默认值：开启 Mock |
| `.env.github` | 是 | GitHub Pages 构建，base 为 `/orange/` |
| `.env.local` | 否（gitignore） | 本地覆盖，优先级最高 |

```bash
cd frontend/react
cp .env .env.local        # 可选的本地覆盖
# 修改 VITE_MOCK_ENABLE / VITE_BASE_API / VITE_PROXY_TARGET
pnpm dev
```

优先级从高到低：

1. 真实环境变量。
2. `.env.local`。
3. `.env.[mode]` 与 `.env`。
4. 代码默认值。

## Vue

| 文件 | 是否提交 | 用途 |
| --- | --- | --- |
| `.env` | 是 | 共享默认值：API 前缀、代理目标、Mock 关闭 |
| `.env.development` | 是 | 开发默认值：开启 Mock |
| `.env.local` | 否（gitignore） | 本地覆盖，优先级最高 |

```bash
cd frontend/vue
cp .env .env.local
pnpm dev
```

## Angular

Angular 使用 TypeScript 环境文件，而不是 `.env`：

| 文件 | 是否提交 | 使用场景 |
| --- | --- | --- |
| `src/environments/environment.ts` | 是 | 生产构建 |
| `src/environments/environment.development.ts` | 是 | `ng build/serve --configuration development` |
| `src/environments/environment.local.ts` | 是 | `npm start`（`local` 配置） |

`npm start` 使用已提交的 local 文件，默认连接真实后端、关闭 Mock。要脱离后端运行，
把 `environment.local.ts` 中的 `mock` 改为 `true`。

## 变量

| 变量 | 含义 |
| --- | --- |
| `VITE_BASE` | 部署 base（React 本地 `/`，Pages 为 `/orange/`） |
| `VITE_BASE_API`（React）/ `VITE_API_BASE`（Vue） | API 前缀，默认 `/api/v1/` |
| `VITE_PROXY_TARGET` | Vite 开发代理目标，默认 `http://127.0.0.1:8080` |
| `VITE_MOCK_ENABLE` | 浏览器内 Mock 开关 |

Cesium 页面使用本地打包的 CesiumJS 和 OpenStreetMap 底图，不需要 Cesium Ion token。

Angular 没有 `VITE_*`：直接修改环境文件中的 `apiBase` 与 `mock`。
`npm start` 期间由 `proxy.conf.json` 把 `/api` 转发到后端。

## Mock 与真实模式切换

| 应用 | 真实后端 | Mock |
| --- | --- | --- |
| React | `.env.local` 中 `VITE_MOCK_ENABLE=false` | `true` |
| Vue | `.env.local` 中 `VITE_MOCK_ENABLE=false` | `true` |
| Angular | `environment.local.ts` 中 `mock: false` | `true` 或 `?mock=1` |

使用真实后端时，先启动后端，并确认代理目标与后端端口一致。默认地址是
`http://127.0.0.1:8080`（Spring Boot / FastAPI 演示）。

## 规则

- React 固定使用 `HashRouter`，没有路由模式变量。不要把 `VITE_ROUTE` 加回来。
- Windows 下代理目标使用 `127.0.0.1`，不要用 `localhost`。
- 不要提交 `.env.local` 或任何真实密钥。
- `.env` / `.env.development` 是提交的默认值，不要写入本机特定配置。
