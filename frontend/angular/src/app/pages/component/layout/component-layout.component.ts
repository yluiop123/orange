import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-component-layout',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSliderModule,
    MatTabsModule,
  ],
  template: `
    <div class="page">

      <mat-tab-group class="orange-tabs" animationDuration="120ms">
        <mat-tab label="Divider">
          <div class="tab-pane">
            <section class="panel">
              <h2>Basic &amp; dashed 基础与虚线</h2>
              <p>Content above a solid divider.</p>
              <mat-divider />
              <p class="spaced">Content below a solid divider with token-based spacing.</p>
              <mat-divider class="dashed" />
              <p class="spaced muted">A dashed divider separates secondary content.</p>
              <div class="inline-row">
                <span>Item A</span>
                <mat-divider [vertical]="true" class="vertical" />
                <span>Item B</span>
                <mat-divider [vertical]="true" class="vertical" />
                <span>Item C</span>
              </div>
            </section>

            <section class="panel">
              <h2>Divider with text 带文字的分割线</h2>
              <div class="divider-text center"><span>Center title / 居中标题</span></div>
              <div class="divider-text left"><span>Left / 左对齐</span></div>
              <div class="divider-text right"><span>Right / 右对齐</span></div>
            </section>

            <section class="panel">
              <h2>Sizes &amp; colors 尺寸与颜色</h2>
              <div class="divider-samples">
                @for (item of dividerSizes; track item.label) {
                  <div class="divider-sample">
                    <span class="muted">{{ item.label }}</span>
                    <div
                      class="divider-line"
                      [style.height.px]="item.height"
                      [style.background]="item.color"
                    ></div>
                  </div>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Practical grouping 实际应用</h2>
              <div class="form-grid">
                <label>
                  Username / 用户名
                  <input class="text-input" type="text" placeholder="Enter username" />
                </label>
                <label>
                  Email / 邮箱
                  <input class="text-input" type="email" placeholder="Enter email" />
                </label>
              </div>
              <div class="divider-text center"><span>Account information / 账户信息</span></div>
              <div class="form-grid">
                <label>
                  Password / 密码
                  <input class="text-input" type="password" placeholder="Enter password" />
                </label>
                <label>
                  Confirm / 确认密码
                  <input class="text-input" type="password" placeholder="Confirm password" />
                </label>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Flex">
          <div class="tab-pane">
            <section class="panel">
              <h2>Flex row 横向布局</h2>
              <p class="muted">flex: 1 divides the remaining space equally.</p>
              <div class="orange-row">
                <div class="flex-cell tone-sky">flex-1</div>
                <div class="flex-cell tone-rose">flex-1</div>
              </div>
              <div class="orange-row">
                <div class="flex-cell tone-sky">flex-1</div>
                <div class="flex-cell tone-amber">flex-1</div>
                <div class="flex-cell tone-emerald">flex-1</div>
              </div>
            </section>

            <section class="panel">
              <h2>Flex basis 固定比例</h2>
              <p class="muted">basis-1/3 is roughly 33%; basis-2/3 is roughly 66%.</p>
              <div class="orange-row">
                <div class="flex-cell basis-1-3 tone-emerald">basis-1/3</div>
                <div class="flex-cell basis-2-3 tone-amber">basis-2/3</div>
              </div>
              <div class="orange-row">
                <div class="flex-cell basis-1-4 tone-violet">basis-1/4</div>
                <div class="flex-cell basis-1-4 tone-pink">basis-1/4</div>
                <div class="flex-cell basis-1-2 tone-indigo">basis-1/2</div>
              </div>
            </section>

            <section class="panel">
              <h2>Flex offset 偏移布局</h2>
              <p class="muted">Auto margins push a cell to the opposite edge.</p>
              <div class="orange-row">
                <div class="flex-cell basis-1-3 tone-violet">basis-1/3</div>
                <div class="flex-cell basis-1-3 tone-pink push-right">margin-left: auto</div>
              </div>
              <div class="orange-row">
                <div class="flex-cell basis-1-4 tone-sky push-right">margin-left: auto</div>
                <div class="flex-cell basis-1-4 tone-cyan push-left">margin-right: auto</div>
              </div>
            </section>

            <section class="panel">
              <h2>Alignment 对齐方式</h2>
              <div class="row">
                <button mat-stroked-button type="button" [class.selected]="justify() === 'flex-start'" (click)="justify.set('flex-start')">start</button>
                <button mat-stroked-button type="button" [class.selected]="justify() === 'center'" (click)="justify.set('center')">center</button>
                <button mat-stroked-button type="button" [class.selected]="justify() === 'flex-end'" (click)="justify.set('flex-end')">end</button>
                <button mat-stroked-button type="button" [class.selected]="justify() === 'space-between'" (click)="justify.set('space-between')">between</button>
              </div>
              <div class="row">
                <button mat-stroked-button type="button" [class.selected]="alignItems() === 'flex-start'" (click)="alignItems.set('flex-start')">items-start</button>
                <button mat-stroked-button type="button" [class.selected]="alignItems() === 'center'" (click)="alignItems.set('center')">items-center</button>
                <button mat-stroked-button type="button" [class.selected]="alignItems() === 'flex-end'" (click)="alignItems.set('flex-end')">items-end</button>
              </div>
              <div class="flex-stage" [style.justify-content]="justify()" [style.align-items]="alignItems()">
                <div class="flex-chip tone-sky">short</div>
                <div class="flex-chip tall tone-amber">taller</div>
                <div class="flex-chip tone-emerald">short</div>
              </div>
              <p class="muted mono">justify-content: {{ justify() }} · align-items: {{ alignItems() }}</p>
            </section>

            <section class="panel">
              <h2>Flex wrap 换行布局</h2>
              <div class="wrap-row">
                @for (item of wrapItems; track item) {
                  <div class="wrap-cell">Item {{ item }}</div>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Grid">
          <div class="tab-pane">
            <section class="panel">
              <h2>Basic grid 基础网格</h2>
              <div class="orange-grid cols-2">
                <div class="grid-cell tone-sky">1 / 2 · 50%</div>
                <div class="grid-cell tone-rose">2 / 2 · 50%</div>
              </div>
              <div class="orange-grid cols-3">
                <div class="grid-cell tone-emerald">1 / 3 · 33%</div>
                <div class="grid-cell tone-amber">2 / 3 · 33%</div>
                <div class="grid-cell tone-violet">3 / 3 · 33%</div>
              </div>
              <div class="orange-grid cols-4">
                @for (item of fourCols; track item) {
                  <div class="grid-cell tone-indigo">Column {{ item }}</div>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Unequal widths 不等宽布局</h2>
              <div class="orange-grid custom-2-1-1">
                <div class="grid-cell tone-sky">50% · wide</div>
                <div class="grid-cell tone-rose">25%</div>
                <div class="grid-cell tone-emerald">25%</div>
              </div>
              <div class="orange-grid custom-2-1">
                <div class="grid-cell tone-sky">2fr · main</div>
                <div class="grid-cell tone-rose">1fr · aside</div>
              </div>
              <div class="orange-grid custom-1-1-1">
                <div class="grid-cell tone-amber">1fr</div>
                <div class="grid-cell tone-emerald span-two-rows">span 2 rows</div>
                <div class="grid-cell tone-violet">1fr</div>
                <div class="grid-cell tone-pink">1fr</div>
              </div>
            </section>

            <section class="panel">
              <h2>Responsive grid 响应式网格</h2>
              <p class="muted">Auto-fit collapses to a single column on narrow screens.</p>
              <div class="auto-grid">
                @for (item of autoGridItems; track item) {
                  <div class="grid-cell tone-cyan">Grid item {{ item }}</div>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Gap control 网格间距</h2>
              <div class="control-row">
                <label for="grid-gap">Gap</label>
                <mat-slider class="slider" min="0" max="40" step="2">
                  <input id="grid-gap" matSliderThumb [value]="gridGap()" (valueChange)="setGridGap($event)" />
                </mat-slider>
                <span class="mono value">{{ gridGap() }}px</span>
              </div>
              <div class="auto-grid gap-preview" [style.gap.px]="gridGap()">
                @for (item of autoGridItems; track item) {
                  <div class="grid-cell tone-emerald">Cell {{ item }}</div>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Layout">
          <div class="tab-pane">
            <section class="panel">
              <h2>Basic layout 基础布局</h2>
              <div class="layout-frame">
                <div class="layout-header">
                  <strong>My Application / 我的应用</strong>
                  <span class="soft-badge">Header</span>
                </div>
                <div class="layout-body">
                  <aside class="layout-sider" [class.collapsed]="collapsed()">
                    <div class="sider-head">
                      <button mat-icon-button type="button" [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'" (click)="collapsed.set(!collapsed())">
                        <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
                      </button>
                      <span class="sider-label">Navigation</span>
                    </div>
                    @for (item of navItems; track item.label) {
                      <button mat-button class="sider-item" type="button">
                        <mat-icon>{{ item.icon }}</mat-icon>
                        <span class="sider-label">{{ item.label }}</span>
                      </button>
                    }
                  </aside>
                  <main class="layout-content">
                    <h3>Main content area / 主内容区域</h3>
                    <p class="muted">This area hosts cards, charts or a routed view.</p>
                    <div class="mini-grid">
                      @for (card of cards; track card.title) {
                        <mat-card appearance="outlined" class="mini-card">
                          <mat-icon>{{ card.icon }}</mat-icon>
                          <strong>{{ card.title }}</strong>
                          <p class="muted">{{ card.text }}</p>
                        </mat-card>
                      }
                    </div>
                  </main>
                </div>
                <footer class="layout-footer">© 2025 MyApp - All Rights Reserved</footer>
              </div>
            </section>

            <section class="panel">
              <h2>Controlled collapse 受控折叠</h2>
              <div class="row">
                <button mat-flat-button type="button" (click)="controlledCollapsed.set(!controlledCollapsed())">
                  Toggle sidebar
                </button>
                <button mat-stroked-button type="button" (click)="controlledCollapsed.set(false)">Expand</button>
                <button mat-stroked-button type="button" (click)="controlledCollapsed.set(true)">Collapse</button>
                <span class="muted mono">collapsed: {{ controlledCollapsed() }}</span>
              </div>
              <div class="layout-frame compact">
                <div class="layout-header"><strong>Controlled Layout / 受控布局</strong></div>
                <div class="layout-body">
                  <aside class="layout-sider" [class.collapsed]="controlledCollapsed()">
                    @for (item of navItems; track item.label) {
                      <button mat-button class="sider-item" type="button">
                        <mat-icon>{{ item.icon }}</mat-icon>
                        <span class="sider-label">{{ item.label }}</span>
                      </button>
                    }
                  </aside>
                  <main class="layout-content">
                    <p>The collapse state is owned by the component and driven by external buttons.</p>
                    <p class="muted">The side rail keeps icons visible while labels are hidden.</p>
                  </main>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Custom arrows 自定义图标</h2>
              <div class="two-up">
                <div class="layout-frame compact">
                  <div class="layout-header"><strong>Default direction</strong></div>
                  <div class="layout-body">
                    <aside class="layout-sider" [class.collapsed]="customCollapsed()">
                      <div class="sider-head">
                        <button mat-icon-button type="button" aria-label="Toggle sidebar" (click)="customCollapsed.set(!customCollapsed())">
                          <mat-icon>{{ customCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
                        </button>
                      </div>
                      <button mat-button class="sider-item" type="button"><mat-icon>menu</mat-icon><span class="sider-label">Menu item</span></button>
                    </aside>
                    <main class="layout-content"><p class="muted">Collapsed shows a left arrow; expanded shows a right arrow.</p></main>
                  </div>
                </div>
                <div class="layout-frame compact">
                  <div class="layout-header"><strong>Reverse arrow</strong></div>
                  <div class="layout-body">
                    <aside class="layout-sider reverse" [class.collapsed]="customCollapsed()">
                      <div class="sider-head">
                        <button mat-icon-button type="button" aria-label="Toggle sidebar" (click)="customCollapsed.set(!customCollapsed())">
                          <mat-icon>{{ customCollapsed() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
                        </button>
                      </div>
                      <button mat-button class="sider-item" type="button"><mat-icon>menu</mat-icon><span class="sider-label">Menu item</span></button>
                    </aside>
                    <main class="layout-content"><p class="muted">The arrow direction is inverted for this variant.</p></main>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Space">
          <div class="tab-pane">
            <section class="panel">
              <h2>Horizontal spacing 水平间距</h2>
              <div class="space-demo" [style.gap.px]="spaceGap()">
                <button mat-stroked-button type="button">Button 1 / 按钮一</button>
                <button mat-stroked-button type="button">Button 2 / 按钮二</button>
                <button mat-stroked-button type="button">Button 3 / 按钮三</button>
              </div>
            </section>

            <section class="panel">
              <h2>Vertical spacing 垂直间距</h2>
              <div class="space-demo vertical" [style.gap.px]="spaceGap()">
                <div class="soft-item">Item 1 / 项目 1</div>
                <div class="soft-item">Item 2 / 项目 2</div>
                <div class="soft-item">Item 3 / 项目 3</div>
              </div>
            </section>

            <section class="panel">
              <h2>Dynamic spacing 动态间距</h2>
              <div class="row">
                <mat-form-field appearance="outline" class="gap-select">
                  <mat-label>Select gap</mat-label>
                  <mat-select [value]="spaceGap()" (selectionChange)="setSpaceGap($event.value)">
                    @for (gap of gapOptions; track gap.value) {
                      <mat-option [value]="gap.value">{{ gap.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <span class="muted mono">gap: {{ spaceGap() }}px</span>
              </div>
              <div class="space-demo" [style.gap.px]="spaceGap()">
                <button mat-stroked-button type="button">Button 1</button>
                <button mat-stroked-button type="button">Button 2</button>
                <button mat-stroked-button type="button">Button 3</button>
              </div>
            </section>

            <section class="panel">
              <h2>Alignment 对齐方式</h2>
              <div class="space-demo align-start">
                <button mat-stroked-button class="h-sm" type="button">Small</button>
                <button mat-stroked-button class="h-md" type="button">Medium</button>
                <button mat-stroked-button class="h-lg" type="button">Large</button>
              </div>
              <div class="space-demo align-center">
                <button mat-stroked-button class="h-sm" type="button">Small</button>
                <button mat-stroked-button class="h-md" type="button">Medium</button>
                <button mat-stroked-button class="h-lg" type="button">Large</button>
              </div>
              <div class="space-demo align-end">
                <button mat-stroked-button class="h-sm" type="button">Small</button>
                <button mat-stroked-button class="h-md" type="button">Medium</button>
                <button mat-stroked-button class="h-lg" type="button">Large</button>
              </div>
            </section>

            <section class="panel">
              <h2>Wrap &amp; separators 换行与分隔符</h2>
              <div class="space-demo wrap" style="gap: 8px">
                @for (item of wrapItems; track item) {
                  <button mat-stroked-button type="button">Item {{ item }}</button>
                }
              </div>
              <div class="separator-row">
                <span>Apple / 苹果</span>
                <span class="separator"></span>
                <span>Orange / 橙子</span>
                <span class="separator"></span>
                <span>Banana / 香蕉</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Resizable">
          <div class="tab-pane">
            <section class="panel">
              <h2>Horizontal resize 横向调整</h2>
              <p class="muted">Drag the bottom-right corner of the sidebar. Pure CSS resize, no library.</p>
              <div class="resize-frame">
                <div class="resize-pane horizontal">
                  <strong>Sidebar (resizable)</strong>
                  <p class="muted">width: 240px, min 150px</p>
                  <div class="resize-grip">↔</div>
                </div>
                <div class="resize-main">
                  <strong>Main content</strong>
                  <p class="muted">The right pane fills the remaining space.</p>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Vertical resize 纵向调整</h2>
              <p class="muted">Drag the bottom edge of the log panel to change its height.</p>
              <div class="resize-pane vertical">
                <strong>Log output</strong>
                <p class="mono">12:00:01 build started</p>
                <p class="mono">12:00:02 compiling templates</p>
                <p class="mono">12:00:03 done in 2.1s</p>
                <div class="resize-grip">↕</div>
              </div>
            </section>

            <section class="panel">
              <h2>Both directions 双向调整</h2>
              <div class="resize-pane both">
                <strong>Freeform panel</strong>
                <p class="muted">Drag either edge. Text wraps as the panel changes size.</p>
                <div class="resize-grip">⤡</div>
              </div>
            </section>

            <section class="panel">
              <h2>Practical layout 实际应用</h2>
              <div class="editor-demo">
                <div class="editor-tree">
                  <div class="editor-title">File tree / 文件树</div>
                  <div class="mono tree-line">• src/</div>
                  <div class="mono tree-line">• components/</div>
                  <div class="mono tree-line">• pages/</div>
                  <div class="mono tree-line">• utils/</div>
                  <div class="resize-grip">↔</div>
                </div>
                <div class="editor-main">
                  <div class="editor-title">Editor / 编辑器</div>
                  <pre class="mono">&lt;div class="container"&gt;
  &lt;h1&gt;Hello World&lt;/h1&gt;
&lt;/div&gt;</pre>
                </div>
              </div>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .tab-pane {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 12px 2px;
      }
      h2 {
        margin: 0 0 6px;
        font-size: 0.95rem;
        font-weight: 600;
      }
      h3 {
        margin: 0 0 4px;
        font-size: 0.9rem;
      }
      p {
        margin: 6px 0;
        font-size: 0.82rem;
      }
      .muted {
        color: var(--app-muted-foreground);
        font-size: 0.78rem;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 8px 0;
      }
      .selected {
        background: var(--app-muted);
        border-color: var(--app-ring);
      }
      .spaced {
        margin-top: 14px;
      }
      mat-divider.dashed {
        border-top-style: dashed;
      }
      mat-divider.vertical {
        height: 18px;
      }
      .inline-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 16px;
        font-size: 0.82rem;
      }
      .divider-text {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 16px 0;
        color: var(--app-muted-foreground);
        font-size: 0.78rem;
      }
      .divider-text::before,
      .divider-text::after {
        content: '';
        flex: 1;
        border-top: 1px solid var(--app-border);
      }
      .divider-text.left::before {
        flex: 0 0 10%;
      }
      .divider-text.right::after {
        flex: 0 0 10%;
      }
      .divider-samples {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .divider-sample {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .divider-sample .muted {
        width: 110px;
        flex: 0 0 auto;
      }
      .divider-line {
        flex: 1;
        border-radius: 999px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin: 10px 0;
      }
      .form-grid label {
        display: flex;
        flex-direction: column;
        gap: 5px;
        color: var(--app-muted-foreground);
        font-size: 0.78rem;
      }
      .text-input {
        height: 32px;
        padding: 0 10px;
        border: 1px solid var(--app-input);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--app-foreground);
        font: inherit;
        font-size: 0.82rem;
      }
      .orange-row {
        display: flex;
        gap: 12px;
        margin-top: 10px;
      }
      .flex-cell,
      .grid-cell {
        display: grid;
        place-items: center;
        min-height: 62px;
        padding: 10px;
        border-radius: 0.5rem;
        color: var(--app-foreground);
        font-size: 0.76rem;
        font-weight: 500;
      }
      .tone-sky {
        background: color-mix(in srgb, #38bdf8 24%, var(--app-card));
        border: 1px solid color-mix(in srgb, #38bdf8 40%, var(--app-border));
      }
      .tone-rose {
        background: color-mix(in srgb, #fb7185 22%, var(--app-card));
        border: 1px solid color-mix(in srgb, #fb7185 40%, var(--app-border));
      }
      .tone-amber {
        background: color-mix(in srgb, #f59e0b 24%, var(--app-card));
        border: 1px solid color-mix(in srgb, #f59e0b 42%, var(--app-border));
      }
      .tone-emerald {
        background: color-mix(in srgb, #34d399 24%, var(--app-card));
        border: 1px solid color-mix(in srgb, #34d399 42%, var(--app-border));
      }
      .tone-violet {
        background: color-mix(in srgb, #a78bfa 24%, var(--app-card));
        border: 1px solid color-mix(in srgb, #a78bfa 42%, var(--app-border));
      }
      .tone-pink {
        background: color-mix(in srgb, #f472b6 22%, var(--app-card));
        border: 1px solid color-mix(in srgb, #f472b6 40%, var(--app-border));
      }
      .tone-indigo {
        background: color-mix(in srgb, #818cf8 24%, var(--app-card));
        border: 1px solid color-mix(in srgb, #818cf8 42%, var(--app-border));
      }
      .tone-cyan {
        background: color-mix(in srgb, #22d3ee 22%, var(--app-card));
        border: 1px solid color-mix(in srgb, #22d3ee 40%, var(--app-border));
      }
      .flex-cell {
        flex: 1;
      }
      .basis-1-3 {
        flex: 0 0 calc(33.333% - 8px);
      }
      .basis-2-3 {
        flex: 1;
      }
      .basis-1-4 {
        flex: 0 0 calc(25% - 9px);
      }
      .basis-1-2 {
        flex: 1;
      }
      .push-right {
        margin-left: auto;
      }
      .push-left {
        margin-right: auto;
      }
      .flex-stage {
        display: flex;
        gap: 10px;
        min-height: 120px;
        padding: 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .flex-chip {
        display: grid;
        place-items: center;
        width: 84px;
        min-height: 44px;
        padding: 8px;
        border-radius: 0.5rem;
        font-size: 0.72rem;
      }
      .flex-chip.tall {
        min-height: 74px;
      }
      .wrap-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .wrap-cell {
        width: 96px;
        height: 56px;
        display: grid;
        place-items: center;
        border-radius: 0.5rem;
        background: color-mix(in srgb, #3b82f6 20%, var(--app-card));
        border: 1px solid color-mix(in srgb, #3b82f6 36%, var(--app-border));
        font-size: 0.75rem;
      }
      .orange-grid {
        display: grid;
        gap: 10px;
        margin-top: 10px;
      }
      .cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .custom-2-1 {
        grid-template-columns: 2fr 1fr;
      }
      .custom-2-1-1 {
        grid-template-columns: 2fr 1fr 1fr;
      }
      .custom-1-1-1 {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 60px 60px;
      }
      .span-two-rows {
        grid-row: span 2;
      }
      .auto-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .control-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin: 8px 0;
        font-size: 0.8rem;
      }
      .control-row label {
        color: var(--app-muted-foreground);
      }
      .slider {
        width: 160px;
      }
      .value {
        min-width: 48px;
      }
      .layout-frame {
        overflow: hidden;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-card);
      }
      .layout-frame.compact {
        min-height: 150px;
      }
      .layout-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 14px;
        background: var(--app-primary);
        color: var(--app-primary-foreground);
        font-size: 0.8rem;
      }
      .soft-badge {
        padding: 2px 8px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary-foreground) 18%, transparent);
        font-size: 0.68rem;
      }
      .layout-body {
        display: flex;
        min-height: 220px;
      }
      .layout-sider {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 0 0 auto;
        width: 176px;
        padding: 8px 6px;
        border-right: 1px solid var(--app-border);
        background: var(--app-muted);
        transition: width 0.18s ease;
      }
      .layout-sider.collapsed {
        width: 52px;
      }
      .layout-sider.collapsed .sider-label {
        display: none;
      }
      .sider-head {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 2px 6px;
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--app-muted-foreground);
      }
      .sider-item {
        justify-content: flex-start;
        width: 100%;
        min-width: 0;
        font-size: 0.75rem;
      }
      .sider-item mat-icon {
        margin-right: 8px;
      }
      .layout-content {
        flex: 1;
        min-width: 0;
        padding: 14px;
      }
      .mini-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .mini-card {
        padding: 10px;
      }
      .mini-card mat-icon {
        color: #b45309;
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
      .mini-card strong {
        display: block;
        margin-top: 4px;
        font-size: 0.78rem;
      }
      .mini-card p {
        margin: 2px 0 0;
        font-size: 0.7rem;
      }
      .layout-footer {
        padding: 8px 14px;
        border-top: 1px solid var(--app-border);
        color: var(--app-muted-foreground);
        font-size: 0.7rem;
        text-align: center;
      }
      .two-up {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px;
      }
      .space-demo {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 10px;
        padding: 14px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .space-demo.vertical {
        flex-direction: column;
        align-items: stretch;
        width: min(260px, 100%);
      }
      .space-demo.align-start {
        align-items: flex-start;
      }
      .space-demo.align-center {
        align-items: center;
      }
      .space-demo.align-end {
        align-items: flex-end;
      }
      .space-demo.wrap {
        flex-wrap: wrap;
      }
      .soft-item {
        padding: 9px 12px;
        border: 1px solid var(--app-border);
        border-radius: 0.5rem;
        background: var(--app-card);
        font-size: 0.78rem;
      }
      .gap-select {
        width: 190px;
      }
      .h-sm {
        height: 32px;
      }
      .h-md {
        height: 44px;
      }
      .h-lg {
        height: 56px;
      }
      .separator-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 14px;
        padding: 12px 14px;
        border-radius: var(--app-radius);
        background: var(--app-muted);
        font-size: 0.8rem;
      }
      .separator {
        width: 1px;
        height: 22px;
        background: var(--app-border);
      }
      .resize-frame {
        display: flex;
        align-items: stretch;
        gap: 10px;
        margin-top: 10px;
        min-height: 150px;
      }
      .resize-pane {
        position: relative;
        padding: 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-card);
        overflow: auto;
      }
      .resize-pane.horizontal {
        flex: 0 0 auto;
        width: 240px;
        min-width: 150px;
        max-width: 70%;
        height: 150px;
        resize: horizontal;
      }
      .resize-pane.vertical {
        width: 100%;
        height: 140px;
        min-height: 100px;
        max-height: 320px;
        resize: vertical;
      }
      .resize-pane.both {
        width: 60%;
        height: 180px;
        min-width: 220px;
        min-height: 120px;
        max-width: 100%;
        max-height: 340px;
        resize: both;
      }
      .resize-main {
        flex: 1;
        min-width: 0;
        padding: 12px;
        border: 1px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .resize-grip {
        position: absolute;
        right: 4px;
        bottom: 2px;
        color: var(--app-muted-foreground);
        font-size: 0.7rem;
        pointer-events: none;
      }
      .editor-demo {
        display: flex;
        align-items: stretch;
        margin-top: 10px;
        min-height: 220px;
        overflow: hidden;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
      }
      .editor-tree {
        position: relative;
        flex: 0 0 auto;
        width: 180px;
        min-width: 110px;
        max-width: 60%;
        padding: 10px;
        border-right: 1px solid var(--app-border);
        background: var(--app-muted);
        overflow: auto;
        resize: horizontal;
      }
      .editor-main {
        flex: 1;
        min-width: 0;
        padding: 10px;
      }
      .editor-title {
        padding-bottom: 6px;
        border-bottom: 1px solid var(--app-border);
        font-size: 0.78rem;
        font-weight: 600;
      }
      .tree-line {
        margin-top: 5px;
        font-size: 0.75rem;
      }
      pre {
        margin: 10px 0 0;
        padding: 10px;
        border-radius: 0.4rem;
        background: var(--app-muted);
        font-size: 0.75rem;
        overflow: auto;
      }
      @media (max-width: 720px) {
        .cols-4 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .orange-row {
          flex-wrap: wrap;
        }
        .resize-frame {
          flex-direction: column;
        }
        .resize-pane.horizontal {
          width: 100%;
        }
        .layout-sider {
          width: 150px;
        }
      }
    `,
  ],
})
export class ComponentLayoutComponent {
  readonly justify = signal('flex-start');
  readonly alignItems = signal('flex-start');
  readonly gridGap = signal(12);
  readonly spaceGap = signal(16);
  readonly collapsed = signal(false);
  readonly controlledCollapsed = signal(false);
  readonly customCollapsed = signal(false);

