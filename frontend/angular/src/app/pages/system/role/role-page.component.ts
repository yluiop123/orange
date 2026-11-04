import { Component, computed, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/auth.service';
import { formatDateTime } from '../../../core/date-time';
import { I18nService } from '../../../core/i18n.service';
import { ListController } from '../../../core/list-controller';
import { NotificationService } from '../../../core/notification.service';
import { SystemApi } from '../../../core/system-api.service';
import { TranslatePipe } from '../../../core/translate.pipe';
import { StatusFilterComponent } from '../../../shared/system/status-filter.component';
import { StatusToggleComponent } from '../../../shared/system/status-toggle.component';
import { SystemDialogService } from '../../../shared/system/system-dialog.service';
import { RoleDialogComponent } from './role-dialog.component';
import type { Role } from '../../../core/models';

@Component({
  selector: 'app-role-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
    StatusFilterComponent,
    StatusToggleComponent,
  ],
  templateUrl: './role-page.component.html',
  styleUrl: './role-page.component.scss',
})
export class RolePageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(SystemApi);
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialogs = inject(SystemDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatDateTime = formatDateTime;
  readonly path = '/system/role';

  readonly columnDefs = [
    { key: 'name', labelKey: 'page.system.role.header.name', hideable: false },
    { key: 'id', labelKey: 'page.system.role.header.role', hideable: true },
    { key: 'createTime', labelKey: 'page.system.role.header.createTime', hideable: true },
    { key: 'status', labelKey: 'page.system.role.header.status', hideable: true },
  ];
  readonly hiddenColumns = signal<ReadonlySet<string>>(new Set<string>());
  readonly visibleColumns = computed(() => [
    'select',
    ...this.columnDefs.filter((column) => !this.hiddenColumns().has(column.key)).map((column) => column.key),
    'actions',
  ]);

  readonly lists = new ListController<Role>(
    (params) =>
      this.api.listRoles({
        page: Number(params['page']),
        size: Number(params['size']),
        id: String(params['id'] ?? ''),
        name: String(params['name'] ?? ''),
        status: String(params['status'] ?? 'all'),
        sort: params['sort'] as string | undefined,
        direction: params['direction'] as 'asc' | 'desc' | undefined,
      }),
    { page: 1, size: 10, id: '', name: '', status: 'all' },
    this.destroyRef,
  );

  readonly page = computed(() => Number(this.lists.params()['page']));
  readonly size = computed(() => Number(this.lists.params()['size']));
  readonly nameValue = computed(() => String(this.lists.params()['name'] ?? ''));
  readonly idValue = computed(() => String(this.lists.params()['id'] ?? ''));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? 'all'));
  readonly pageIds = computed(() => this.lists.rows().map((role) => role.id));
  readonly allSelected = computed(() => {
    const ids = this.pageIds();
    return ids.length > 0 && ids.every((id) => this.lists.selected().has(id));
  });
  readonly someSelected = computed(() => this.lists.selected().size > 0 && !this.allSelected());
  readonly selectedCount = computed(() => this.lists.selected().size);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.lists.total() / this.size())),
  );

  onName(event: Event): void {
    this.lists.updateParams({ name: (event.target as HTMLInputElement).value });
  }

  onId(event: Event): void {
    this.lists.updateParams({ id: (event.target as HTMLInputElement).value });
  }

  onStatus(status: string): void {
    this.lists.updateParams({ status });
  }

  toggleAll(event: MatCheckboxChange): void {
    this.lists.toggleAll(this.pageIds(), event.checked);
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

  sortByName(): void {
    this.lists.toggleSort('name');
  }

  openAdd(): void {
    const ref = this.dialog.open(RoleDialogComponent, {
      data: { mode: 'add' },
      width: '620px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  openEdit(role: Role): void {
    const ref = this.dialog.open(RoleDialogComponent, {
      data: { mode: 'edit', id: role.id },
      width: '620px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  changeStatus(role: Role, status: string): void {
    this.api.updateRole(role.id, { status: status as '0' | '1' }).subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.reload();
      },
      error: () => this.lists.reload(),
    });
  }

  async requestDelete(roles: Role[]): Promise<void> {
    if (roles.length === 0) return;
    const confirmed =
      roles.length === 1
        ? await this.dialogs.confirmDeleteSingle(roles[0].name)
        : await this.dialogs.confirmDeleteMany(roles.length);
    if (!confirmed) return;
    this.api.deleteRoles(roles.map((role) => role.id)).subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.clampAfterDelete(roles.length);
      },
    });
  }

  async deleteSelected(): Promise<void> {
    const ids = new Set(this.lists.selected());
    await this.requestDelete(this.lists.rows().filter((role) => ids.has(role.id)));
  }
}
