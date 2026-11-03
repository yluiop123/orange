import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-status-filter',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, TranslatePipe],
  template: `
    <mat-form-field appearance="outline" class="status-filter" subscriptSizing="dynamic">
      <mat-label>{{ label() | t }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="valueChange.emit($event.value)">
        <mat-option value="all">{{ 'dict.status.all' | t }}</mat-option>
        <mat-option value="1">{{ 'dict.status.enabled' | t }}</mat-option>
        <mat-option value="0">{{ 'dict.status.disabled' | t }}</mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      .status-filter {
        width: 130px;
      }
    `,
  ],
})
export class StatusFilterComponent {
  readonly value = input<string>('all');
  readonly label = input('page.system.user.header.status');
  readonly valueChange = output<string>();
}
