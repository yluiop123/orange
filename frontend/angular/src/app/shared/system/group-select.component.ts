import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ReferenceDataService } from '../../core/reference-data.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { TreeSelectComponent, type TreeSelectItem } from './tree-select.component';
import type { Group } from '../../core/models';

/** Organization selector rendered as a tree dropdown, matching React. */
@Component({
  selector: 'app-group-select',
  standalone: true,
  imports: [TreeSelectComponent, TranslatePipe],
  template: `
    <app-tree-select
      [items]="items()"
      [value]="value()"
      [filterable]="true"
      [placeholder]="label() | t"
      [allowEmpty]="allowEmpty()"
      [emptyLabel]="emptyLabel()"
      [disabled]="disabled()"
      (valueChange)="valueChange.emit($any($event))"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      :host(.group-filter) {
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

  readonly items = computed<TreeSelectItem[]>(() =>
    this.groups().map((group) => ({
      id: group.id,
      name: group.name,
      parentId: group.parentId,
      disabled: group.status === '0',
    })),
  );

  constructor() {
    this.reference.ensureGroups().subscribe((groups) => this.groups.set(groups ?? []));
  }
}
