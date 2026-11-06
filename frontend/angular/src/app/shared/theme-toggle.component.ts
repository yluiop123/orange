import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../core/i18n.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      type="button"
      class="theme-toggle"
      data-testid="theme-toggle"
      [attr.aria-label]="i18n.t(dark ? 'header.theme.light' : 'header.theme.dark')"
      (click)="toggled.emit(!dark)"
    >
      <mat-icon>{{ dark ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        color: var(--app-foreground);
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly i18n = inject(I18nService);

  @Input() dark = false;
  @Output() toggled = new EventEmitter<boolean>();
}
