import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../core/i18n.service';
import { ConfirmDialogComponent } from '../confirm-dialog.component';
import { PasswordResultDialogComponent } from '../password-result-dialog.component';

@Injectable({ providedIn: 'root' })
export class SystemDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  confirmDeleteSingle(name: string): Promise<boolean> {
    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: this.i18n.t('button.delete'),
            message: this.i18n.t('table.deleteConfirmSingle', { name }),
            confirmLabel: this.i18n.t('button.delete'),
            danger: true,
          },
          width: '420px',
          maxWidth: '94vw',
        })
        .afterClosed(),
    ).then((value) => value === true);
  }

  confirmDeleteMany(count: number): Promise<boolean> {
    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: this.i18n.t('button.delete'),
            message: this.i18n.t('table.deleteConfirm', { count }),
            confirmLabel: this.i18n.t('button.delete'),
            danger: true,
          },
          width: '420px',
          maxWidth: '94vw',
        })
        .afterClosed(),
    ).then((value) => value === true);
  }

  confirmAction(title: string, message: string, confirmLabel: string): Promise<boolean> {
    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: { title, message, confirmLabel },
          width: '420px',
          maxWidth: '94vw',
        })
        .afterClosed(),
    ).then((value) => value === true);
  }

  showPassword(password: string, username?: string): void {
    this.dialog.open(PasswordResultDialogComponent, {
      data: { password, username },
      width: '440px',
      maxWidth: '94vw',
    });
  }
}
