<script setup lang="ts">
import { ref } from 'vue'
import DemoSection from '@/components/demo/DemoSection.vue'


const tab = ref('divider')
const gap = ref('16')
const gapOptions = [
  { title: '8 px', value: '8' },
  { title: '16 px', value: '16' },
  { title: '24 px', value: '24' },
  { title: '32 px', value: '32' },
]

const collapsed = ref(false)
const controlled = ref(false)
const reverseArrow = ref(false)
</script>

<template>
  <div class="demo-page">

    <v-tabs v-model="tab" color="primary">
      <v-tab value="divider">Divider</v-tab>
      <v-tab value="flex">Flex</v-tab>
      <v-tab value="grid">Grid</v-tab>
      <v-tab value="layout">Layout</v-tab>
      <v-tab value="space">Space</v-tab>
      <v-tab value="resizable">Resizable</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Divider -->
      <v-window-item value="divider">
        <div class="demo-grid">
          <DemoSection
            title="Basic & dashed divider"
            subtitle="Solid and dashed separators between content blocks"
          >
            <div class="divider-sample">
              <p class="text-body-2">Content above the divider / 分割线上方的内容。</p>
              <v-divider />
              <p class="text-body-2">Content below the divider / 分割线下方的内容。</p>
            </div>
            <div class="divider-sample">
              <p class="text-body-2">Dashed divider keeps the same rhythm with a lighter weight.</p>
              <div class="dashed-divider" />
              <p class="text-body-2 text-medium-emphasis">Dashed / 虚线 example.</p>
            </div>
          </DemoSection>

          <DemoSection title="Divider with text" subtitle="Center, left and right label alignment">
            <div class="divider-sample">
              <div class="text-divider">居中标题 / Center Title</div>
              <div class="text-divider text-divider--left">Left</div>
              <div class="text-divider text-divider--right">Right</div>
            </div>
            <p class="demo-note">
              The label is rendered between two flex lines, so the divider length always fills the
              card.
            </p>
          </DemoSection>

          <DemoSection
            title="Vertical, size & color"
            subtitle="Inline separation plus thickness and semantic colors"
          >
            <div class="inline-divider">
              <span class="text-body-2">Item A / 内容A</span>
              <v-divider vertical inset />
              <span class="text-body-2">Item B / 内容B</span>
              <v-divider vertical inset />
              <span class="text-body-2">Item C / 内容C</span>
            </div>
            <div class="divider-sample">
              <v-divider :thickness="1" />
              <v-divider :thickness="2" color="primary" />
              <v-divider :thickness="3" color="error" />
              <v-divider :thickness="3" color="success" />
            </div>
          </DemoSection>

          <DemoSection
            title="Form grouping"
            subtitle="A text divider separates account and security fields"
          >
            <div class="form-grid">
              <v-text-field label="Username / 用户名" placeholder="Enter username" hide-details />
              <v-text-field label="Email / 邮箱" placeholder="Enter email" hide-details />
            </div>
            <div class="text-divider">账户信息 / Account Information</div>
            <div class="form-grid">
              <v-text-field type="password" label="Password / 密码" hide-details />
              <v-text-field type="password" label="Confirm Password / 确认密码" hide-details />
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Flex -->
      <v-window-item value="flex">
        <div class="demo-grid">
          <DemoSection
            title="Flex Row 横向布局"
            subtitle="flex-1 automatically divides the remaining space"
          >
            <div class="flex-row">
              <div class="flex-cell tint-sky">flex-1</div>
              <div class="flex-cell tint-rose">flex-1</div>
            </div>
            <div class="flex-row">
              <div class="flex-cell tint-sky">flex-1</div>
              <div class="flex-cell tint-amber">flex-1</div>
              <div class="flex-cell tint-emerald">flex-1</div>
            </div>
          </DemoSection>

          <DemoSection
            title="Flex Basis 固定比例"
            subtitle="Use flex-basis for fixed proportions inside a row"
          >
            <div class="flex-row">
              <div class="flex-cell basis-1-3 tint-green">basis-1/3</div>
              <div class="flex-cell basis-2-3 tint-yellow">basis-2/3</div>
            </div>
            <div class="flex-row">
              <div class="flex-cell basis-1-4 tint-purple">basis-1/4</div>
              <div class="flex-cell basis-1-4 tint-pink">basis-1/4</div>
              <div class="flex-cell basis-1-2 tint-indigo">basis-1/2</div>
            </div>
          </DemoSection>

          <DemoSection
            title="Flex Offset 偏移布局"
            subtitle="margin-left / margin-right auto pushes elements apart"
          >
            <div class="flex-row">
              <div class="flex-cell basis-1-3 tint-purple">basis-1/3</div>
              <div class="flex-cell basis-1-3 push-right tint-pink">ml-auto</div>
            </div>
            <div class="flex-row">
              <div class="flex-cell basis-1-4 push-right tint-sky">ml-auto</div>
              <div class="flex-cell basis-1-4 push-left tint-cyan">mr-auto</div>
            </div>
          </DemoSection>

          <DemoSection
            title="Flex Align 对齐方式"
            subtitle="Horizontal justify-* and vertical items-* alignment"
          >
            <div class="align-block">
              <div class="label-line">justify-start / center / end / between</div>
              <div class="align-row justify-start">
                <span class="align-chip tint-sky">start</span>
              </div>
              <div class="align-row justify-center">
                <span class="align-chip tint-amber">center</span>
              </div>
              <div class="align-row justify-end">
                <span class="align-chip tint-emerald">end</span>
              </div>
              <div class="align-row justify-between">
                <span class="align-chip tint-purple">between</span>
                <span class="align-chip tint-rose">between</span>
              </div>
            </div>
            <div class="align-block">
              <div class="label-line">items-start / center / end</div>
              <div class="align-row align-row--tall align-start">
                <span class="align-chip tint-sky">start</span>
                <span class="align-chip align-chip--tall tint-amber">taller</span>
              </div>
              <div class="align-row align-row--tall align-center">
                <span class="align-chip tint-emerald">center</span>
                <span class="align-chip align-chip--tall tint-purple">taller</span>
              </div>
              <div class="align-row align-row--tall align-end">
                <span class="align-chip tint-rose">end</span>
                <span class="align-chip align-chip--tall tint-indigo">taller</span>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="Flex Wrap 换行布局"
            subtitle="Items wrap onto new lines when the container is narrow"
          >
            <div class="align-row flex-wrap">
              <div v-for="index in 8" :key="index" class="wrap-cell">Item {{ index }}</div>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Grid -->
      <v-window-item value="grid">
        <div class="demo-grid">
          <DemoSection
            title="基础网格布局 / Basic Grid"
            subtitle="Two, three and four equal columns"
          >
            <div class="grid-sample">
              <div class="label-line">Two equal columns (12 + 12)</div>
              <div class="css-grid grid-2">
                <div class="grid-cell tint-sky">w-1/2 (50%)</div>
                <div class="grid-cell tint-rose">w-1/2 (50%)</div>
              </div>
            </div>
            <div class="grid-sample">
              <div class="label-line">Three equal columns (8 + 8 + 8)</div>
              <div class="css-grid grid-3">
                <div class="grid-cell tint-green">w-1/3</div>
                <div class="grid-cell tint-yellow">w-1/3</div>
                <div class="grid-cell tint-purple">w-1/3</div>
              </div>
            </div>
            <div class="grid-sample">
              <div class="label-line">Four equal columns (6 + 6 + 6 + 6)</div>
              <div class="css-grid grid-4">
                <div v-for="index in 4" :key="index" class="grid-cell tint-blue">w-1/4</div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="不等宽网格布局 / Unequal Grid"
            subtitle="Mixed column ratios for content-heavy layouts"
          >
            <div class="grid-sample">
              <div class="label-line">One wide, two narrow (12 + 6 + 6)</div>
              <div class="css-grid grid-wide">
                <div class="grid-cell tint-sky">w-1/2 (50%)</div>
                <div class="grid-cell tint-rose">w-1/4</div>
                <div class="grid-cell tint-emerald">w-1/4</div>
              </div>
            </div>
            <div class="grid-sample">
              <div class="label-line">Golden ratio (8 + 4)</div>
              <div class="css-grid grid-golden">
                <div class="grid-cell tint-amber">w-2/3 (66.66%)</div>
                <div class="grid-cell tint-indigo">w-1/3 (33.33%)</div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="响应式网格 / Responsive Grid"
            subtitle="auto-fit + minmax adapts from one to many columns on resize"
          >
            <div class="css-grid grid-auto">
              <div v-for="index in 8" :key="index" class="grid-cell grid-cell--tall tint-blue">
                Grid Item {{ index }}
              </div>
            </div>
            <div class="css-grid grid-span">
              <div class="grid-cell tint-green">Cell A</div>
              <div class="grid-cell grid-cell--row-span tint-amber">Row Span 2</div>
              <div class="grid-cell tint-rose">Cell B</div>
              <div class="grid-cell tint-violet">Cell C</div>
            </div>
            <p class="demo-note">
              Drag the browser window to see the auto-fit column count change. The second grid shows
              an item spanning two rows.
            </p>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Layout -->
      <v-window-item value="layout">
        <div class="demo-grid">
          <DemoSection
            title="基础布局示例 / Basic Layout"
            subtitle="Header, collapsible sider, content cards and footer"
          >
            <div class="app-shell">
              <div class="app-shell__header">
                <span class="app-shell__brand">我的应用 / My Application</span>
                <v-chip size="x-small" variant="tonal">demo</v-chip>
              </div>
              <div class="app-shell__body">
                <aside
                  class="app-shell__sider"
                  :class="{ 'app-shell__sider--collapsed': collapsed }"
                >
                  <v-btn
                    :icon="collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
                    variant="text"
                    size="x-small"
                    class="sider-toggle"
                    aria-label="Toggle sidebar"
                    @click="collapsed = !collapsed"
                  />
                  <v-list v-if="!collapsed" density="compact" nav class="sider-list">
                    <v-list-item prepend-icon="mdi-home-outline" title="首页 / Home" active />
                    <v-list-item
                      prepend-icon="mdi-account-multiple-outline"
                      title="用户管理 / Users"
                    />
                    <v-list-item prepend-icon="mdi-cog-outline" title="设置 / Settings" />
                  </v-list>
                </aside>
                <div class="app-shell__content">
                  <h3 class="content-title">主内容区域 / Main Content Area</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    The content area grows to fill the remaining width and stacks its cards
                    responsively.
                  </p>
                  <div class="mini-card-grid">
                    <div v-for="index in 3" :key="index" class="mini-card">
                      <div class="mini-card__title">Card {{ index }}</div>
                      <div class="mini-card__line" />
                      <div class="mini-card__line mini-card__line--short" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="app-shell__footer">© 2026 MyApp - 版权所有 / All Rights Reserved</div>
            </div>
          </DemoSection>

          <DemoSection
            title="受控折叠示例 / Controlled Collapse"
            subtitle="External buttons control the sider state"
          >
            <div class="row">
              <v-btn color="primary" @click="controlled = !controlled">
                {{ controlled ? '展开 / Expand' : '折叠 / Collapse' }} 侧边栏
              </v-btn>
              <v-btn variant="outlined" @click="controlled = false">展开 / Expand</v-btn>
              <v-btn variant="outlined" @click="controlled = true">折叠 / Collapse</v-btn>
            </div>
            <div class="app-shell">
              <div class="app-shell__header app-shell__header--muted">
                <span class="app-shell__brand">受控布局 / Controlled Layout</span>
              </div>
              <div class="app-shell__body">
                <aside
                  class="app-shell__sider"
                  :class="{ 'app-shell__sider--collapsed': controlled }"
                >
                  <v-list v-if="!controlled" density="compact" nav class="sider-list">
                    <v-list-item
                      prepend-icon="mdi-numeric-1-circle-outline"
                      title="Navigation Item 1"
                    />
                    <v-list-item
                      prepend-icon="mdi-numeric-2-circle-outline"
                      title="Navigation Item 2"
                    />
                    <v-list-item
                      prepend-icon="mdi-numeric-3-circle-outline"
                      title="Navigation Item 3"
                    />
                  </v-list>
                </aside>
                <div class="app-shell__content">
                  <p class="text-body-2">
                    This sidebar uses a controlled collapse state. Use the buttons above to expand
                    or collapse it without touching the sidebar itself.
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    这是一个使用受控折叠状态的侧边栏示例。
                  </p>
                </div>
              </div>
            </div>
            <div class="demo-note mono">collapsed: {{ controlled }}</div>
          </DemoSection>

          <DemoSection
            title="自定义图标 / Custom Icons"
            subtitle="Toggle the sider side and icon direction"
          >
            <v-switch
              v-model="reverseArrow"
              label="Reverse sider direction / 反向箭头"
              color="primary"
              density="compact"
              hide-details
            />
            <div class="app-shell app-shell--compact">
              <div class="app-shell__header app-shell__header--muted">
                <span class="app-shell__brand">
                  {{ reverseArrow ? '反向箭头 / Reverse Arrow' : '默认方向 / Default Direction' }}
                </span>
              </div>
              <div class="app-shell__body" :class="{ 'app-shell__body--reverse': reverseArrow }">
                <aside class="app-shell__sider app-shell__sider--wide">
                  <div class="sider-menu-line" />
                  <div class="sider-menu-line sider-menu-line--short" />
                  <div class="sider-menu-line sider-menu-line--short" />
                </aside>
                <div class="app-shell__content">
                  <p class="text-body-2">
                    {{
                      reverseArrow
                        ? 'The sider is placed on the right and the arrow points to the left.'
                        : 'The sider is placed on the left and the arrow points to the right.'
                    }}
                  </p>
                  <div class="icon-preview-row">
                    <span class="icon-preview">
                      <v-icon size="18">mdi-chevron-left</v-icon>
                    </span>
                    <span class="icon-preview icon-preview--round">
                      <v-icon size="16">mdi-chevron-right</v-icon>
                    </span>
                    <span class="icon-preview icon-preview--square">
                      <v-icon size="16">mdi-chevron-left</v-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Space -->
      <v-window-item value="space">
        <div class="demo-grid">
          <DemoSection
            title="水平与垂直间距 / Horizontal & Vertical"
            subtitle="The same gap applied along each axis"
          >
            <div class="space-box">
              <div class="flex-row">
                <v-btn variant="outlined">按钮一 / Button 1</v-btn>
                <v-btn variant="outlined">按钮二 / Button 2</v-btn>
                <v-btn variant="outlined">按钮三 / Button 3</v-btn>
              </div>
            </div>
            <div class="space-box space-box--inline">
              <div class="space-column">
                <div class="space-item">项目 1 / Item 1</div>
                <div class="space-item">项目 2 / Item 2</div>
                <div class="space-item">项目 3 / Item 3</div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="动态间距控制 / Dynamic Spacing"
            subtitle="Select a gap value and watch the row update"
          >
            <div class="gap-control">
              <span class="text-body-2">Select Gap / 选择间距</span>
              <v-select
                v-model="gap"
                :items="gapOptions"
                density="compact"
                hide-details
                style="max-width: 200px"
              />
              <span class="mono text-medium-emphasis">gap: {{ gap }}px</span>
            </div>
            <div class="space-box">
              <div class="flex-row" :style="{ gap: `${gap}px` }">
                <v-btn variant="outlined">按钮一 / Button 1</v-btn>
                <v-btn variant="outlined">按钮二 / Button 2</v-btn>
                <v-btn variant="outlined">按钮三 / Button 3</v-btn>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="对齐方式示例 / Alignment"
            subtitle="Different alignments with elements of varying heights"
          >
            <div class="align-block">
              <div class="label-line">items-start / 顶部对齐</div>
              <div class="align-row align-row--tall align-start">
                <v-btn variant="outlined" size="small" height="32">小 / Small</v-btn>
                <v-btn variant="outlined" height="48">中等 / Medium</v-btn>
                <v-btn variant="outlined" height="64">较大 / Large</v-btn>
              </div>
            </div>
            <div class="align-block">
              <div class="label-line">items-center / 居中对齐</div>
              <div class="align-row align-row--tall align-center">
                <v-btn variant="outlined" size="small" height="32">小 / Small</v-btn>
                <v-btn variant="outlined" height="48">中等 / Medium</v-btn>
                <v-btn variant="outlined" height="64">较大 / Large</v-btn>
              </div>
            </div>
            <div class="align-block">
              <div class="label-line">items-end / 底部对齐</div>
              <div class="align-row align-row--tall align-end">
                <v-btn variant="outlined" size="small" height="32">小 / Small</v-btn>
                <v-btn variant="outlined" height="48">中等 / Medium</v-btn>
                <v-btn variant="outlined" height="64">较大 / Large</v-btn>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="自动换行 & 分隔符 / Wrap & Separators"
            subtitle="Wrapping items and vertical separators inside a spaced row"
          >
            <div class="align-row flex-wrap">
              <v-btn v-for="index in 12" :key="index" variant="outlined" size="small">
                项目 {{ index }}
              </v-btn>
            </div>
            <div class="separator-row">
              <span>苹果 / Apple</span>
              <v-divider vertical inset />
              <span>橙子 / Orange</span>
              <v-divider vertical inset />
              <span>香蕉 / Banana</span>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Resizable -->
      <v-window-item value="resizable">
        <div class="demo-grid">
          <DemoSection
            title="横向调整大小 / Horizontal Resize"
            subtitle="Drag the bottom-right corner of the sidebar to resize it"
          >
            <div class="resize-row">
              <div class="resize-pane resize-pane--h">
                <div class="resize-pane__title">侧边栏 / Sidebar</div>
                <p class="resize-pane__hint">Drag this panel's corner · width 250px · min 160px</p>
              </div>
              <div class="resize-pane resize-pane--main">
                <div class="resize-pane__title">主内容区 / Main Content</div>
                <p class="resize-pane__hint">This panel fills the remaining space.</p>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="纵向调整大小 / Vertical Resize"
            subtitle="Drag the bottom edge of the top panel"
          >
            <div class="resize-v">
              <div class="resize-pane__title">头部区域 / Header Area</div>
              <p class="resize-pane__hint">height 170px · min 110px · max 320px</p>
            </div>
            <div class="resize-pane resize-pane--below">
              <div class="resize-pane__title">内容区域 / Content Area</div>
              <p class="resize-pane__hint">The content below adapts to the available height.</p>
            </div>
          </DemoSection>

          <DemoSection
            title="复杂嵌套布局 / Nested & Corner Resize"
            subtitle="Vertical nesting plus a panel resizable on both axes"
          >
            <div class="resize-row resize-row--tall">
              <div class="resize-pane resize-pane--h">
                <div class="resize-pane__title">侧边栏 (30%) / Sidebar</div>
                <div class="sider-menu-line" />
                <div class="sider-menu-line sider-menu-line--short" />
                <div class="sider-menu-line sider-menu-line--short" />
              </div>
              <div class="resize-nested">
                <div class="resize-pane resize-pane--top">
                  <div class="resize-pane__title">顶部区域 (40%) / Top Area</div>
                  <p class="resize-pane__hint">Nested vertical panes.</p>
                </div>
                <div class="resize-pane resize-pane--bottom">
                  <div class="resize-pane__title">底部区域 (60%) / Bottom Area</div>
                  <p class="resize-pane__hint">Drag the corner of this pane in two directions.</p>
                </div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="实际应用场景 / Code Editor"
            subtitle="A resizable file tree next to an editor surface"
          >
            <div class="editor-shell">
              <div class="editor-tree">
                <div class="editor-tree__head">文件树 / File Tree</div>
                <ul class="editor-tree__list mono">
                  <li>src/</li>
                  <li>components/</li>
                  <li>pages/</li>
                  <li>utils/</li>
                </ul>
              </div>
              <div class="editor-main">
                <div class="editor-main__head">编辑器 / Editor</div>
                <pre class="editor-code mono">
