import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../core/translate.pipe';
import { NotificationService } from '../core/notification.service';
import { I18nService } from '../core/i18n.service';

export interface PasswordResultData {
  password: string;
  username?: string;
}

@Component({
  selector: 'app-password-result-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'password.dialog.title' | t }}</h2>
    <mat-dialog-content>
      <p>{{ 'password.dialog.desc' | t: { username: data.username || '-' } }}</p>
      <div class="password-box">
        <code>{{ data.password }}</code>
        <button mat-icon-button type="button" [attr.aria-label]="'button.copy' | t" (click)="copy()">
          <mat-icon>content_copy</mat-icon>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" (click)="ref.close()">
        {{ 'button.close' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .password-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        background: var(--mat-sys-surface-container-high, #f1f3f4);
        font-size: 1.35rem;
        letter-spacing: 0.12em;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        font-weight: 600;
      }
    `,
  ],
})
export class PasswordResultDialogComponent {
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  readonly ref = inject<MatDialogRef<PasswordResultDialogComponent>>(MatDialogRef);
  readonly data = inject<PasswordResultData>(MAT_DIALOG_DATA);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.password);
      this.notify.success(this.i18n.t('button.copied'));
    } catch {
      this.notify.error(this.i18n.t('button.copy.failed'));
    }
  }
}
