# 设计 token 与视觉规范

本页是三套前端共用的视觉查询表：颜色、字体、间距、圆角、暗色主题，以及同一 token 在 Tailwind、Vuetify、Material 里的落点。

## 口径

React 的 `src/index.css` 定义默认中性 token；`src/themes/*.css` 定义 7 套可选配色。Vue 在 `src/main.ts` 的 Vuetify theme 里复用同一组十六进制值；Angular 在 `src/styles.scss` 把 `--app-*` 映射到 `--mat-sys-*`。旧 `frontend/docs/STYLE-GUIDE.md` 只作线索，本页数值以代码为准；与该指南的差异列在文末。

## 颜色 token（默认中性色）

React 使用 OKLCH；Vue/Angular 使用等价的十六进制。下表的“浅色/深色”对应 `<html class="dark">` 的开关。

| Token | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--background` | `oklch(1 0 0)` / `#ffffff` | `oklch(0.145 0 0)` / `#0a0a0a` | 页面底色 |
| `--foreground` | `oklch(0.145 0 0)` / `#18181b` | `oklch(0.985 0 0)` / `#fafafa` | 主文字 |
| `--card` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | 卡片、面板 |
| `--primary` | `oklch(0.205 0 0)` / `#18181b` | `oklch(0.985 0 0)` / `#fafafa` | 主按钮、选中态 |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | 主色上的文字 |
| `--secondary` / `--muted` | `oklch(0.97 0 0)` / `#f4f4f5` | `oklch(0.269 0 0)` / `#27272a` | 次级表面、表头 |
| `--muted-foreground` | `oklch(0.556 0 0)` / `#71717a` | `oklch(0.708 0 0)` / `#a1a1aa` | 次要文字 |
| `--border` / `--input` | `oklch(0.922 0 0)` / `#e4e4e7` | `oklch(0.269 0 0)` / `#3f3f46` | 边框、输入框 |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.439 0 0)` | 焦点环 |
| `--destructive` | `oklch(0.577 0.245 27.325)` / `#ef4444` | `oklch(0.396 0.141 25.723)` | 删除、错误 |
| `--sidebar` | `oklch(0.985 0 0)` / `#fafafa` | `oklch(0.205 0 0)` / `#18181b` | 侧边栏 |
| `--sidebar-active` | `oklch(0.93 0 0)` / `#e7e7e7` | `oklch(0.269 0 0)` / `#27272a` | 当前菜单项 |

图表另有 `--chart-1` 到 `--chart-5`；默认值在 `src/index.css`，配色主题会把它们替换成同色系的 100%/80%/60%/40%/20% 梯度。

## 可选配色

`src/store/theme.ts` 支持 `default`、`blue`、`green`、`orange`、`red`、`rose`、`violet`、`yellow`。选中非默认色时，`<html>` 加 `theme-<color>`；每个文件同时定义浅色与 `.dark` 的 `--primary`。

| 配色 | 浅色 `--primary` | 深色 `--primary` |
| --- | --- | --- |
| `blue` | `oklch(0.623 0.214 259.815)` | `oklch(0.546 0.245 262.881)` |
| `green` | `oklch(0.723 0.219 149.579)` | `oklch(0.696 0.17 162.48)` |
| `orange` | `oklch(0.705 0.213 47.604)` | `oklch(0.646 0.222 41.116)` |
| `red` | `oklch(0.637 0.237 25.331)` | 同左 |
| `rose` | `oklch(0.645 0.246 16.439)` | 同左 |
| `violet` | `oklch(0.606 0.25 292.717)` | `oklch(0.541 0.281 293.009)` |
| `yellow` | `oklch(0.795 0.184 86.047)` | 同左 |

默认配色的主色是中性色，不是橙色；橙色只是品牌色与可选色之一。Vue/Angular 的颜色选择器使用十六进制：blue `#2b7fff`（深色 `#155dfc`）、green `#22c55e`、orange `#f97316`、red `#ef4444`、rose `#f43f5e`、violet `#8b5cf6`、yellow `#eab308`。

## 字体

三套都使用系统 UI 栈，不加载 Web Font：

```text
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
```

React 未覆盖 Tailwind 的默认 `font-sans`，因此等价；Vue 的变量名是 `--orange-font`，Angular 是 `$app-font`（同时暴露 `--orange-font`）。字号取自 Vue/Angular 的共享排版类：

| 类 | 字号/行高/字重 | 用途 |
| --- | --- | --- |
| `.orange-title` | `1.25rem / 1.75rem / 700` | 页面标题 |
| `.orange-type-h1` | `2.25rem / 2.5rem / 700` | 大标题 |
| `.orange-type-h2` | `1.875rem / 2.25rem / 600` | 区块标题 |
| `.orange-subtitle` | `1.125rem / 1.75rem / 500` | 小节标题 |
| `.orange-type-p` | `1rem / 1.75rem / 400` | 正文 |

## 间距、尺寸与圆角