&lt;div class="container"&gt;
  &lt;h1&gt;Hello World&lt;/h1&gt;
&lt;/div&gt;</pre>
              </div>
            </div>
            <p class="demo-note">Drag the right edge of the file tree to widen it.</p>
          </DemoSection>
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.label-line {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Divider */
.divider-sample {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashed-divider {
  border-top: 1px dashed rgba(var(--v-border-color), 1);
}

.text-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
}

.text-divider::before,
.text-divider::after {
  content: '';
  flex: 1 1 auto;
  height: 1px;
  background: rgba(var(--v-border-color), 1);
}

.text-divider--left::before {
  flex: 0 0 24px;
}

.text-divider--right::after {
  flex: 0 0 24px;
}

.inline-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* Flex */
.flex-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.flex-cell {
  flex: 1 1 0;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.basis-1-3 {
  flex: 0 0 calc(33.333% - 8px);
}

.basis-2-3 {
  flex: 1 1 calc(66.666% - 8px);
}

.basis-1-4 {
  flex: 0 0 calc(25% - 9px);
}

.basis-1-2 {
  flex: 1 1 calc(50% - 6px);
}

.push-right {
  margin-left: auto;
}

.push-left {
  margin-right: auto;
}

.tint-sky {
  background: rgba(14, 165, 233, 0.16);
}
.tint-rose {
  background: rgba(244, 63, 94, 0.16);
}
.tint-amber {
  background: rgba(245, 158, 11, 0.18);
}
.tint-emerald {
  background: rgba(16, 185, 129, 0.16);
}
.tint-green {
  background: rgba(34, 197, 94, 0.16);
}
.tint-yellow {
  background: rgba(234, 179, 8, 0.18);
}
.tint-purple {
  background: rgba(168, 85, 247, 0.16);
}
.tint-pink {
  background: rgba(236, 72, 153, 0.16);
}
.tint-indigo {
  background: rgba(99, 102, 241, 0.16);
}
.tint-blue {
  background: rgba(59, 130, 246, 0.16);
}
.tint-cyan {
  background: rgba(6, 182, 212, 0.16);
}
.tint-violet {
  background: rgba(139, 92, 246, 0.16);
}

.align-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.align-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 8px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.align-row--tall {
  min-height: 92px;
}

.justify-start {
  justify-content: flex-start;
}
.justify-center {
  justify-content: center;
}
.justify-end {
  justify-content: flex-end;
}
.justify-between {
  justify-content: space-between;
}
.align-start {
  align-items: flex-start;
}
.align-center {
  align-items: center;
}
.align-end {
  align-items: flex-end;
}

.align-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.align-chip--tall {
  height: 64px;
}

.flex-wrap {
  flex-wrap: wrap;
}

.wrap-cell {
  width: 96px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(var(--v-border-color), 0.6);
  font-size: 12px;
}

/* Grid */
.grid-sample {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.css-grid {
  display: grid;
  gap: 12px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-wide {
  grid-template-columns: 2fr 1fr 1fr;
}
.grid-golden {
  grid-template-columns: 2fr 1fr;
}
.grid-auto {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.grid-span {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 64px;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.grid-cell--tall {
  min-height: 88px;
}

.grid-cell--row-span {
  grid-row: span 2;
}

/* Layout */
.app-shell {
  border: 1px solid rgba(var(--v-border-color), 0.8);
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.app-shell--compact {
  max-width: 640px;
}

.app-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.app-shell__header--muted {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), 0.6);
}

.app-shell__brand {
  font-size: 14px;
  font-weight: 650;
}

.app-shell__body {
  display: flex;
  min-height: 200px;
}

.app-shell__body--reverse {
  flex-direction: row-reverse;
}

.app-shell__body--reverse .app-shell__sider {
  border-right: none;
  border-left: 1px solid rgba(var(--v-border-color), 0.6);
}

.app-shell__sider {
  position: relative;
  flex: 0 0 220px;
  width: 220px;
  padding: 10px 8px;
  background: rgb(var(--v-theme-surface-variant));
  border-right: 1px solid rgba(var(--v-border-color), 0.6);
  transition:
    flex-basis 0.18s ease,
    width 0.18s ease,
    padding 0.18s ease;
  overflow: hidden;
}

.app-shell__sider--collapsed {
  flex-basis: 44px;
  width: 44px;
  padding: 10px 4px;
}

.app-shell__sider--wide {
  flex-basis: 140px;
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sider-toggle {
  margin-bottom: 6px;
}

.sider-list {
  background: transparent;
}

.app-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.content-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.mini-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.mini-card {
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
}

.mini-card__title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.mini-card__line {
  height: 6px;
  border-radius: 999px;
  background: rgba(128, 128, 140, 0.24);
  margin-bottom: 6px;
}

.mini-card__line--short {
  width: 60%;
  margin-bottom: 0;
}

.app-shell__footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(var(--v-border-color), 0.6);
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}

.sider-menu-line {
  height: 8px;
  width: 82%;
  border-radius: 999px;
  background: rgba(128, 128, 140, 0.28);
  margin-bottom: 10px;
}

.sider-menu-line--short {
  width: 58%;
}

.icon-preview-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.icon-preview {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface-variant));
}

.icon-preview--round {
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.icon-preview--square {
  border-radius: 2px;
  border: 1px solid rgba(var(--v-border-color), 0.9);
  background: transparent;
}

/* Space */
.space-box {
  padding: 16px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.space-box--inline {
  width: fit-content;
  max-width: 100%;
}

.space-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.space-item {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.6);
  font-size: 12px;
}

.gap-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.separator-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 13px;
}

/* Resizable */
.resize-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
  min-height: 170px;
}

.resize-row--tall {
  min-height: 220px;
}

.resize-pane {
  padding: 14px;
  border: 1px solid rgba(var(--v-border-color), 0.9);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: auto;
}

.resize-pane--h {
  flex: 0 0 auto;
  width: 250px;
  min-width: 160px;
  max-width: 65%;
  height: 170px;
  resize: horizontal;
}

.resize-pane--main {
  flex: 1 1 auto;
  min-width: 0;
  height: 170px;
}

.resize-pane--below {
  min-height: 90px;
}

.resize-v {
  width: 100%;
  height: 170px;
  min-height: 110px;
  max-height: 320px;
  resize: vertical;
  padding: 14px;
  border: 1px solid rgba(var(--v-border-color), 0.9);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: auto;
}

.resize-nested {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resize-pane--top {
  flex: 0 0 auto;
  min-height: 84px;
}

.resize-pane--bottom {
  flex: 1 1 auto;
  min-height: 90px;
  max-height: 200px;
  resize: both;
  width: 100%;
  max-width: 100%;
}

.resize-pane__title {
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 6px;
}

.resize-pane__hint {
  margin: 0;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.editor-shell {
  display: flex;
  align-items: stretch;
  min-height: 220px;
  border: 1px solid rgba(var(--v-border-color), 0.9);
  border-radius: 10px;
  overflow: hidden;
}

.editor-tree {
  flex: 0 0 auto;
  width: 190px;
  min-width: 130px;
  max-width: 55%;
  resize: horizontal;
  overflow: auto;
  border-right: 1px solid rgba(var(--v-border-color), 0.7);
  background: rgb(var(--v-theme-surface-variant));
}

.editor-tree__head,
.editor-main__head {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 650;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.6);
}

.editor-tree__list {
  margin: 0;
  padding: 10px 12px 10px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.editor-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.editor-code {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.7;
  overflow: auto;
}

@media (max-width: 900px) {
  .form-grid,
  .grid-4,
  .grid-3,
  .grid-wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flex-cell.basis-1-3,
  .flex-cell.basis-2-3,
  .flex-cell.basis-1-4,
  .flex-cell.basis-1-2 {
    flex: 1 1 100%;
  }

  .resize-row {
    flex-direction: column;
    min-height: 0;
  }

  .resize-pane--h,
  .resize-pane--main {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: 130px;
  }
}

@media (max-width: 640px) {
  .form-grid,
  .grid-2,
  .grid-3,
  .grid-4,
  .grid-wide,
  .grid-golden,
  .grid-span {
    grid-template-columns: minmax(0, 1fr);
  }

  .grid-cell--row-span {
    grid-row: auto;
  }
}
</style>
