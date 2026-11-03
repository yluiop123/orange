import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReferenceDataService } from '../../core/reference-data.service';
import { buildTree, allNodeIds, flattenTree } from '../../core/tree-rows';
import { TranslatePipe } from '../../core/translate.pipe';
import type { Group } from '../../core/models';

@Component({
  selector: 'app-group-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, TranslatePipe],
  template: `
    <mat-form-field appearance="outline" class="group-select" subscriptSizing="dynamic">
      <mat-label>{{ label() | t }}</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="disabled()"
        (selectionChange)="valueChange.emit($event.value)"
      >
        @if (allowEmpty()) {
          <mat-option value="">{{ emptyLabel() | t }}</mat-option>
        }
        @for (row of flat(); track row.node.id) {
          <mat-option [value]="row.node.id">
            <span [style.paddingLeft.px]="row.depth * 12">{{ row.node.name }}</span>
            <span class="code">{{ row.node.id }}</span>
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      .group-select {
        width: 100%;
        min-width: 180px;
      }
      .code {
        margin-left: 8px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.72rem;
        font-family: ui-monospace, Consolas, monospace;
      }
    `,
  ],
})
export class GroupSelectComponent {
  readonly value = input<string>('');
  readonly label = input('page.system.user.header.groupName');
  readonly emptyLabel = input('dict.status.all');
  readonly allowEmpty = input(true);
  readonly disabled = input(false);
  readonly valueChange = output<string>();

  private readonly reference = inject(ReferenceDataService);
  private readonly groups = signal<Group[]>([]);

  readonly flat = computed(() => {
    const tree = buildTree(
      this.groups().map((group) => ({ ...group })),
      (group) => group.id,
      (group) => group.parentId,
    );
    const expanded = new Set(allNodeIds(tree, (node) => node.children ?? [], (node) => node.id));
    return flattenTree(tree, (node) => node.children ?? [], expanded, (node) => node.id);
  });

  constructor() {
    this.reference.ensureGroups().subscribe((groups) => this.groups.set(groups ?? []));
  }
}
