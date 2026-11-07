# 在三套前端同步一个页面

本页给出把一个页面从 React 同步到 Vue、Angular（或反向）的固定顺序：权限数据、页面与路由、文案、mock、测试、视觉校验；三端都要改完才算同步完成。

## 1. 三端对应位置

| 关注点 | React | Vue | Angular |
| --- | --- | --- | --- |
| 页面文件 | `src/pages/<path>/index.tsx` | `src/views/<Area>View.vue` | `src/app/pages/<path>/*.component.ts` |
| 路由注册 | 自动：`src/lib/page-routes.ts` 扫描 `pages/**/index.tsx` | 显式：`src/router/index.ts` | 显式：`src/app/app.routes.ts` 的 `page()` |
| 权限守卫 | `src/lib/access.ts` 的 `canView`/`canAct`，配合 `MenuRedirect` | `router.beforeEach` + `createAccess` | `permissionGuard` + `auth.canView` |
| 菜单标题 | `src/locale/*.ts` 的 `menu.<path>` key | `src/lib/menu-title.ts` 读 `@/config/permissions.json` | `src/app/core/menu-labels.ts` 读 `permission-catalog.ts` |
| 界面文案 | `src/locale/{zh-CN,en-US}.ts` | `src/i18n/{zh-CN,en-US}.ts` | `src/app/core/i18n.service.ts` |
| mock | `src/mock/system/*.ts`；菜单由 mock 权限生成 | `src/mock/seed.ts` | `src/app/mock/mock-data.ts` |
| 单元测试 | 同目录 `*.test.ts(x)` | `src/lib/*.test.ts` | 同目录 `*.spec.ts` |

## 2. 先加权限数据

页面在权限模型里的身份是 Page Path，不是显示名称。先在 `database/permissions.json` 加节点：

- `id`：根节点 4 位数字，子节点在父编码后追加 2 位（DDL 的 `ck_sys_permission_code` 会校验）。
- `name.zh` / `name.en`：两套显示名，三端菜单都读它。
- `path`：必须与三端路由完全一致，这是权限身份；以后改路径等于改权限数据。
- `type`：`menu`（单页）、`directory`（按路径前缀覆盖子页）或 `action`（页面上的操作）。
- `parentId`、`status`、`action`：`menu`/`directory` 的 `action` 必须为 `null`。

然后决定哪些角色默认可见，写进 `rolePermissions`，再执行：

```bash
npm run permissions:sync
```

它更新 React/Vue 的 `src/config/permissions.json` 与 `database/postgres/dml.sql` 的生成块。两个容易漏的点：

- 其他引擎的 `dml.sql` 生成块不会被这个脚本更新，要手工同步。
- Angular 的 `src/app/core/permission-catalog.ts` 是独立副本，脚本不管它，必须手工加同样的节点。

最后重灌数据库或重新执行种子，否则后端菜单接口不会返回新节点。权限语义见 [权限模型](../reference/permission-model.md) 与 [权限与菜单](../explanation/permission-and-menu.md)。

## 3. 页面与路由

- **React**：新建 `src/pages/<path>/index.tsx` 即自动注册；父级容器路径会自动生成重定向路由，不需要改路由表。
- **Vue**：新建 `src/views/<Area>View.vue`，在 `src/router/index.ts` 的 children 里加一条显式记录；如果是新的顶级容器，还要加进 `CONTAINER_PATHS`。
- **Angular**：新建组件，在 `src/app/app.routes.ts` 用 `page('/path', '/path', () => import(...).then(m => m.X))` 注册；`page()` 会自动挂 `permissionGuard` 并把第二个参数写进 `data.path`。

三端的路由路径都必须等于权限的 `path`。React 的 HashRouter 下地址是 `/#/path`，Vue/Angular 是 `/path`，这只是 URL 形式差异。

## 4. 权限与菜单可见性

- 叶子节点：有同路径的 `menu` 权限，或被某个 `directory` 权限的路径前缀覆盖，才可见。
- 容器节点：至少有一个子节点可见时才显示；只给父节点、子节点都没授权时，容器不显示。
- 操作按钮：用 `canAct(path, action)` 判断，不要用菜单可见性代替。
- 直接访问无权限页面：跳 `/forbidden`，不要白屏。
- `/` 的默认菜单是第一个可见叶子。

