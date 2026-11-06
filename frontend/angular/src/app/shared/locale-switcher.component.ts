import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { I18nService, Locale } from '../core/i18n.service';
import { TranslatePipe } from '../core/translate.pipe';

@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  template: `
    <button
      mat-button
      type="button"
      class="locale-switcher"
      data-testid="locale-switcher"
      [matMenuTriggerFor]="languageMenu"
      [attr.title]="'header.language' | t"
      [attr.aria-label]="'header.language' | t"
    >
      <mat-icon>translate</mat-icon>
      <span>{{ currentLabel() }}</span>
    </button>

    <mat-menu #languageMenu="matMenu" xPosition="before" class="language-menu">
      @for (item of i18n.languages; track item.id) {
        <button mat-menu-item type="button" (click)="select(item.id)">
          <span>{{ item.label }}</span>
          @if (i18n.locale() === item.id) {
            <span class="language-check" aria-hidden="true">
              <mat-icon>check</mat-icon>
            </span>
          }
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      .locale-switcher {
        min-width: 0;
        height: 32px;
        padding: 0 10px;
        font-size: 12px;
        color: var(--app-foreground);
      }

      .locale-switcher .mat-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        font-size: 16px;
      }

      .language-check {
        display: inline-flex;
        margin-left: auto;
        padding-left: 12px;
      }

      .language-check .mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
    `,
  ],
})
export class LocaleSwitcherComponent {
  readonly i18n = inject(I18nService);

  @Output() changed = new EventEmitter<Locale>();

  currentLabel(): string {
    return this.i18n.languages.find((item) => item.id === this.i18n.locale())?.label ?? 'EN';
  }

  select(locale: Locale): void {
    if (locale === this.i18n.locale()) return;
    this.i18n.setLocale(locale);
    this.changed.emit(locale);
  }
}
