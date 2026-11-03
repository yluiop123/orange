import { Component, computed, inject } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { formatDateTime } from '../../../core/date-time';
import { ListController } from '../../../core/list-controller';
import { SystemApi } from '../../../core/system-api.service';
import { TranslatePipe } from '../../../core/translate.pipe';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { OperationLogDetailComponent } from './operation-log-detail.component';
import type { OperationLog } from '../../../core/models';

const HTTP_STATUSES = ['', '200', '201', '400', '401', '403', '404', '409', '500'];

@Component({
  selector: 'app-operation-log-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeaderComponent,
  ],
  templateUrl: './operation-log-page.component.html',
  styleUrl: './operation-log-page.component.scss',
})
export class OperationLogPageComponent {
  private readonly api = inject(SystemApi);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatDateTime = formatDateTime;
  readonly statuses = HTTP_STATUSES;
  readonly columns = ['createTime', 'username', 'method', 'path', 'status', 'durationMs', 'ip', 'traceId', 'actions'];

  readonly lists = new ListController<OperationLog>(
    (params) =>
      this.api.listOperationLogs({
        page: Number(params['page']),
        size: Number(params['size']),
        username: String(params['username'] ?? ''),
        path: String(params['path'] ?? ''),
        status: String(params['status'] ?? ''),
        from: toIso(String(params['from'] ?? '')) ?? '',
        to: toIso(String(params['to'] ?? '')) ?? '',
      }),
    { page: 1, size: 10, username: '', path: '', status: '', from: '', to: '' },
    this.destroyRef,
  );

  readonly page = computed(() => Number(this.lists.params()['page']));
  readonly size = computed(() => Number(this.lists.params()['size']));
  readonly usernameValue = computed(() => String(this.lists.params()['username'] ?? ''));
  readonly pathValue = computed(() => String(this.lists.params()['path'] ?? ''));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? ''));
  readonly fromValue = computed(() => String(this.lists.params()['from'] ?? ''));
  readonly toValue = computed(() => String(this.lists.params()['to'] ?? ''));

  onUsername(event: Event): void {
    this.lists.updateParams({ username: (event.target as HTMLInputElement).value });
  }

  onPath(event: Event): void {
    this.lists.updateParams({ path: (event.target as HTMLInputElement).value });
  }

  onStatus(status: string): void {
    this.lists.updateParams({ status });
  }

  onFrom(event: Event): void {
    this.lists.updateParams({ from: (event.target as HTMLInputElement).value });
  }

  onTo(event: Event): void {
    this.lists.updateParams({ to: (event.target as HTMLInputElement).value });
  }

  onPage(event: PageEvent): void {
    if (event.pageSize !== this.size()) this.lists.setSize(event.pageSize);
    else this.lists.setPage(event.pageIndex + 1);
  }

  openDetail(log: OperationLog): void {
    this.dialog.open(OperationLogDetailComponent, {
      data: log,
      width: '620px',
      maxWidth: '96vw',
    });
  }
}

function toIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
