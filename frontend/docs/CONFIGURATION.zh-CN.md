> [English](./CONFIGURATION.md) | 简体中文

# 前端配置

## 单一来源

共享配置只在 **一个** 文件中修改：`config/app.env`，再生成到各技术栈的原生配置文件：

```text
config/app.example.env   提交的模板，不含密钥
config/app.env           本地副本（gitignore）
scripts/sync-config.mjs  生成器
```

```bash
cp config/app.example.env config/app.env   # 只需一次
node scripts/sync-config.mjs               # 每次修改后执行
```

根目录旧的 `.env.example` 已移除。不要重新创建：它与 `config/app.example.env`
重复，而且已经过期（仍在描述 `VITE_ROUTE`）。

## 生成文件

| 应用 | 生成文件 | 读取方式 |
| --- | --- | --- |
| React | `frontend/react/.env.local` | Vite，优先级最高 |
| Vue | `frontend/vue/.env.local` | Vite，优先级最高 |
| Angular | `frontend/angular/src/environments/environment.local.ts` | `npm start`（`local` 配置） |

生成文件均已 gitignore，不能手工修改。

## Vite 环境文件分层

React 和 Vue 在应用目录保留提交的默认值：

| 文件 | 用途 |
| --- | --- |
| `.env` | 共享默认值：API 前缀、代理目标、部署 base |
| `.env.development` | 开发默认值，默认开启 Mock |
| `.env.github` | GitHub Pages 构建（仅 React）：base 为 `/orange/` |
| `.env.local` | 生成的本地覆盖，优先级最高 |

优先级从高到低：

1. 真实环境变量。
2. `.env.local`（生成）。
3. `.env.[mode]` 与 `.env`。
4. 代码默认值。

## Angular 环境文件

| 文件 | 用途 |
| --- | --- |
| `environment.ts` | 生产默认值 |
| `environment.development.ts` | 开发默认值，Mock 开启 |
| `environment.local.ts` | `npm start` 使用的生成覆盖 |

## 前端变量

| 变量 | 含义 |
| --- | --- |
| `REACT_PORT` / `VUE_PORT` / `ANGULAR_PORT` | 开发端口，生成时写成 `VITE_PORT` |
| `REACT_API_BASE` / `VUE_API_BASE` / `ANGULAR_API_BASE` | API 前缀 |
| `REACT_PROXY_TARGET` / `VUE_PROXY_TARGET` | Vite 开发代理目标 |
| `REACT_MOCK_ENABLE` / `VUE_MOCK_ENABLE` / `ANGULAR_MOCK_ENABLE` | 浏览器内 Mock |
| `REACT_CESIUM_TOKEN` | 可选的 Cesium Ion token；为空时回退到 OpenStreetMap |

Angular 还支持 URL 参数 `?mock=1` / `?mock=0`，状态保存在
`localStorage`（`orange.mock.enabled`）。

## 规则

- React 固定使用 `HashRouter`，没有路由模式变量。不要把 `VITE_ROUTE` 加回来。
- Windows 下代理目标使用 `127.0.0.1`，不要用 `localhost`。
- 不要提交 `config/app.env`、`.env.local`、`environment.local.ts` 或任何真实密钥。
  CI 通过环境变量注入。
- `backend/<stack>` 下提交的 `.env.example` 是该技术栈的独立参考，生成器不会读取。
