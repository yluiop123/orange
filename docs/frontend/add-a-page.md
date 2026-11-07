# 在 Vue 与 Angular 里新增同一个页面

本页把 React 已完成的一次页面新增复刻到 Vue 与 Angular，重点给出三栈目录映射、路由注册、权限守卫与 i18n 文件的落点；适合已经能改动其中一套栈的开发者。

## 前提

先按 [用 React 新增一个受权限保护的页面](./your-first-page.md) 在 `database/permissions.json` 里定义 `/reports/sales`，并执行 `npm run permissions:sync`。本页假设 Page Path、菜单编码和动作权限已经存在，只做另外两套栈的实现。三栈端口与命令见 [技术栈参考](../reference/stacks.md)。

## 三栈映射

| 关注点 | React | Vue | Angular |
| --- | --- | --- | --- |
| 页面文件 | `src/pages/reports/sales/index.tsx` | `src/views/reports/SalesView.vue` | `src/app/pages/reports/sales/sales-page.component.ts` |
| 路由注册 | `import.meta.glob` 自动收集 | `src/router/index.ts` 的 children | `src/app/app.routes.ts` 的 `page()` |
| 容器跳转 | `containerPaths` 自动推导 | `CONTAINER_PATHS` 常量 | `container('reports')` |
| 页面守卫 | `layout.tsx` 的 `access.canView` | `router.beforeEach` | `permissionGuard` |
| 菜单标题 | `menu.*` i18n key，数据库名兜底 | `config/permissions.json` + `menuTitle()` | `core/permission-catalog.ts` + `menuLabel()` |
| 页面文案 | `src/locale/{zh-CN,en-US}.ts` | `src/i18n/{zh-CN,en-US}.ts` | `core/i18n.service.ts` 的 `EN` / `ZH` |
| 动作权限 | `<ActionAuth action="add">` | `<ActionAuth action="add">` | `auth.canAct(path, 'add')` |
| 样式骨架 | Tailwind 语义类 | `.orange-*` + Vuetify | `.page` / `.panel` + Material |
| 单元测试 | Vitest，`src/**/*.test.ts` | Vitest，`src/**/*.test.ts` | `ng test`（Vitest builder） |

## Vue

1. 新建 `frontend/vue/src/views/reports/SalesView.vue`：

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ActionAuth from '@/components/ActionAuth.vue'

const { t } = useI18n()
</script>

<template>
  <div class="orange-root">
    <v-card variant="flat">
      <v-card-title>{{ t('page.reports.sales.title') }}</v-card-title>
      <v-card-text class="d-flex align-center justify-space-between">
        <span class="text-medium-emphasis">{{ t('page.reports.sales.desc') }}</span>
        <ActionAuth action="add">
          <v-btn color="primary">{{ t('button.add') }}</v-btn>
        </ActionAuth>
      </v-card-text>
    </v-card>
  </div>
</template>
```

2. 在 `src/router/index.ts` 的 `/` children 中注册路由，并把 `/reports` 加入 `CONTAINER_PATHS`：

```ts
export const CONTAINER_PATHS = [
  '/dashboard', '/chart', '/map', '/three', '/component', '/system', '/reports',
]

{
  path: 'reports/sales',
  name: 'reports-sales',
  component: () => import('@/views/reports/SalesView.vue'),
},
```

`router.beforeEach` 会用 `createAccess(auth.currentPermissions)` 调 `canView(to.path)`；不通过时跳 `/forbidden`。`/reports` 本身不是页面，必须放进 `CONTAINER_PATHS` 才会交给 `MenuRedirect` 取第一个可见叶子。

3. 在 `src/i18n/zh-CN.ts` 与 `en-US.ts` 各加 `page.reports.sales.title`、`page.reports.sales.desc`；`button.add` 已存在。Vue 的菜单标题不读这些 key，而是由 `src/lib/menu-title.ts` 从 `src/config/permissions.json` 按 Page Path 取 `name.zh` / `name.en`，缺失时回退后端名称。

4. 验证：

```bash
cd frontend/vue
pnpm test
pnpm typecheck
pnpm dev      # http://localhost:5174
```

## Angular

1. 新建 `frontend/angular/src/app/pages/reports/sales/sales-page.component.ts`：

```ts
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/auth.service';
import { TranslatePipe } from '../../../core/translate.pipe';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, TranslatePipe],
  template: `
    <div class="page">
      <mat-card appearance="outlined" class="panel">
        <mat-card-title>{{ 'page.reports.sales.title' | t }}</mat-card-title>
        <mat-card-content class="toolbar-row">
          <span class="muted">{{ 'page.reports.sales.desc' | t }}</span>
          @if (auth.canAct('/reports/sales', 'add')) {
            <button mat-flat-button color="primary">{{ 'button.add' | t }}</button>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class SalesPageComponent {
  readonly auth = inject(AuthService);
}
```

2. 在 `src/app/app.routes.ts` 的 Shell children 中加路由，并加容器节点：

```ts
page('/reports/sales', '/reports/sales', () =>
  import('./pages/reports/sales/sales-page.component').then(
    (m) => m.SalesPageComponent,
  ),
),
container('reports'),
```

`page()` 自动挂 `permissionGuard`，守卫读取 `data.path` 并调 `auth.canView`；`container()` 让 `/reports` 重定向到第一个可见叶子。

3. 在 `src/app/core/i18n.service.ts` 的 `EN` 与 `ZH` 两个字典中加同样的两个 key。Angular 没有独立的 locale 文件，所有文案都在这个服务里。

4. 在 `src/app/core/permission-catalog.ts` 手工镜像 `database/permissions.json` 的三个节点，并把 id 加进 `ROLE_PERMISSIONS.super`。这个文件不会随 `permissions:sync` 更新；漏掉它时，Angular 的 mock 后端不会返回该菜单，真实后端下菜单标签也只能回退数据库名称。

5. 验证：

```bash
cd frontend/angular
npm test
npm run build
npm start     # http://localhost:4200
```

## 差异与检查

| 检查项 | Vue | Angular |
| --- | --- | --- |
| 容器路径 | 必须改 `CONTAINER_PATHS` | 必须加 `container('reports')` |
| 菜单权限来源 | 自动同步的 `config/permissions.json` | 手写 `core/permission-catalog.ts` |
| 页面文案 | `src/i18n/*` | `core/i18n.service.ts` |
| 守卫位置 | 全局 `router.beforeEach` | 路由级 `permissionGuard` |
| 样式入口 | `src/styles/main.css` | `src/styles.scss` |

三栈都遵循同一规则：目录权限只控制菜单可见性；动作权限必须匹配同一 Page Path 与 `action`；角色切换只改变前端视图，不改变后端 Authority。移植后的视觉与行为要求见 [移植与偏差](../explanation/porting-and-deviations.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/vue/src/router/index.ts、frontend/vue/src/lib/menu-title.ts、frontend/vue/src/components/ActionAuth.vue、frontend/vue/src/i18n/zh-CN.ts、frontend/vue/src/views/system/UserView.vue、frontend/angular/src/app/app.routes.ts、frontend/angular/src/app/core/guards.ts、frontend/angular/src/app/core/permission-catalog.ts、frontend/angular/src/app/core/i18n.service.ts、frontend/angular/src/styles.scss、database/permissions.json、scripts/sync-permission-catalog.mjs