| 项 | 值 | 来源 |
| --- | --- | --- |
| 侧边栏宽度 | `16rem` | React `SIDEBAR_WIDTH`、Vue `--orange-sidebar-width`、Angular `--app-sidebar-width` |
| 侧边栏收起宽度 | `3rem` | React `SIDEBAR_WIDTH_ICON`、Vue `--orange-sidebar-rail-width` |
| 移动端侧边栏 | `18rem` | React `SIDEBAR_WIDTH_MOBILE`、Vue `--orange-sidebar-mobile-width` |
| 顶栏高度 | `4rem` | React `h-16`、Vue `--orange-header-height`、Angular `--app-header-height` |
| 页面内边距 | `0.75rem` | React 系统页 `p-3`、Vue `--orange-page-padding`、Angular `--app-page-padding` |
| 内容间距 | `1rem` | React `gap-4`、Vue/Angular `--*-content-gap` |
| 默认圆角 | `0.625rem` | React `--radius` |
| 配色主题圆角 | `0.65rem` | `src/themes/*.css`、Vue `--orange-radius`、Angular `--app-radius` |
| 表格行高 | `2.5rem` | Angular `--mat-table-*-container-height` |
| 按钮高度 | `2.25rem` | React shadcn `h-9`、Angular `--mat-button-*-container-height` |

Tailwind 的 `rounded-lg` 读 `--radius`，所以默认是 `0.625rem`；切到配色主题后是 `0.65rem`。Vue/Angular 直接使用 `0.65rem`。

## 暗色主题

| 栈 | 开关 | 持久化 key | 应用方式 |
| --- | --- | --- | --- |
| React | `useThemeStore.setMode` | `theme-mode`、`theme-color` | `<html class="dark">` + `theme-<color>` |
| Vue | `useUiStore.setDark` | `orange.theme`、`orange.color` | `theme.change('dark')`，默认深色 |
| Angular | `ShellComponent` 的 `dark` signal | `orange.angular.theme`、`orange.angular.color` | `<html class="dark">`，默认深色 |

三套都默认深色，只有显式存过 `light` 才用浅色。深色下表面、边框、次要文字同步切换；图表与地图页面各自还有暗色画布，不跟随全局 token。

## 三栈映射

| 概念 | React（Tailwind） | Vue（Vuetify） | Angular（Material + CSS 变量） |
| --- | --- | --- | --- |
| 页面背景 | `bg-background` | `--v-theme-background` | `--app-background` / `--mat-sys-background` |
| 卡片表面 | `bg-card` | `--v-theme-surface` | `--app-card` / `--mat-sys-surface` |
| 主文字 | `text-foreground` | `--v-theme-on-surface` | `--app-foreground` / `--mat-sys-on-surface` |
| 次要文字 | `text-muted-foreground` | `--v-theme-on-surface-variant` | `--app-muted-foreground` |
| 边框 | `border-border` | `--v-border-color` | `--app-border` / `--mat-sys-outline-variant` |
| 主色 | `bg-primary` | `colors.primary` | `--app-primary` / `--mat-sys-primary` |
| 圆角 | `rounded-lg` | `--orange-radius` | `--app-radius` / `--mat-sys-corner-*` |
| 字体 | Tailwind 默认栈 | `--orange-font` | `$app-font` / `--orange-font` |
| 侧边栏选中 | `bg-sidebar-active` | `colors['sidebar-active']` | `--app-sidebar-active` |

Vuetify 的主题值在 `src/main.ts`，例如浅色 `primary: '#18181b'`、`background: '#ffffff'`、`border: '#e4e4e7'`，深色 `background: '#0a0a0a'`、`surface: '#18181b'`、`primary: '#fafafa'`。Angular 的 `--app-*` 与这些十六进制一一对应，并额外映射 `--mat-sys-*` 供 Material 组件读取。

## 页面骨架类名

| 栈 | 类名/组合 | 说明 |
| --- | --- | --- |
| React | `flex h-[calc(100svh-4rem)] w-full flex-col p-3` | 系统列表页，占满顶栏以下高度 |
| React | `flex flex-col gap-3 p-3` | 普通内容页；卡片用 `Card` 组件 |
| Vue | `.orange-root` | `padding: 0.75rem` |
| Vue | `.orange-page`、`.orange-grid`、`.orange-row`、`.orange-section` | 纵向页面、响应式网格、横排、区块 |
| Angular | `.page` | 纵向布局，`padding: var(--app-page-padding)`，`gap: 1rem` |
| Angular | `.panel`、`.panel-title` | 卡片表面、边框、圆角与标题行 |
| Angular | `.system-page`、`.system-toolbar`、`.system-table` | 系统列表页的整页骨架 |

## 与旧 STYLE-GUIDE 的差异

- 旧指南写顶栏 `3rem`，代码三套都是 `4rem`。
- 旧指南写 Primary `#f97316`，代码默认主色是中性色 `#18181b` / `#fafafa`；`#f97316` 只在 `theme-orange` 配色里出现。
- 旧指南写按钮 `2rem`，React shadcn 按钮与 Angular Material 按钮实际是 `2.25rem`。
- 旧指南写圆角统一 `0.65rem`，React 默认 `--radius` 是 `0.625rem`，只有配色主题是 `0.65rem`。

做截图对比时以本页与代码为准；视觉验收脚本是 `scripts/e2e/parity.mjs`，判定口径见脚本头注释。

> Last verified: 24826bb · 2026-11-07
> 事实来源: frontend/react/src/index.css、frontend/react/src/themes/*.css、frontend/react/src/store/theme.ts、frontend/react/src/components/ui/sidebar.tsx、frontend/react/src/components/site-header.tsx、frontend/react/src/components/color-switcher.tsx、frontend/vue/src/main.ts、frontend/vue/src/styles/main.css、frontend/vue/src/components/layout/AppHeader.vue、frontend/vue/src/stores/ui.ts、frontend/angular/src/styles.scss、frontend/angular/src/app/layout/shell.component.ts、frontend/angular/src/app/shared/theme-toggle.component.ts、scripts/e2e/parity.mjs
