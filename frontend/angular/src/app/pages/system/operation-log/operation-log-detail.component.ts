import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../../core/translate.pipe';
import { formatDateTime } from '../../../core/date-time';
import type { OperationLog } from '../../../core/models';

@Component({
  selector: 'app-operation-log-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'page.system.operationLog.detailTitle' | t }}</h2>
    <mat-dialog-content>
      <p class="route mono">{{ data.method }} {{ data.path }}</p>
      <dl class="detail">
        <div><dt>{{ 'page.system.operationLog.header.username' | t }}</dt><dd>{{ data.username || '-' }}</dd></div>
        <div><dt>{{ 'page.system.operationLog.header.createTime' | t }}</dt><dd>{{ formatDateTime(data.createTime) }}</dd></div>
        <div><dt>{{ 'page.system.operationLog.header.status' | t }}</dt><dd>{{ data.status }}</dd></div>
        <div><dt>{{ 'page.system.operationLog.header.duration' | t }}</dt><dd>{{ data.durationMs }} ms</dd></div>
        <div><dt>{{ 'page.system.operationLog.header.ip' | t }}</dt><dd>{{ data.ip || '-' }}</dd></div>
        <div><dt>{{ 'page.system.operationLog.header.traceId' | t }}</dt><dd class="mono break">{{ data.traceId || '-' }}</dd></div>
        <div><dt>{{ 'page.system.operationLog.queryString' | t }}</dt><dd class="mono break">{{ data.queryString || '-' }}</dd></div>
        <div class="full">
          <dt>{{ 'page.system.operationLog.requestBody' | t }}</dt>
          <dd><pre class="body">{{ data.requestBody || '-' }}</pre></dd>
        </div>
      </dl>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" (click)="ref.close()">{{ 'button.close' | t }}</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .route {
        margin: 0 0 14px;
        font-weight: 600;
      }
      .detail {
        display: grid;
        gap: 12px;
        margin: 0;
        font-size: 0.85rem;
      }
      dl div {
        display: grid;
        gap: 2px;
      }
      dt {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.74rem;
      }
      dd {
        margin: 0;
      }
      .break {
        word-break: break-all;
      }
      .body {
        max-height: 240px;
        overflow: auto;
        margin: 4px 0 0;
        padding: 10px;
        border-radius: 8px;
        background: var(--mat-sys-surface-container-low, #f7f8fa);
        font-size: 0.72rem;
        white-space: pre-wrap;
        word-break: break-all;
      }
    `,
  ],
})
export class OperationLogDetailComponent {
  readonly formatDateTime = formatDateTime;
  readonly ref = inject<MatDialogRef<OperationLogDetailComponent>>(MatDialogRef);
  readonly data = inject<OperationLog>(MAT_DIALOG_DATA);
}
