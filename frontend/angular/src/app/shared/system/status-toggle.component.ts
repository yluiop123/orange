import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ConfirmDialogComponent } from '../confirm-dialog.component';
import type { Status } from '../../core/models';

/** Status switch: disabling always asks for confirmation. */
@Component({
  selector: 'app-status-toggle',
  standalone: true,
  imports: [MatSlideToggleModule, TranslatePipe],
  template: `
    <mat-slide-toggle
      [checked]="status() === '1'"
      [attr.aria-label]="'table.toggleStatus' | t"
      (change)="onChange($event)"
    />
  `,
})
export class StatusToggleComponent {
  readonly status = input.required<Status | string | undefined>();
  readonly name = input('');
  readonly changed = output<Status>();

  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  async onChange(event: MatSlideToggleChange): Promise<void> {
    const next: Status = event.checked ? '1' : '0';
    if (next === this.status()) {
      return;
    }
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
      if (!confirmed) {
        event.source.checked = true;
        return;
      }
    }
    this.changed.emit(next);
  }
}
