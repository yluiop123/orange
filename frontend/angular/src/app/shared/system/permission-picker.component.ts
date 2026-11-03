import { Component, effect, inject, input, output, signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { ReferenceDataService } from '../../core/reference-data.service';
import { buildTree, collectSubtreeIds, flattenTree } from '../../core/tree-rows';
import { TranslatePipe } from '../../core/translate.pipe';
import type { PermissionRow } from '../../core/models';

/** Indented checkbox tree for granting permissions by permission id. */
@Component({
  selector: 'app-permission-picker',
  standalone: true,
  imports: [MatCheckboxModule, TranslatePipe],
  template: `
    @if (loading()) {
      <p class="note">{{ 'table.loading' | t }}</p>
    } @else {
      <div class="picker" role="group">
        @for (row of flat(); track row.node.id) {
          <div class="picker-row" [style.paddingLeft.px]="8 + row.depth * 16">
            <mat-checkbox
              [checked]="isChecked(row.node.id)"
              [attr.aria-label]="row.node.name"
              (change)="toggle(row.node, $event)"
            />
            <span class="name">{{ row.node.name }}</span>
            <span class="mono code">{{ row.node.id }}</span>
            <span class="chip">{{ ('dict.permissionType.' + row.node.type) | t }}</span>
          </div>
        } @empty {
          <p class="note">{{ 'table.empty' | t }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .picker {
        max-height: 300px;
        overflow: auto;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        padding: 6px 0;
        background: var(--app-card);
      }
      .picker-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 10px;
        font-size: 0.82rem;
      }
      .picker-row:hover {
        background: var(--mat-sys-surface-container-low, #f7f8fa);
      }
      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .code {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.72rem;
      }
      .chip {
        margin-left: auto;
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--mat-sys-surface-container-high, #f1f3f4);
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.68rem;
      }
      .note {
        margin: 0;
        padding: 12px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.82rem;
      }
    `,
  ],
})
export class PermissionPickerComponent {
  readonly permissions = input<string[]>([]);
  readonly selectedChange = output<string[]>();

  private readonly reference = inject(ReferenceDataService);
  readonly loading = signal(true);
  private readonly selected = signal<Set<string>>(new Set());
  private tree: PermissionRow[] = [];
  readonly flat = signal<ReturnType<typeof flattenTree<PermissionRow>>>([]);

  constructor() {
    effect(() => {
      this.selected.set(new Set(this.permissions()));
    });
    this.reference.ensurePermissions().subscribe({
      next: (rows) => {
        const copies = (rows ?? []).map((row) => ({ ...row }));
        this.tree = buildTree(
          copies,
          (row) => row.id,
          (row) => row.parentId,
        );
        const expanded = new Set(this.tree.flatMap((node) => collectSubtreeIds(node, (n) => n.children ?? [], (n) => n.id)));
        this.flat.set(
          flattenTree(this.tree, (node) => node.children ?? [], expanded, (node) => node.id),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isChecked(id: string): boolean {
    return this.selected().has(id);
  }

  toggle(node: PermissionRow, event: MatCheckboxChange): void {
    const ids = collectSubtreeIds(node, (n) => n.children ?? [], (n) => n.id);
    const next = new Set(this.selected());
    for (const id of ids) {
      if (event.checked) next.add(id);
      else next.delete(id);
    }
    this.selected.set(next);
    this.selectedChange.emit([...next]);
  }
}
