import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-component-general',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSliderModule, MatTabsModule],
  template: `
    <div class="page">

      <mat-tab-group class="orange-tabs" animationDuration="120ms">
        <mat-tab label="Button">
          <div class="orange-body">
            <h2 class="orange-title">Size 大小</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" class="size-sm" type="button">small</button>
              <button mat-flat-button color="primary" type="button">default</button>
              <button mat-flat-button color="primary" class="size-lg" type="button">large</button>
              <button mat-flat-button color="primary" class="orange-icon-square" type="button">
                icon
              </button>
            </div>

            <h2 class="orange-title">Type 类型</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" type="button">Default</button>
              <button mat-flat-button class="orange-blue" type="button">Primary 主要</button>
              <button mat-flat-button class="orange-secondary" type="button">Secondary 次要</button>
              <button mat-flat-button class="orange-danger" type="button">Destructive 危险</button>
              <button mat-flat-button class="orange-success" type="button">Success 成功</button>
              <a
                mat-flat-button
                color="primary"
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Link 链接
              </a>
            </div>

            <h2 class="orange-title">Variant 变体</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" type="button">default</button>
              <button mat-flat-button class="orange-destructive-tonal" type="button">destructive</button>
              <button mat-stroked-button type="button">outline</button>
              <button mat-flat-button class="orange-secondary" type="button">secondary</button>
              <button mat-button type="button">ghost</button>
              <button mat-button color="primary" type="button">Link</button>
            </div>

            <h2 class="orange-title">Status 状态</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" type="button">Normal</button>
              <button mat-flat-button color="primary" type="button" disabled>Disabled</button>
              <button
                mat-flat-button
                color="primary"
                type="button"
                [disabled]="loading()"
                (click)="startLoading()"
              >
                @if (loading()) {
                  <mat-icon class="spin">sync</mat-icon>
                }
                {{ loading() ? 'Loading...' : 'Click to Load' }}
              </button>
            </div>

            <h2 class="orange-title">Icon Button 图标按钮</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" type="button">
                <mat-icon>coffee</mat-icon> Icon Button
              </button>
              <button mat-flat-button class="orange-success" type="button">
                <mat-icon>check</mat-icon> Success
              </button>
            </div>

            <h2 class="orange-title">Square 形状</h2>
            <div class="orange-row">
              <button mat-flat-button color="primary" class="orange-square" type="button">Square</button>
              <button mat-flat-button color="primary" class="orange-round" type="button">Round</button>
              <button mat-flat-button color="primary" class="orange-pill" type="button">Full Circle</button>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="FloatButton">
          <div class="orange-page-surface">
            <p class="orange-float-copy">页面内容很长，可以滚动。示例展示回到顶部、不同位置与展开方向。</p>

            <button
              mat-mini-fab
              color="primary"
              class="orange-float"
              type="button"
              aria-label="Back to top"
              style="bottom: 24px; left: 50%; transform: translateX(-50%)"
              [style.display]="showBackTop() ? 'inline-flex' : 'none'"
              (click)="scrollToTop()"
            >
              <mat-icon>arrow_upward</mat-icon>
            </button>

            <button
              mat-mini-fab
              color="primary"
              class="orange-float"
              type="button"
              aria-label="Quick actions"
              style="top: 50%; right: 24px; transform: translateY(-50%)"
            >
              <mat-icon>add</mat-icon>
            </button>

            <button
              mat-mini-fab
              color="primary"
              class="orange-float"
              type="button"
              aria-label="Expand upward"
              style="bottom: 24px; right: 24px"
            >
              <mat-icon>add</mat-icon>
            </button>

            <button
              mat-mini-fab
              color="primary"
              class="orange-float"
              type="button"
              aria-label="Expand to the right"
              style="top: 50%; left: 24px; transform: translateY(-50%)"
            >
              <mat-icon>add</mat-icon>
            </button>

            <div class="orange-notes">
              <h3 class="orange-subtitle">演示说明</h3>
              <ul>
                <li>主按钮支持回到顶部、展开按钮组或自定义点击回调。</li>
                <li>组按钮支持徽章计数与自定义样式。</li>
                <li>按下主按钮或按键 Enter/Space 可展开/收起组，按 Esc 或点击外部可关闭。</li>
              </ul>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Affix">
          <div class="orange-page-surface">
            <div class="orange-affix-container">
              <h1 class="orange-hero-title">Affix / 固钉</h1>

              <section class="orange-affix-card">
                <h2 class="orange-affix-title">Top Affix / 顶部固钉</h2>
                <p class="orange-muted">示例：顶部固钉，支持顶部与水平偏移。</p>

                <div
                  class="orange-affix-header"
                  [style.top.px]="offsetTop()"
                  [style.marginLeft.px]="offsetLeft() ?? 0"
                  [style.marginRight.px]="offsetRight() ?? 0"
                >
                  <span>Affixed header (dynamic offsets)</span>
                  <button mat-stroked-button type="button">Action</button>
                </div>

                <div class="control-row">
                  <label for="offset-top">Offset Top</label>
                  <mat-slider class="slider" min="0" max="200" step="1">
                    <input
                      id="offset-top"
                      matSliderThumb
                      [value]="offsetTop()"
                      (valueChange)="setOffsetTop($event)"
                    />
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
              </section>

              <section class="orange-affix-card">
                <h2 class="orange-affix-title">Bottom Fixed Affix / 底部固定</h2>
                <p class="orange-muted">
                  示例：底部固定（滚动到指定位置后固定），可设置底部与水平偏移。
                </p>

                <div class="orange-affix-scroll">
                  @for (line of scrollLines; track line) {
                    <div class="orange-scroll-line">{{ line }}</div>
                  }
                  <div
                    class="orange-affix-footer"
                    [style.bottom.px]="offsetBottom()"
                    [style.marginLeft.px]="offsetLeft() ?? 0"
                    [style.marginRight.px]="offsetRight() ?? 0"
                  >
                    <button mat-flat-button color="primary" type="button">Primary / 主要</button>
                    <button mat-button type="button">Secondary / 次要</button>
                  </div>
                </div>

                <div class="control-row">
                  <label for="offset-bottom">Offset Bottom</label>
                  <mat-slider class="slider" min="0" max="120" step="1">
                    <input
                      id="offset-bottom"
                      matSliderThumb
                      [value]="offsetBottom()"
                      (valueChange)="setOffsetBottom($event)"
                    />
                  </mat-slider>
                  <span class="mono value">{{ offsetBottom() }}px</span>
                </div>
              </section>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Typography">
          <div class="orange-typography">
            <h1 class="orange-type-h1">Typography 排版示例</h1>
            <br />
            <h2 class="orange-type-h2">Text 文本</h2>
            <p class="orange-type-p">
              <strong>Strong 加粗</strong> ·
              <span class="underlined">Underline 下划线</span> ·
              <del>Delete 删除线</del> ·
              <code class="mono code-inline">Code 代码</code> ·
              <em>Italic 斜体</em>
            </p>
            <br />
            <h2 class="orange-type-h2">copyable/editable 复制/编辑</h2>
            <p class="orange-type-p copyable">
              Copyable 支持复制
              <button mat-icon-button class="orange-icon-small" type="button" aria-label="Copy text" (click)="copyText()">
                <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
              </button>
            </p>
            <p class="orange-type-p copyable">
              Copyable withIcon 自定义图标复制
              <button mat-icon-button class="orange-icon-small" type="button" aria-label="Copy text" (click)="copyText()">
                <mat-icon>content_copy</mat-icon>
              </button>
            </p>
            <p class="orange-type-p copyable">
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
                {{ editableText() }}
                <button mat-icon-button class="orange-icon-small" type="button" aria-label="Edit text" (click)="editing.set(true)">
                  <mat-icon>edit</mat-icon>
                </button>
              }
            </p>
            <br />
            <h2 class="orange-type-h2">ellipsis 省略</h2>
            <p class="orange-type-p">
              <span class="ellipsis-copy" [class.clamp-1]="!expanded()['e1']">{{ ellipsisText }}</span>
            </p>
            <button mat-stroked-button type="button" (click)="toggleExpanded('e1')">
              {{ expanded()['e1'] ? '收起' : '展开' }}
            </button>
            <p class="orange-type-p">
              <span class="ellipsis-copy" [class.clamp-2]="!expanded()['e2']">{{ ellipsisText }}</span>
            </p>
            <button mat-stroked-button type="button" (click)="toggleExpanded('e2')">
              {{ expanded()['e2'] ? '收起' : '展开' }}
            </button>
            <p class="orange-type-p">
              <span class="ellipsis-copy" [class.clamp-1]="!expanded()['e3']">
                {{ expanded()['e3'] ? middleEllipsisText : middleTextDisplay }}
              </span>
            </p>
            <button mat-stroked-button type="button" (click)="toggleExpanded('e3')">
              {{ expanded()['e3'] ? '收起' : '展开' }}
            </button>
            <p class="orange-type-p">
              <span class="ellipsis-copy" [class.clamp-1]="!expanded()['e4']">{{ expandableText }}</span>
            </p>
            <button mat-stroked-button type="button" (click)="toggleExpanded('e4')">
              {{ expanded()['e4'] ? '收起全文' : '显示更多' }}
            </button>
            <p class="orange-type-p">
              <span class="ellipsis-copy" [class.clamp-2]="!expanded()['e5']">{{ iconExpandText }}</span>
            </p>
            <button mat-stroked-button type="button" (click)="toggleExpanded('e5')">
              {{ expanded()['e5'] ? '收起' : '展开' }}
            </button>
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
      .tab-pane h2 {
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
        display: flex;
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
export class ComponentGeneralComponent implements AfterViewInit, OnDestroy {
  readonly loading = signal(false);
  readonly showBackTop = signal(false);
  readonly offsetTop = signal(16);
  readonly offsetBottom = signal(16);
  readonly offsetLeft = signal<number | null>(null);
  readonly offsetRight = signal<number | null>(0);
  readonly copied = signal(false);
  readonly editing = signal(false);
  readonly editableText = signal('Editable 支持编辑');
  readonly expanded = signal<Record<string, boolean>>({});

  readonly scrollLines = Array.from({ length: 24 }, (_, index) => `Scroll content ${index + 1}`);

  readonly ellipsisText =
    '这是一段很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本'.repeat(10);
  readonly middleEllipsisText =
    '这是一段非常非常长的文本示例，用于展示中间省略，仅显示头尾，中间省略号...'.repeat(10);
  readonly middleTextDisplay = `${this.middleEllipsisText.slice(0, 15)}...${this.middleEllipsisText.slice(-15)}`;
  readonly expandableText = '这是一段很长的文本，用于测试自定义展开收起文字显示，并高亮显示。'.repeat(20);
  readonly iconExpandText = '这是一段很长的文本，用于测试自定义图标展开收起。'.repeat(20);

  private scrollHost: HTMLElement | null = null;
  private readonly onScroll = () => {
    this.showBackTop.set((this.scrollHost?.scrollTop ?? 0) > 200);
  };

  ngAfterViewInit(): void {
    this.scrollHost = document.querySelector('.main');
    this.scrollHost?.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  ngOnDestroy(): void {
    this.scrollHost?.removeEventListener('scroll', this.onScroll);
  }

  startLoading(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1800);
  }

  scrollToTop(): void {
    this.scrollHost?.scrollTo({ top: 0, behavior: 'smooth' });
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

  toggleExpanded(key: string): void {
    this.expanded.update((value) => ({ ...value, [key]: !value[key] }));
  }

  setEditableText(event: Event): void {
    this.editableText.set((event.target as HTMLInputElement).value);
  }
}
