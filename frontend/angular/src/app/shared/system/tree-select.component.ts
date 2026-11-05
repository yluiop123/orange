import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { buildTree } from '../../core/tree-rows';
import { TranslatePipe } from '../../core/translate.pipe';

export interface TreeSelectItem {
  id: string;
  name: string;
  parentId?: string | null;
  disabled?: boolean;
}

type TreeNode = TreeSelectItem & { children?: TreeNode[] };

@Component({
  selector: 'app-tree-select',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="tree-select" [class.is-disabled]="disabled()">
      <button
        #trigger
        type="button"
        class="ts-trigger"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="placeholder()"
        (click)="toggleOpen()"
      >
        <span class="ts-value">
          @if (multiple() && selectedItems().length > 0) {
            @for (item of selectedItems(); track item.id) {
              <span class="ts-chip">
                {{ item.name }}
                <span
                  class="ts-chip-x"
                  role="button"
                  tabindex="0"
                  (click)="remove(item.id, $event)"
                  (keydown.enter)="remove(item.id, $event)"
                >×</span>
              </span>
            }
          } @else {
            <span class="ts-placeholder">{{ selectedTitle() || placeholder() }}</span>
          }
        </span>
        <mat-icon class="ts-caret">expand_more</mat-icon>
      </button>

      @if (open()) {
        <div class="ts-popover" [style]="popoverStyle()">
          @if (filterable()) {
            <input
              class="ts-search"
              type="text"
              [value]="search()"
              [attr.aria-label]="'button.search' | t"
              (input)="search.set(($any($event.target).value ?? '').toString())"
            />
          }
          @if (allowEmpty() && !multiple()) {
            <button type="button" class="ts-row" (click)="chooseEmpty()">
              <span class="ts-chevron"></span>
              <span class="ts-name">{{ emptyLabel() | t }}</span>
            </button>
          }
          @for (row of rows(); track row.node.id) {
            <div
              class="ts-row"
              role="option"
              tabindex="0"
              [attr.aria-selected]="isSelected(row.node.id)"
              [class.selected]="isSelected(row.node.id)"
              [class.disabled]="row.node.disabled && !isSelected(row.node.id)"
              [style.paddingLeft.px]="8 + row.depth * 16"
              (click)="choose(row.node)"
              (keydown.enter)="choose(row.node)"
              (keydown.space)="choose(row.node); $event.preventDefault()"
            >
              @if (row.hasChildren) {
                <button
                  type="button"
                  class="ts-chevron"
                  (click)="toggleExpand($event, row.node.id)"
                  [attr.aria-label]="row.node.name"
                >
                  <mat-icon>{{ row.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                </button>
              } @else {
                <span class="ts-chevron"></span>
              }
              @if (multiple()) {
                <input
                  class="ts-check"
                  type="checkbox"
                  [checked]="isSelected(row.node.id)"
                  [disabled]="row.node.disabled && !isSelected(row.node.id)"
                  [attr.aria-label]="row.node.name"
                  (click)="$event.stopPropagation()"
                  (change)="toggleCheck(row.node, $any($event.target).checked)"
                />
              }
              <span class="ts-name">{{ row.node.name }}</span>
              @if (!multiple() && isSelected(row.node.id)) {
                <mat-icon class="ts-check-mark">check</mat-icon>
              }
            </div>
          } @empty {
            <div class="ts-empty">{{ 'table.empty' | t }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .tree-select {
        position: relative;
        width: 100%;
      }
      .ts-trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 36px;
        padding: 4px 8px;
        border: 1px solid var(--app-input);
        border-radius: 8px;
        background: var(--app-background);
        color: var(--app-foreground);
        font: inherit;
        font-size: 14px;
        text-align: left;
        cursor: pointer;
      }
      .ts-trigger:disabled,
      .tree-select.is-disabled .ts-trigger {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .ts-value {
        display: flex;
        flex: 1;
        flex-wrap: wrap;
        gap: 4px;
        min-width: 0;
      }
      .ts-placeholder {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--app-muted-foreground);
      }
      .ts-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        max-width: 100%;
        padding: 1px 6px;
        border-radius: 5px;
        background: var(--app-muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .ts-chip-x {
        cursor: pointer;
        color: var(--app-muted-foreground);
        padding: 0 2px;
      }
      .ts-chip-x:hover {
        color: var(--app-foreground);
      }
      .ts-caret {
        width: 16px;
        height: 16px;
        font-size: 16px;
        opacity: 0.7;
      }
      .ts-popover {
        position: absolute;
        z-index: 1000;
        top: calc(100% + 4px);
        left: 0;
        width: 288px;
        max-width: min(336px, 92vw);
        max-height: 340px;
        overflow: auto;
        padding: 4px;
        border: 1px solid var(--app-border);
        border-radius: 8px;
        background: var(--app-card);
        box-shadow: 0 16px 40px -20px rgba(0, 0, 0, 0.45);
      }
      .ts-search {
        width: 100%;
        min-height: 30px;
        margin-bottom: 4px;
        padding: 4px 8px;
        border: 1px solid var(--app-input);
        border-radius: 6px;
        background: var(--app-background);
        color: var(--app-foreground);
        font: inherit;
        font-size: 13px;
        outline: none;
      }
      .ts-row {
        display: flex;
        align-items: center;
        gap: 5px;
        min-height: 28px;
        padding: 2px 6px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--app-foreground);
        font: inherit;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
      }
      .ts-row:hover {
        background: var(--app-muted);
      }
      .ts-row.selected {
        background: color-mix(in srgb, var(--app-primary) 12%, transparent);
      }
      .ts-row.disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .ts-chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--app-muted-foreground);
        cursor: pointer;
      }
      .ts-chevron mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .ts-check {
        width: 14px;
        height: 14px;
        margin: 0 2px 0 0;
        accent-color: var(--app-primary);
      }
      .ts-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ts-check-mark {
        margin-left: auto;
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      .ts-empty {
        padding: 12px;
        color: var(--app-muted-foreground);
        font-size: 13px;
        text-align: center;
      }
    `,
  ],
})
export class TreeSelectComponent {
  readonly items = input<TreeSelectItem[]>([]);
  readonly value = input<string | string[]>('');
  readonly multiple = input(false);
  readonly placeholder = input('');
  readonly filterable = input(false);
  readonly disabled = input(false);
  readonly allowEmpty = input(false);
  readonly emptyLabel = input('dict.status.all');
  readonly valueChange = output<string | string[]>();

  readonly open = signal(false);
  readonly search = signal('');
  readonly expanded = signal<ReadonlySet<string>>(new Set());
  readonly popoverStyle = signal<Record<string, string>>({});

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;

  private readonly el = inject(ElementRef<HTMLElement>);

  toggleOpen(): void {
    if (this.disabled()) return;
    const next = !this.open();
    if (next && this.triggerRef) {
      const rect = this.triggerRef.nativeElement.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 32);
      const left = Math.min(rect.left, window.innerWidth - width - 16);
      this.popoverStyle.set({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${Math.max(8, left)}px`,
        width: `${width}px`,
        'max-height': `${Math.max(180, Math.min(340, window.innerHeight - rect.bottom - 16))}px`,
      });
    }
    this.open.set(next);
  }

  private readonly tree = computed<TreeNode[]>(() =>
    buildTree(
      this.items().map((item) => ({ ...item })),
      (item) => item.id,
      (item) => item.parentId,
    ),
  );

  readonly selectedIds = computed(() => {
    const value = this.value();
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    return new Set(ids);
  });

  readonly selectedItems = computed(() => {
    const ids = this.selectedIds();
    return this.items().filter((item) => ids.has(item.id));
  });

  readonly selectedTitle = computed(() => {
    if (this.multiple()) return '';
    const value = this.value();
    const id = Array.isArray(value) ? value[0] : value;
    return this.items().find((item) => item.id === id)?.name ?? '';
  });

  readonly rows = computed(() => {
    const keyword = this.search().trim().toLowerCase();
    const expanded = this.expanded();
    const result: { node: TreeNode; depth: number; hasChildren: boolean; expanded: boolean }[] = [];
    const deepMatch = (node: TreeNode): boolean =>
      node.name.toLowerCase().includes(keyword)
      || (node.children ?? []).some((child) => deepMatch(child));
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        if (keyword && !deepMatch(node)) continue;
        const children = node.children ?? [];
        const isExpanded = keyword !== '' || expanded.has(node.id);
        result.push({ node, depth, hasChildren: children.length > 0, expanded: isExpanded });
        if (children.length > 0 && isExpanded) walk(children, depth + 1);
      }
    };
    walk(this.tree(), 0);
    return result;
  });

  @HostListener('document:pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleExpand(event: Event, id: string): void {
    event.stopPropagation();
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  choose(node: TreeNode): void {
    if (node.disabled && !this.isSelected(node.id)) return;
    if (this.multiple()) {
      this.toggleCheck(node, !this.isSelected(node.id));
      return;
    }
    this.valueChange.emit(node.id);
    this.open.set(false);
  }

  chooseEmpty(): void {
    this.valueChange.emit(this.multiple() ? [] : '');
    this.open.set(false);
  }

  toggleCheck(node: TreeNode, checked: boolean): void {
    if (node.disabled && !this.isSelected(node.id) && checked) return;
    const next = new Set(this.selectedIds());
    if (checked) next.add(node.id);
    else next.delete(node.id);
    const ids = this.items().filter((item) => next.has(item.id)).map((item) => item.id);
    this.valueChange.emit(ids);
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    const next = new Set(this.selectedIds());
    next.delete(id);
    this.valueChange.emit(this.items().filter((item) => next.has(item.id)).map((item) => item.id));
  }
}
