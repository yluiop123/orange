# 用 React 新增一个受权限保护的页面

本页带你在 React 栈里从零添加一个页面 `/reports/sales`，并让它同时受菜单权限、操作权限、i18n 与主题 token 约束；适合第一次改这个前端的开发者。

## 前提

- 仓库已克隆，`frontend/react` 依赖已安装（`pnpm install`）。
- 本地开发默认启用 mock：`frontend/react/.env.development` 中 `VITE_MOCK_ENABLE=true`。
- 演示账号 `super / super`，权限目录的权威文件是 `database/permissions.json`。

## 目标结果

完成后应得到：

- 侧边栏出现「报表 → 销售报表」，路径为 `/reports/sales`。
- 直接访问 `http://localhost:5173/#/reports/sales` 可打开页面。
- 只有拥有 `action#/reports/sales:add` 的账号能看到「新增」按钮。
- 中文、英文文案随语言切换，浅色、深色与配色主题都正常。

## 步骤 1：创建页面文件

路由由文件树自动生成，不需要改路由表。新建 `frontend/react/src/pages/reports/sales/index.tsx`：

```tsx
import ActionAuth from "@/components/action-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIntl } from "react-intl";

export default function SalesReport() {
  const intl = useIntl();
  return (
    <div className="flex h-[calc(100svh-4rem)] w-full flex-col gap-3 p-3">
      <Card>
        <CardHeader>
          <CardTitle>
            {intl.formatMessage({ id: "page.reports.sales.title" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {intl.formatMessage({ id: "page.reports.sales.desc" })}
          </p>
          <ActionAuth action="add">
            <Button>{intl.formatMessage({ id: "button.add" })}</Button>
          </ActionAuth>
        </CardContent>
      </Card>
    </div>
  );
}
```

`src/lib/page-routes.ts` 用 `import.meta.glob("../pages/**/index.tsx")` 收集页面：文件必须命名为 `index.tsx`，路径即 `/reports/sales`。`App.tsx` 会为它注册懒加载路由，并为 `/reports` 这样的父路径生成容器跳转。

## 步骤 2：登记菜单权限

编辑 `database/permissions.json`，在 `permissions` 数组中加入目录、菜单和操作三个节点：

```json
{
  "id": "0006",
  "name": { "zh": "报表", "en": "Reports" },
  "path": "/reports",
  "action": null,
  "type": "directory",
  "status": "1",
  "parentId": null
},
{
  "id": "000600",
  "name": { "zh": "销售报表", "en": "Sales Report" },
  "path": "/reports/sales",
  "action": null,
  "type": "menu",
  "status": "1",
  "parentId": "0006"
},
{
  "id": "00060000",
  "name": { "zh": "新增", "en": "Add" },
  "path": "/reports/sales",
  "action": "add",
  "type": "action",
  "status": "1",
  "parentId": "000600"
}
```

再把 `0006`、`000600`、`00060000` 加入 `rolePermissions.super`。业务编码规则：权限根编码 4 位，子级编码在父编码后追加 2 位，即子级长度等于父级长度加 2；同级顺序由编码决定。

在仓库根目录执行同步，把权威目录复制给 React 与 Vue 的 mock：

```bash
npm run permissions:sync
```

Angular 不读取这个文件，它维护手写镜像 `frontend/angular/src/app/core/permission-catalog.ts`；跨栈添加同一页面时见 [在 Vue 与 Angular 里新增页面](./add-a-page.md)。

## 步骤 3：补齐 i18n

React 的菜单标题用 `menu.<path>` 形式的 key，后端返回的 `name` 只作兜底。在 `src/locale/zh-CN.ts` 与 `src/locale/en-US.ts` 各加四项：

```ts
'menu.reports': '报表',
'menu.reports.sales': '销售报表',
'page.reports.sales.title': '销售报表',
'page.reports.sales.desc': '按区域汇总的销售数据。',
```

英文文件对应 `Reports`、`Sales Report`、`Sales report`、`Sales totals by region.`。缺 key 时菜单会退回数据库名称，但页面文案会直接显示 key。

## 步骤 4：操作权限

`ActionAuth` 读取当前 `pathname` 与用户 `currentPermission`，只在存在同路径、同 `action` 的动作权限时渲染子节点：

```tsx
<ActionAuth action="add">
  <Button>新增</Button>
</ActionAuth>
```

目录权限只影响菜单可见性，不授予任何接口调用权；真正的写操作仍由后端按 Authority 拒绝。角色切换只是前端视图过滤，不会降低后端权限。

## 步骤 5：样式 token

页面只用 Tailwind 语义类：`bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`、`rounded-lg`。这些类在 `src/index.css` 中映射到 `--background`、`--foreground`、`--muted-foreground`、`--border`、`--radius`，因此深浅色和七套配色会自动生效，不要写死 `#fff` 或 `gray-100`。

系统管理类页面常用骨架是 `flex h-[calc(100svh-4rem)] w-full flex-col p-3`，其中 `4rem` 对应 `src/components/site-header.tsx` 的 `h-16`。完整 token 见 [设计系统](./design-system.md)。

## 步骤 6：验证

```bash
cd frontend/react
pnpm test        # vitest run
pnpm typecheck   # tsc -b
pnpm dev         # http://localhost:5173
```

预期：

1. `pnpm test` 全部通过。`src/config/permissions.test.ts` 会双向校验：每个叶子菜单权限都必须有页面，每个页面都必须有菜单权限；它还会检查 `database/postgres/dml.sql` 的生成区块与目录 id 一致。
2. `pnpm typecheck` 无错误。
3. 用 `super` 登录后侧边栏出现「报表」，进入页面能看到「新增」。
4. 把角色切到 `user`（只有 `/dashboard` 目录权限），当前页会跳到第一个可见叶子；直接访问 `/reports/sales` 会落到 `/forbidden`。
5. 切换语言后菜单和正文都变；切换深浅色与配色后颜色跟随。

## 翻车排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 访问 `/reports/sales` 得到 404 | 文件名不是 `index.tsx`，或路径层级不对 | 确认文件为 `src/pages/reports/sales/index.tsx`，重启 dev server |
| 页面能开但侧边栏没有入口 | 菜单权限没有授权给当前角色 | 检查 `rolePermissions.super` 是否包含 `0006`、`000600` |
| 直接访问跳到 `/forbidden` | Page Path 不一致（大小写、末尾斜杠） | 让路由路径、权限 `path`、`ActionAuth` 所在路径完全一致 |
| 「新增」按钮不显示 | 缺少 `action` 权限，或 action 名不是 `add` | 检查 `type: "action"` 节点的 `path` 与 `action` |
| 菜单显示 key 原文 | 只加了页面文案，没加 `menu.reports*` | 两个 locale 文件都补齐 `menu.*` |

## 下一步

- 把同一页面移植到 Vue 与 Angular：[在 Vue 与 Angular 里新增页面](./add-a-page.md)
- 切换 mock 与真实后端：[连接 API 与 mock](./connect-api-and-mocks.md)
- 权限模型与术语：[权限模型](../reference/permission-model.md) · [前端架构](./architecture.md)

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/src/lib/page-routes.ts、frontend/react/src/App.tsx、frontend/react/src/layout.tsx、frontend/react/src/config/permissions.json、frontend/react/src/config/permissions.test.ts、frontend/react/src/store/access.ts、frontend/react/src/components/action-auth.tsx、frontend/react/src/locale/zh-CN.ts、frontend/react/src/index.css、database/permissions.json、scripts/sync-permission-catalog.mjs
