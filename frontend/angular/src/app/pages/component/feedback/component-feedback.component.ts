import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { NotificationService } from '../../../core/notification.service';
import { I18nService } from '../../../core/i18n.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-component-feedback',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.feedback.title" descKey="page.component.feedback.desc" />
      <div class="feedback-grid">
        <section class="panel">
          <h2>Snackbars</h2>
          <p class="muted">Transient feedback for actions and failures.</p>
          <div class="row">
            <button mat-flat-button type="button" (click)="notify.success('Saved successfully')">Success</button>
            <button mat-stroked-button type="button" (click)="notify.error('Request failed')">Error</button>
            <button mat-stroked-button type="button" (click)="notify.warning('Session expires soon')">Warning</button>
            <button mat-stroked-button type="button" (click)="notify.info('Sync started')">Info</button>
          </div>
        </section>

        <section class="panel">
          <h2>Dialog</h2>
          <p class="muted">Destructive actions always confirm first.</p>
          <button mat-flat-button type="button" color="warn" (click)="openDialog()">Delete item…</button>
        </section>

        <section class="panel">
          <h2>Banners</h2>
          <div class="banner info">
            <mat-icon>info</mat-icon>
            <span>Uploaded files are scanned asynchronously.</span>
          </div>
          <div class="banner success">
            <mat-icon>check_circle</mat-icon>
            <span>Backup completed at 08:12 UTC.</span>
          </div>
          <div class="banner warn">
            <mat-icon>warning</mat-icon>
            <span>Two nodes are running a deprecated version.</span>
          </div>
          <div class="banner error">
            <mat-icon>error</mat-icon>
            <span>The last deployment failed at the health check.</span>
          </div>
        </section>

        <section class="panel">
          <h2>Progress</h2>
          <div class="progress-block">
            <span class="muted">Determinate</span>
            <mat-progress-bar mode="determinate" value="42" />
            <span class="muted">Indeterminate</span>
            <mat-progress-bar mode="indeterminate" />
            <span class="muted">Buffer</span>
            <mat-progress-bar mode="buffer" value="65" bufferValue="82" />
          </div>
          <div class="row">
            <mat-spinner diameter="28" />
            <mat-spinner diameter="38" />
            <mat-spinner diameter="48" />
          </div>
        </section>

        <section class="panel">
          <h2>Empty state</h2>
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No messages yet</p>
            <button mat-stroked-button type="button">Refresh</button>
          </div>
        </section>

        <section class="panel">
          <h2>Loading state</h2>
          <div class="skeleton-stack">
            <div class="skeleton w-70"></div>
            <div class="skeleton w-90"></div>
            <div class="skeleton w-50"></div>
            <div class="skeleton-card"></div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .feedback-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 16px;
      }
      h2 {
        font-size: 0.95rem;
      }
      .row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 10px;
      }
      .banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        margin-bottom: 8px;
        border-radius: 10px;
        font-size: 0.82rem;
      }
      .banner.info { background: rgba(37, 99, 235, 0.1); color: #1d4ed8; }
      .banner.success { background: rgba(22, 163, 74, 0.1); color: #15803d; }
      .banner.warn { background: rgba(217, 119, 6, 0.11); color: #b45309; }
      .banner.error { background: rgba(185, 28, 28, 0.09); color: #b91c1c; }
      .progress-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }
      .progress-block span {
        font-size: 0.72rem;
      }
      .skeleton-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .skeleton {
        height: 14px;
        border-radius: 6px;
        background: linear-gradient(90deg, #eef0f3 25%, #f8fafc 50%, #eef0f3 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .skeleton-card {
        height: 110px;
        border-radius: 12px;
        background: linear-gradient(90deg, #eef0f3 25%, #f8fafc 50%, #eef0f3 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .w-50 { width: 50%; }
      .w-70 { width: 70%; }
      .w-90 { width: 90%; }
      @keyframes shimmer {
        to { background-position: -200% 0; }
      }
    `,
  ],
})
export class ComponentFeedbackComponent {
  readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  openDialog(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.i18n.t('button.delete'),
        message: this.i18n.t('table.deleteConfirmSingle', { name: 'demo-item' }),
        confirmLabel: this.i18n.t('button.delete'),
        danger: true,
      },
      width: '420px',
      maxWidth: '94vw',
    });
  }
}
