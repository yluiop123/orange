> [English](./GETTING-STARTED.md) | 简体中文

# 前端启动指南

## 环境要求

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | 20.19+ 或 22.12+ | Vite 8 要求；Angular 在 Node 24 上验证 |
| pnpm | 10+ | React、Vue 在 `package.json` 中固定版本 |
| npm | 11+ | Angular 工作区使用 npm |
| 后端 | 可选 | Mock 模式无需后端；真实模式默认 `http://127.0.0.1:8080` |

## 安装与启动

### React

```bash
cd frontend/react
pnpm install
pnpm dev            # http://localhost:5173
```

### Vue

```bash
cd frontend/vue
pnpm install
pnpm dev            # http://localhost:5174
```

### Angular

```bash
cd frontend/angular
npm install
npm start           # http://localhost:4200，使用 local 配置
```

三个开发服务器都会把 `/api` 代理到生成的本地配置中的后端地址。如果后端不在默认
地址，修改 `config/app.env` 后重新生成配置（见
[CONFIGURATION.zh-CN.md](./CONFIGURATION.zh-CN.md)）。

## 演示账号

| 账号 | 密码 | 范围 |
| --- | --- | --- |
| `super` | `super` | 全部角色与权限 |
| `admin` | `admin` | 系统管理，但没有 `super` 授权 |
| `user` | `user` | 仅仪表盘 |

## 测试与验证

```bash
# 单元测试与静态检查
cd frontend/react   && pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
cd frontend/vue     && pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
cd frontend/angular && npm run lint && npm test && npm run build
```

端到端脚本位于 [`../../scripts/e2e`](../../scripts/e2e/README.md)：

```bash
node scripts/e2e/real-react.mjs
node scripts/e2e/real-vue.mjs
node scripts/e2e/real-angular.mjs
```

`real-*` 需要后端与数据库；`mock-*` 使用浏览器内 Mock。两者都会自行启动和关闭浏览器。

## 常见问题

- **Windows + `localhost`**：代理目标优先用 `127.0.0.1`。`localhost` 可能解析到
  IPv6，而后端只监听 IPv4。
- **开发环境白屏**：确认后端地址可达，并且 `VITE_MOCK_ENABLE` /
  `ANGULAR_MOCK_ENABLE` 与期望模式一致。
- **生成的配置过期**：重新执行 `node scripts/sync-config.mjs`；不要手工修改
  `.env.local` 或 `environment.local.ts`。
- **端口被占用**：先停止旧开发服务器，不要为了避开占用而换端口，因为 GitHub
  Pages 和代理配置都假设使用文档中的端口。
