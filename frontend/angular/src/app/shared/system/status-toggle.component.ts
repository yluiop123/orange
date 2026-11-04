import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ConfirmDialogComponent } from '../confirm-dialog.component';
import type { Status } from '../../core/models';

/**
 * Compact status switch matching the React 32x18 control.
 * Disabling always asks for confirmation before committing.
 */
@Component({
  selector: 'app-status-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      role="switch"
      class="status-switch"
      [class.checked]="status() === '1'"
      [attr.aria-checked]="status() === '1'"
      [disabled]="disabled()"
      [attr.aria-label]="'table.toggleStatus' | t"
      (click)="toggle()"
    >
      <span class="status-switch-thumb"></span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }
      .status-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 2rem;
        height: 1.125rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: var(--app-input);
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .status-switch.checked {
        background: var(--app-primary);
      }
      .status-switch:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .status-switch-thumb {
        display: block;
        width: 0.875rem;
        height: 0.875rem;
        margin-left: 0.125rem;
        border-radius: 50%;
        background: var(--app-background);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease;
      }
      .status-switch.checked .status-switch-thumb {
        transform: translateX(0.875rem);
      }
    `,
  ],
})
export class StatusToggleComponent {
  readonly status = input.required<Status | string | undefined>();
  readonly name = input('');
  readonly disabled = input(false);
  readonly changed = output<Status>();

  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  async toggle(): Promise<void> {
    const next: Status = this.status() === '1' ? '0' : '1';
    if (next === '0') {
      const message = this.name()
        ? this.i18n.t('table.disableConfirmNamed', { name: this.name() })
        : this.i18n.t('table.disableConfirm');
      const confirmed = await firstValueFrom(
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: this.i18n.t('table.disableTitle'),
            message,
            confirmLabel: this.i18n.t('button.disable'),
            danger: true,
          },
          width: '420px',
          maxWidth: '94vw',
        }).afterClosed(),
      );
      if (!confirmed) return;
    }
    this.changed.emit(next);
  }
}
