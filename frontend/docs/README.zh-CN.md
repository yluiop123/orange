> [English](./README.md) | 简体中文

# 前端文档

三个前端实现的代码设计与运维文档。产品范围与接口契约在
[`../../docs/`](../../docs/README.zh-CN.md)；本目录只描述 `frontend/` 下的代码。

## 文档

| 文档 | 内容 |
| --- | --- |
| [GETTING-STARTED.zh-CN.md](./GETTING-STARTED.zh-CN.md) | 环境要求、安装、启动与测试命令 |
| [CONFIGURATION.zh-CN.md](./CONFIGURATION.zh-CN.md) | 环境文件、生成配置、Mock 与真实模式 |
| [ARCHITECTURE.zh-CN.md](./ARCHITECTURE.zh-CN.md) | 外壳、路由、状态、国际化、主题与一致性规则 |
| [STYLE-GUIDE.zh-CN.md](./STYLE-GUIDE.zh-CN.md) | 颜色变量、间距、字体与组件规范 |

## 三个应用

| 应用 | 技术栈 | 端口 | 入口 |
| --- | --- | --- | --- |
| React | React 19 · Vite · TypeScript · Tailwind · shadcn/Base UI · Zustand | 5173 | [`../react`](../react/README.md) |
| Vue | Vue 3.5 · Vite · TypeScript · Vuetify 3 · Pinia | 5174 | [`../vue`](../vue/README.md) |
| Angular | Angular 21 · Angular Material · signals | 4200 | [`../angular`](../angular/README.md) |

React 是页面内容与交互的基准实现。Vue 和 Angular 必须与其路由、菜单树、图标、
主题变量、页签样式和页面结构保持一致。视觉规则见
[STYLE-GUIDE.zh-CN.md](./STYLE-GUIDE.zh-CN.md)。

## 快速命令

```bash
# React
cd frontend/react && pnpm install && pnpm dev

# Vue
cd frontend/vue && pnpm install && pnpm dev

# Angular
cd frontend/angular && npm install && npm start
```

三个开发服务器都会把 `/api` 代理到后端，确保 refresh cookie 保持同源。
代理目标与 Mock 开关见 [CONFIGURATION.zh-CN.md](./CONFIGURATION.zh-CN.md)。
