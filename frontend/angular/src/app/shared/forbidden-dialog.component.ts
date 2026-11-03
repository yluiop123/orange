import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../core/translate.pipe';

export interface ForbiddenDialogData {
  path?: string;
  message?: string;
}

/** Modal equivalent of the React/Vue forbidden dialog for a denied action. */
@Component({
  selector: 'app-forbidden-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">gpp_bad</mat-icon>
      {{ 'forbidden.action.title' | t }}
    </h2>
    <mat-dialog-content>
      <p class="message">{{ data.message || ('forbidden.action.desc' | t) }}</p>
      @if (data.path) {
        <code class="path">{{ data.path }}</code>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" (click)="ref.close()">
        {{ 'button.close' | t }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .title-icon {
        color: var(--mat-sys-error, #b3261e);
      }
      .message {
        margin: 0;
        line-height: 1.6;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .path {
        display: block;
        margin-top: 12px;
        font-size: 0.75rem;
        word-break: break-all;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
    `,
  ],
})
export class ForbiddenDialogComponent {
  readonly ref = inject(MatDialogRef<ForbiddenDialogComponent>);
  readonly data = inject<ForbiddenDialogData>(MAT_DIALOG_DATA);
}
