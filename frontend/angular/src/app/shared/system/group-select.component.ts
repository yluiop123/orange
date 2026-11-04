import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ReferenceDataService } from '../../core/reference-data.service';
import { buildTree, allNodeIds, flattenTree } from '../../core/tree-rows';
import { TranslatePipe } from '../../core/translate.pipe';
import type { Group } from '../../core/models';

/** Organization filter rendered as a compact native select (React parity). */
@Component({
  selector: 'app-group-select',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <select
      class="system-select group-select"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-label]="label() | t"
      (change)="onChange($event)"
    >
      @if (allowEmpty()) {
        <option value="">{{ emptyLabel() | t }}</option>
      }
      @for (row of flat(); track row.node.id) {
        <option [value]="row.node.id">{{ indent(row.depth) }}{{ row.node.name }}</option>
      }
    </select>
  `,
  styles: [
    `
      .group-select {
        width: 15rem;
        max-width: 100%;
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

  indent(depth: number): string {
    return '\u00a0\u00a0'.repeat(depth);
  }

  onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