  readonly wrapItems = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly fourCols = [1, 2, 3, 4];
  readonly autoGridItems = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly gapOptions = [
    { label: 'Gap-2 / 8px', value: 8 },
    { label: 'Gap-4 / 16px', value: 16 },
    { label: 'Gap-6 / 24px', value: 24 },
    { label: 'Custom 32px / 自定义 32px', value: 32 },
  ];
  readonly dividerSizes = [
    { label: 'sm · 1px', height: 1, color: '#38bdf8' },
    { label: 'md · 2px', height: 2, color: '#34d399' },
    { label: 'lg · 3px', height: 3, color: '#f59e0b' },
    { label: 'xl · 4px', height: 4, color: '#a78bfa' },
  ];
  readonly navItems = [
    { icon: 'home', label: 'Home / 首页' },
    { icon: 'group', label: 'Users / 用户' },
    { icon: 'settings', label: 'Settings / 设置' },
  ];
  readonly cards = [
    { icon: 'bolt', title: 'Fast', text: 'Lazy routes keep the bundle small.' },
    { icon: 'shield', title: 'Safe', text: 'Actions respect permissions.' },
    { icon: 'layers', title: 'Composable', text: 'Standalone parts compose freely.' },
  ];

  setGridGap(value: number | null): void {
    this.gridGap.set(value ?? 0);
  }

  setSpaceGap(value: number): void {
    this.spaceGap.set(value);
  }
}
