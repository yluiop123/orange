import { Component, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-general',
  standalone: true,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSliderModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.general.title" descKey="page.component.general.desc" />

      <mat-tab-group class="demo-tabs" animationDuration="120ms">
        <mat-tab label="Button">
          <div class="tab-pane">
            <section class="panel">
              <h2>Size 大小</h2>
              <p class="muted">The same action at small, default, large and icon-only sizes.</p>
              <div class="row">
                <button mat-flat-button class="size-sm" type="button">small</button>
                <button mat-flat-button type="button">default</button>
                <button mat-flat-button class="size-lg" type="button">large</button>
                <button mat-icon-button type="button" aria-label="Add"><mat-icon>add</mat-icon></button>
              </div>
            </section>

            <section class="panel">
              <h2>Type 类型</h2>
              <div class="row">
                <button mat-flat-button type="button">Default</button>
                <button mat-flat-button class="primary" type="button">Primary 主要</button>
                <button mat-stroked-button class="secondary" type="button">Secondary 次要</button>
                <button mat-flat-button color="warn" type="button">Destructive 危险</button>
                <button mat-flat-button class="success" type="button">Success 成功</button>
                <button mat-button type="button">Link 链接 <mat-icon>open_in_new</mat-icon></button>
              </div>
            </section>

            <section class="panel">
              <h2>Variant 变体</h2>
              <div class="row">
                <button mat-flat-button type="button">default</button>
                <button mat-flat-button color="warn" type="button">destructive</button>
                <button mat-stroked-button type="button">outline</button>
                <button mat-raised-button type="button">secondary</button>
                <button mat-button type="button">ghost</button>
                <button mat-button class="link-variant" type="button">Link</button>
              </div>
            </section>

            <section class="panel">
              <h2>Status 状态</h2>
              <p class="muted">Loading is simulated for 1.8 seconds; the button is disabled while it runs.</p>
              <div class="row">
                <button mat-flat-button type="button">Normal</button>
                <button mat-flat-button type="button" disabled>Disabled</button>
                <button mat-flat-button type="button" [disabled]="loading()" (click)="startLoading()">
                  @if (loading()) {
                    <mat-icon class="spin">sync</mat-icon>
                  }
                  {{ loading() ? 'Loading...' : 'Click to Load' }}
                </button>
              </div>
            </section>

            <section class="panel">
              <h2>Icon Button 图标按钮 &amp; Shape 形状</h2>
              <div class="row">
                <button mat-flat-button type="button"><mat-icon>coffee</mat-icon> Icon Button</button>
                <button mat-flat-button class="success" type="button"><mat-icon>check</mat-icon> Success</button>
                <button mat-icon-button type="button" aria-label="Delete"><mat-icon>delete</mat-icon></button>
                <button mat-fab extended type="button"><mat-icon>add</mat-icon> Create</button>
              </div>
              <div class="row">
                <button mat-flat-button class="shape-square" type="button">Square</button>
                <button mat-flat-button class="shape-round" type="button">Round</button>
                <button mat-flat-button class="shape-pill" type="button">Full Circle</button>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="FloatButton">
          <div class="tab-pane">
            <section class="panel">
              <h2>Float button positions 浮动按钮位置</h2>
              <p class="muted">A contained viewport illustrates the four presets used by the React component.</p>
              <div class="float-stage">
                <div class="float-hint">Page viewport</div>
                <button
                  mat-fab
                  class="float-pos top-left"
                  type="button"
                  aria-label="Back to top"
                  (click)="backToTop()"
                >
                  <mat-icon>arrow_upward</mat-icon>
                </button>
                <button mat-mini-fab class="float-pos top-right" type="button" aria-label="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-mini-fab class="float-pos left-center" type="button" aria-label="Add">
                  <mat-icon>add</mat-icon>
                </button>

                <div class="float-pos bottom-center float-group">
                  @if (floatOpen()) {
                    <button
                      mat-mini-fab
                      matBadge="2"
                      matBadgeColor="accent"
                      type="button"
                      aria-label="Edit item"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-mini-fab
                      matBadge="5"
                      matBadgeColor="warn"
                      type="button"
                      aria-label="Delete item"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                  <button
                    mat-fab
                    type="button"
                    [attr.aria-label]="floatOpen() ? 'Close actions' : 'Open actions'"
                    (click)="floatOpen.set(!floatOpen())"
                  >
                    <mat-icon>{{ floatOpen() ? 'close' : 'add' }}</mat-icon>
                  </button>
                </div>
              </div>
            </section>

            <section class="panel">
              <h2>Expandable action group 展开按钮组</h2>
              <div class="row">
                <button mat-stroked-button type="button" (click)="floatOpen.set(!floatOpen())">
                  {{ floatOpen() ? 'Collapse group' : 'Expand group' }}
                </button>
                <button mat-button type="button" (click)="backToTop()">
                  <mat-icon>vertical_align_top</mat-icon> Back to top
                </button>
              </div>
              <p class="muted">
                The main button toggles a group with badge counts. In a full page the same pattern is pinned to a
                corner with Enter/Space and Escape keyboard support.
              </p>
            </section>

            <section class="panel">
              <h2>Behaviour notes 演示说明</h2>
              <ul class="notes">
                <li>The primary button supports back-to-top, expanding a group, or a custom click callback.</li>
                <li>Group buttons support badge counts and custom styling.</li>
                <li>Press the main button or Enter/Space to expand; press Escape or click outside to close.</li>
              </ul>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Affix">
          <div class="tab-pane">
            <section class="panel">
              <h2>Top Affix / 顶部固钉</h2>
              <p class="muted">Scroll inside the frame; the toolbar sticks at the configured top offset.</p>

              <div class="control-row">
                <label for="offset-top">Offset Top</label>
                <mat-slider class="slider" min="0" max="200" step="1">
                  <input id="offset-top" matSliderThumb [value]="offsetTop()" (valueChange)="setOffsetTop($event)" />
                </mat-slider>
                <span class="mono value">{{ offsetTop() }}px</span>
                <label for="affix-left">Left</label>
                <input
                  id="affix-left"
                  class="num-input"
                  type="number"
                  [value]="offsetLeft()?.toString() ?? ''"
                  (input)="setOffsetLeft($event)"
                />
                <label for="affix-right">Right</label>
                <input
                  id="affix-right"
                  class="num-input"
                  type="number"
                  [value]="offsetRight()?.toString() ?? ''"
                  (input)="setOffsetRight($event)"
                />
              </div>

              <div class="affix-box">
                <div
                  class="affix-sticky-top"
                  [style.top.px]="offsetTop()"
                  [style.marginLeft.px]="offsetLeft() ?? 0"
                  [style.marginRight.px]="offsetRight() ?? 0"
                >
                  <span>Affixed header (dynamic offsets)</span>
                  <button mat-stroked-button type="button">Action</button>
                </div>
                @for (line of scrollLines; track line) {
                  <div class="scroll-line">{{ line }}</div>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Bottom Fixed Affix / 底部固定</h2>
              <p class="muted">A sticky action bar stays available while the content scrolls.</p>
              <div class="affix-box tall">
                @for (line of scrollLines; track line) {
                  <div class="scroll-line">{{ line }}</div>
                }
                <div class="affix-sticky-bottom" [style.bottom.px]="offsetBottom()">
                  <button mat-flat-button type="button">Primary / 主要</button>
                  <button mat-button type="button">Secondary / 次要</button>
                </div>
              </div>

              <div class="control-row">
                <label for="offset-bottom">Offset Bottom</label>
                <mat-slider class="slider" min="0" max="120" step="1">
                  <input id="offset-bottom" matSliderThumb [value]="offsetBottom()" (valueChange)="setOffsetBottom($event)" />
                </mat-slider>
                <span class="mono value">{{ offsetBottom() }}px</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Typography">
          <div class="tab-pane">
            <section class="panel">
              <h2>Typography 排版示例</h2>
              <h1>Heading level 1</h1>
              <h2>Heading level 2</h2>
              <h3>Heading level 3</h3>
              <p class="lead">Lead paragraph demonstrates the type scale and vertical rhythm.</p>
              <p class="muted">Secondary copy uses the muted token from the theme.</p>
            </section>

            <section class="panel">
              <h2>Text 文本</h2>
              <p class="type-sample">
                <strong>Strong 加粗</strong> ·
                <span class="underlined">Underline 下划线</span> ·
                <del>Delete 删除线</del> ·
                <code class="mono">Code 代码</code> ·
                <em>Italic 斜体</em> ·
                <mark>Mark 标记</mark>
              </p>
              <mat-divider />
              <p class="type-sample small">Secondary text at 13px with relaxed line height.</p>
            </section>

            <section class="panel">
              <h2>Copyable / editable 复制与编辑</h2>
              <div class="row">
                <span class="copyable">
                  Copyable 支持复制
                  <button mat-icon-button type="button" aria-label="Copy text" (click)="copyText()">
                    <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                  </button>
                </span>
                @if (copied()) {
                  <span class="copied">Copied</span>
                }
              </div>
              <div class="row">
                @if (editing()) {
                  <input
                    class="text-input"
                    type="text"
                    [value]="editableText()"
                    (input)="setEditableText($event)"
                    (blur)="editing.set(false)"
                  />
                  <button mat-flat-button type="button" (click)="editing.set(false)">Save</button>
                } @else {
                  <span class="copyable">{{ editableText() }}</span>
                  <button mat-icon-button type="button" aria-label="Edit text" (click)="editing.set(true)">
                    <mat-icon>edit</mat-icon>
                  </button>
                }
              </div>
            </section>

            <section class="panel">
              <h2>Ellipsis 省略</h2>
              <p class="ellipsis-copy" [class.clamp-1]="!expanded()">
                {{ longText }}
              </p>
              <div class="row">
                <button mat-stroked-button type="button" (click)="expanded.set(!expanded())">
                  {{ expanded() ? 'Collapse 收起全文' : 'Expand 显示更多' }}
                </button>
                <span class="muted">{{ expanded() ? 'Full text shown' : 'Single-line end ellipsis' }}</span>
              </div>
              <mat-divider />
              <p class="ellipsis-copy clamp-2">
                {{ longText }} {{ longText }}
              </p>
              <span class="muted">Two-line clamp for dense lists and cards.</span>
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
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 10px 0;
      }
      .muted {
        margin: 0 0 4px;
        font-size: 0.8rem;
      }
      .size-sm {
        --mat-button-filled-container-height: 1.75rem;
      }
      .size-lg {
        --mat-button-filled-container-height: 2.5rem;
      }
      .primary {
        background: #2563eb;
        color: #fff;
      }
      .secondary {
        border-color: var(--app-border);
        background: var(--app-muted);
        color: var(--app-foreground);
      }
      .success {
        background: #16a34a;
        color: #fff;
      }
      .link-variant {
        text-decoration: underline;
      }
      .shape-square {
        border-radius: 0;
      }
      .shape-round {
        border-radius: 0.5rem;
      }
      .shape-pill {
        border-radius: 999px;
      }
      .spin {
        animation: spin 1s linear infinite;
        margin-right: 4px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .float-stage {
        position: relative;
        height: 280px;
        margin-top: 10px;
        border: 1px dashed var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
        overflow: hidden;
      }
      .float-hint {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
      }
      .float-pos {
        position: absolute;
        z-index: 1;
      }
      .top-left {
        top: 14px;
        left: 14px;
      }
      .top-right {
        top: 14px;
        right: 14px;
      }
      .left-center {
        top: 50%;
        left: 14px;
        transform: translateY(-50%);
      }
      .bottom-center {
        left: 50%;
        bottom: 14px;
        transform: translateX(-50%);
      }
      .float-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .notes {
        margin: 8px 0 0;
        padding-left: 1.15rem;
        color: var(--app-muted-foreground);
        font-size: 0.8rem;
        line-height: 1.7;
      }
      .control-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin: 12px 0;
        font-size: 0.8rem;
      }
      .control-row label {
        color: var(--app-muted-foreground);
      }
      .slider {
        width: 150px;
      }
      .value {
        min-width: 48px;
      }
      .num-input {
        width: 72px;
        height: 30px;
        padding: 0 8px;
        border: 1px solid var(--app-input);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--app-foreground);
        font: inherit;
      }
      .affix-box {
        position: relative;
        height: 250px;
        padding: 12px;
        overflow: auto;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--app-muted);
      }
      .affix-box.tall {
        height: 260px;
      }
      .affix-sticky-top {
        position: sticky;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border: 1px solid var(--app-border);
        border-radius: 0.5rem;
        background: var(--app-card);
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
        font-size: 0.8rem;
      }
      .affix-sticky-bottom {
        position: sticky;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        width: fit-content;
        margin: 12px auto 0;
        padding: 8px 10px;
        border: 1px solid var(--app-border);
        border-radius: 0.5rem;
        background: var(--app-card);
        box-shadow: 0 4px 12px rgb(0 0 0 / 0.16);
      }
      .scroll-line {
        margin-top: 6px;
        padding: 6px 10px;
        border: 1px solid var(--app-border);
        border-radius: 0.4rem;
        background: var(--app-card);
        color: var(--app-muted-foreground);
        font-size: 0.78rem;
      }
      .lead {
        font-size: 1.02rem;
      }
      .type-sample {
        margin: 10px 0;
        line-height: 1.8;
      }
      .type-sample.small {
        font-size: 0.82rem;
      }
      .underlined {
        text-decoration: underline;
      }
      code {
        padding: 2px 5px;
        border-radius: 4px;
        background: var(--app-muted);
        font-size: 0.82em;
      }
      mark {
        padding: 1px 4px;
        border-radius: 3px;
        background: color-mix(in srgb, #f59e0b 30%, transparent);
        color: var(--app-foreground);
      }
      .copyable {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
      }
      .copied {
        color: #16a34a;
        font-size: 0.78rem;
      }
      .text-input {
        height: 32px;
        min-width: 220px;
        padding: 0 10px;
        border: 1px solid var(--app-input);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--app-foreground);
        font: inherit;
        font-size: 0.85rem;
      }
      .ellipsis-copy {
        margin: 10px 0;
        color: var(--app-foreground);
        line-height: 1.7;
        font-size: 0.85rem;
        overflow: hidden;
      }
      .clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
      .clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      @media (max-width: 640px) {
        .float-stage {
          height: 340px;
        }
      }
    `,
  ],
})
export class ComponentGeneralComponent {
  readonly loading = signal(false);
  readonly floatOpen = signal(false);
  readonly offsetTop = signal(16);
  readonly offsetBottom = signal(16);
  readonly offsetLeft = signal<number | null>(null);
  readonly offsetRight = signal<number | null>(0);
  readonly copied = signal(false);
  readonly editing = signal(false);
  readonly editableText = signal('Editable 支持编辑');
  readonly expanded = signal(false);

  readonly scrollLines = Array.from({ length: 14 }, (_, index) => `Scroll content ${index + 1}`);

  readonly longText =
    '这是一段很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本'.repeat(6);

  startLoading(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1800);
  }

  backToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setOffsetTop(value: number | null): void {
    this.offsetTop.set(value ?? 0);
  }

  setOffsetBottom(value: number | null): void {
    this.offsetBottom.set(value ?? 0);
  }

  setOffsetLeft(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.offsetLeft.set(value === '' ? null : Number(value));
  }

  setOffsetRight(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.offsetRight.set(value === '' ? null : Number(value));
  }

  copyText(): void {
    void navigator.clipboard?.writeText('Copyable 支持复制');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }

  setEditableText(event: Event): void {
    this.editableText.set((event.target as HTMLInputElement).value);
  }
}
