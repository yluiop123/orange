# 在三前端之间同步一个页面

本页解决：一个页面在 React 改完，怎么在 Vue 与 Angular 里做成一致行为。
读者：维护三前端一致性的开发者。

## 1. 三栈对应位置

| 关注点 | React | Vue | Angular |
| --- | --- | --- | --- |
| 页面 | `src/pages/<area>/` | `src/views/` | `src/app/pages/` |
| 路由 | `src/App.tsx` + `src/lib/page-routes.ts` | `src/router/index.ts` | `src/app/app.routes.ts` |
| API 调用 | `src/api/` | `src/api/`（`http.ts` 统一实例） | `src/app/core/*.service.ts` |
| 权限/可见性 | `src/lib/access.ts` | `src/auth/` | `src/app/core/access.ts`、`guards.ts` |
| i18n | `src/locale/{en-US,zh-CN}.ts` | `src/i18n/{en-US,zh-CN}.ts` | `src/app/core/i18n.service.ts` |
| mock | `src/mock/` | `src/mock/` | `src/app/mock/` |
| 状态 | `src/store/` | `src/stores/` | service + signals |
| 测试 | 与组件同目录 `*.test.tsx` | `*.test.ts` | `*.spec.ts` |

## 2. 同步步骤

1. **先定行为**：页面数据来源、权限、空态/错误态、i18n 文案键，三者必须一致。以 React 为参照实现。
2. **路由**：三栈的路由路径必须相同（菜单与权限都按 path 匹配）。Angular 在 `app.routes.ts` 加条目，Vue 在 `router/index.ts` 加，React 在 `App.tsx` + `page-routes.ts` 注册。
3. **权限**：页面级用菜单可见性控制，按钮级用操作权限控制。三栈的 `access` 实现语义必须一致（叶子 = 菜单路径相同或目录前缀覆盖；容器 = 任一子可见）。
4. **API 层**：React 用生成的 `schema.d.ts`；Vue/Angular 用手写类型，字段名与契约保持一致。
5. **i18n**：新增文案键要三栈同时加，`en-US` 与 `zh-CN` 都要有，不允许只在一种语言里出现。
6. **mock**：三栈 mock 都要能返回同样的数据，否则演示与 parity 截图会不一致。
7. **测试**：至少一条渲染/交互用例 + 一条权限可见性用例。

## 3. 视觉与控件一致性

三前端共享同一套视觉语言（颜色、间距、组件尺寸），差异只应来自框架本身的实现。验证方式：

```bash
cd scripts/e2e
npm install
node parity.mjs --tabs=button --themes=dark --colors=default
```

- 截图协议：Chrome、1440x900、DPR 1、locale zh、关闭动画、同路由同滚动位置。
- 输出：每个 tab/主题/配色的 MAE 与差异像素占比；差异集中在某一栈说明该栈样式没对齐。
- 协议细节在 `.scratch/ui-parity/spec.md`（内部文档，不随文档发布）。

## 4. 常见不一致

| 现象 | 常见原因 |
| --- | --- |
| 菜单项某一栈缺失 | 路由 path 不一致，或该栈权限过滤逻辑不同 |
| 按钮某一栈可见 | 操作权限判断没走统一 `access` |
| 文案某一栈是英文 | i18n 键漏加或 fallback 生效 |
| 空表格/加载态不同 | 三栈的列表组件默认行为不同，需要显式设置 |
| 截图差异大 | 主题 token 或组件默认尺寸没对齐（先查 styles/themes） |

## 5. 验收

- [ ] 三栈路由 path 相同
- [ ] 菜单与按钮可见性一致（同一账号、同一角色）
- [ ] i18n 键三栈齐全
- [ ] mock 数据一致
- [ ] 三栈测试通过
- [ ] parity 截图差异在阈值内
- [ ] 文档同步（受影响页面与 `Last verified`）

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/src/App.tsx、frontend/react/src/lib/page-routes.ts、frontend/react/src/lib/access.ts、frontend/vue/src/router/index.ts、frontend/vue/src/i18n/、frontend/angular/src/app/app.routes.ts、frontend/angular/src/app/core/access.ts、scripts/e2e/parity.mjs
