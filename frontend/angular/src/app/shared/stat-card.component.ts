import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="stat-card">
      <div class="glyph"><mat-icon>{{ icon() }}</mat-icon></div>
      <div class="label">{{ labelKey() | t }}</div>
      <div class="value">{{ value() }}</div>
      @if (delta()) {
        <div class="delta" [class.down]="down()">
          <mat-icon>{{ down() ? 'south_east' : 'north_east' }}</mat-icon>
          {{ delta() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .delta {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .delta mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    `,
  ],
})
export class StatCardComponent {
  readonly labelKey = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input('insights');
  readonly delta = input('');
  readonly down = input(false);
}
