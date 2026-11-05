import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ReferenceDataService } from '../../core/reference-data.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TreeSelectComponent, type TreeSelectItem } from './tree-select.component';
import type { PermissionRow } from '../../core/models';

/** Permission grants rendered as a checkable tree dropdown, matching React. */
@Component({
  selector: 'app-permission-picker',
  standalone: true,
  imports: [TreeSelectComponent, TranslatePipe],
  template: `
    <app-tree-select
      [items]="items()"
      [value]="permissions()"
      [multiple]="true"
      [filterable]="true"
      [placeholder]="(loading() ? 'table.loading' : 'page.system.user.header.permissions') | t"
      (valueChange)="selectedChange.emit($any($event))"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class PermissionPickerComponent {
  readonly permissions = input<string[]>([]);
  readonly selectedChange = output<string[]>();

  private readonly reference = inject(ReferenceDataService);
  readonly loading = signal(true);
  private readonly rows = signal<PermissionRow[]>([]);

  readonly items = computed<TreeSelectItem[]>(() =>
    this.rows().map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      disabled: row.status === '0',
    })),
  );

  constructor() {
    this.reference.ensurePermissions().subscribe({
      next: (rows) => {
        this.rows.set(rows ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
