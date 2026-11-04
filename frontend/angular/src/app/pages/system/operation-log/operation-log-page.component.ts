import { Component, computed, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { formatDateTime } from '../../../core/date-time';
import { ListController } from '../../../core/list-controller';
import { SystemApi } from '../../../core/system-api.service';
import { TranslatePipe } from '../../../core/translate.pipe';
import {
  DateTimeRangePickerComponent,
  type DateTimeRangeValue,
} from '../../../shared/system/date-time-range-picker.component';
import { OperationLogDetailComponent } from './operation-log-detail.component';
import type { OperationLog } from '../../../core/models';

const HTTP_STATUSES = ['', '200', '201', '400', '401', '403', '404', '409', '500'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Default query window: local today, 00:00 to 23:59. */
function todayRange(): DateTimeRangeValue {
  const today = new Date();
  const day = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return { from: `${day}T00:00`, to: `${day}T23:59` };
}

@Component({
  selector: 'app-operation-log-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
    DateTimeRangePickerComponent,
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

  readonly columnDefs = [
    { key: 'createTime', labelKey: 'page.system.operationLog.header.createTime', hideable: true },
    { key: 'username', labelKey: 'page.system.operationLog.header.username', hideable: true },
    { key: 'method', labelKey: 'page.system.operationLog.header.method', hideable: true },
    { key: 'path', labelKey: 'page.system.operationLog.header.path', hideable: true },
    { key: 'status', labelKey: 'page.system.operationLog.header.status', hideable: true },
    { key: 'durationMs', labelKey: 'page.system.operationLog.header.duration', hideable: true },
    { key: 'ip', labelKey: 'page.system.operationLog.header.ip', hideable: true },
    { key: 'traceId', labelKey: 'page.system.operationLog.header.traceId', hideable: true },
  ];
  readonly hiddenColumns = signal<ReadonlySet<string>>(new Set<string>());
  readonly visibleColumns = computed(() => [
    ...this.columnDefs.filter((column) => !this.hiddenColumns().has(column.key)).map((column) => column.key),
    'actions',
  ]);

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
    { page: 1, size: 10, username: '', path: '', status: '', ...todayRange() },
    this.destroyRef,
  );

  readonly page = computed(() => Number(this.lists.params()['page']));
  readonly size = computed(() => Number(this.lists.params()['size']));
  readonly usernameValue = computed(() => String(this.lists.params()['username'] ?? ''));
  readonly pathValue = computed(() => String(this.lists.params()['path'] ?? ''));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? ''));
  readonly fromValue = computed(() => String(this.lists.params()['from'] ?? ''));
  readonly toValue = computed(() => String(this.lists.params()['to'] ?? ''));
  readonly rangeValue = computed<DateTimeRangeValue>(() => ({
    from: this.fromValue(),
    to: this.toValue(),
  }));
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.lists.total() / this.size())),
  );

  onUsername(event: Event): void {
    this.lists.updateParams({ username: (event.target as HTMLInputElement).value });
  }

  onPath(event: Event): void {
    this.lists.updateParams({ path: (event.target as HTMLInputElement).value });
  }

  onStatus(status: string): void {
    this.lists.updateParams({ status });
  }

  onStatusChange(event: Event): void {
    this.onStatus((event.target as HTMLSelectElement).value);
  }

  onRangeChange(value: DateTimeRangeValue): void {
    this.lists.updateParams({ from: value.from, to: value.to });
  }

  isColumnHidden(key: string): boolean {
    return this.hiddenColumns().has(key);
  }

  toggleColumn(key: string): void {
    const next = new Set(this.hiddenColumns());
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.hiddenColumns.set(next);
  }

  previousPage(): void {
    if (this.page() > 1) this.lists.setPage(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) this.lists.setPage(this.page() + 1);
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