## 5. 文案

- React：在 `zh-CN.ts` 与 `en-US.ts` 同时加 `menu.<path>`（路径中的 `/` 换成 `.`，例如 `/system/user` → `menu.system.user`）与页面内文案 key；菜单标题用 i18n，后端 `name` 只是兜底。
- Vue：菜单标题由 `src/lib/menu-title.ts` 从 `permissions.json` 取 `name.zh`/`name.en`，所以第 2 步的目录就是文案来源；页面内文案加到 `src/i18n/{zh-CN,en-US}.ts`。
- Angular：菜单标题由 `menu-labels.ts` 从 `permission-catalog.ts` 取 `nameZh`/`nameEn`；页面内文案加到 `i18n.service.ts` 的两份字典。

三端都不要在组件里硬编码中文；语言切换后菜单、面包屑、表头、按钮要同时变。

## 6. mock 数据

- React：在 `src/mock/system/` 补该实体的 handler 与种子；菜单 mock 从权限 mock 生成（`src/mock/login/menu.ts`），不需要单独维护菜单树。
- Vue：`src/mock/seed.ts` 从 `@/config/permissions.json` 生成权限与角色，页面专属数据直接补在 seed 里。
- Angular：`src/app/mock/mock-data.ts` 从 `permission-catalog.ts` 生成；新页面要同时在两处加数据。

mock 账号仍是 `super/super` 等种子账号；从登录到新页面的路径必须能走通。

## 7. 测试

- 单元测试：页面相关的路径/权限/树策略至少各一条；三端现有测试分别在页面同目录、`src/lib/`、`*.spec.ts`。
- mock E2E：启动对应 dev server 后跑 `node scripts/e2e/mock-<stack>.mjs`（Playwright 用本机 Chrome）。
- 真实后端 E2E：关掉 mock、指向后端后跑 `node scripts/e2e/real-<stack>.mjs`；`E2E_BACKEND`、`E2E_DB` 只是写进结果标签。
- 改了登录/头部控件时加跑 `node scripts/e2e/check-controls.mjs`。

## 8. 视觉校验

三端启动 mock 后，在 `scripts/e2e` 下：

```bash
cd scripts/e2e
npm install
node parity.mjs
```

默认截 `button,floatButton,affix,typography` 四个 tab，路由固定为 `/component/general`，React 是内容基线；输出截图、`diff-*.png` 与 `report.json`。判定标准（静态 DOM 页 MAE < 1、像素差 > 12 的占比 < 0.5%）来自 `.scratch/ui-parity/spec.md`，画布页单独报告。

两个限制要提前知道：

- `parity.mjs` 的 `ROUTE` 是常量，校验其他页面要改脚本里的 `ROUTE`/`APPS`，或另写截图脚本。
- Angular 的 `npm start` 用 `local` 配置，`environment.local.ts` 里 `mock` 默认是 `false`；跑 parity 前要改成 `true`（或用 `npx ng serve --configuration development`），否则登录会打到真实后端。

## 9. 验收

三端分别跑 lint、typecheck、test、build（命令见 [提交前验证](verify-a-change.md)），再跑 mock/真实 E2E 与 parity。视觉阈值不达标时先确认是布局/间距问题还是字体与组件库度量差异，不要用放宽阈值代替修复。

> Last verified: 24826bb · 2026-11-07
> 事实来源: `database/permissions.json`、`database/postgres/ddl.sql`、`frontend/react/src/{lib/page-routes.ts,lib/menu.ts,lib/access.ts,locale/zh-CN.ts,locale/en-US.ts,mock/login/menu.ts}`、`frontend/vue/src/{router/index.ts,lib/menu-title.ts,mock/seed.ts,i18n/zh-CN.ts,i18n/en-US.ts}`、`frontend/angular/src/app/{app.routes.ts,core/guards.ts,core/menu-labels.ts,core/permission-catalog.ts,core/i18n.service.ts,mock/mock-data.ts}`、`frontend/angular/src/environments/environment.local.ts`、`scripts/e2e/{parity.mjs,mock-react.mjs,real-react.mjs,README.md}`、`.scratch/ui-parity/spec.md`
