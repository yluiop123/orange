import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../core/translate.pipe';

/**
 * Compact status filter used by the system list toolbars.
 * Rendered as a plain select so it lines up with the React reference
 * (no floating Material label).
 */
@Component({
  selector: 'app-status-filter',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <select
      class="system-select status-filter"
      [value]="value()"
      [attr.aria-label]="label() | t"
      (change)="onChange($event)"
    >
      <option value="all">{{ 'dict.status.all' | t }}</option>
      <option value="1">{{ 'dict.status.enabled' | t }}</option>
      <option value="0">{{ 'dict.status.disabled' | t }}</option>
    </select>
  `,
  styles: [
    `
      .status-filter {
        width: 7.5rem;
      }
    `,
  ],
})
export class StatusFilterComponent {
  readonly value = input<string>('all');
  readonly label = input('page.system.user.header.status');
  readonly valueChange = output<string>();

  onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
