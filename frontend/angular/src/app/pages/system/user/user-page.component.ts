import { Component, computed, inject } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth.service';
import { formatDateTime } from '../../../core/date-time';
import { I18nService } from '../../../core/i18n.service';
import { ListController } from '../../../core/list-controller';
import { NotificationService } from '../../../core/notification.service';
import { SystemApi } from '../../../core/system-api.service';
import { TranslatePipe } from '../../../core/translate.pipe';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatusFilterComponent } from '../../../shared/system/status-filter.component';
import { StatusToggleComponent } from '../../../shared/system/status-toggle.component';
import { GroupSelectComponent } from '../../../shared/system/group-select.component';
import { SystemDialogService } from '../../../shared/system/system-dialog.service';
import { UserDialogComponent, type UserDialogResult } from './user-dialog.component';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslatePipe,
    PageHeaderComponent,
    StatusFilterComponent,
    StatusToggleComponent,
    GroupSelectComponent,
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
})
export class UserPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(SystemApi);
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialogs = inject(SystemDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatDateTime = formatDateTime;
  readonly columns = ['select', 'name', 'username', 'email', 'phone', 'groupName', 'createTime', 'status', 'actions'];
  readonly path = '/system/user';

  readonly lists = new ListController<User>(
    (params) =>
      this.api.listUsers({
        page: Number(params['page']),
        size: Number(params['size']),
        keyword: String(params['keyword'] ?? ''),
        status: String(params['status'] ?? 'all'),
        groupId: String(params['groupId'] ?? ''),
        sort: params['sort'] as string | undefined,
        direction: params['direction'] as 'asc' | 'desc' | undefined,
      }),
    { page: 1, size: 10, keyword: '', status: 'all', groupId: '' },
    this.destroyRef,
  );

  readonly page = computed(() => Number(this.lists.params()['page']));
  readonly size = computed(() => Number(this.lists.params()['size']));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? 'all'));
  readonly groupValue = computed(() => String(this.lists.params()['groupId'] ?? ''));
  readonly keywordValue = computed(() => String(this.lists.params()['keyword'] ?? ''));
  readonly pageIds = computed(() => this.lists.rows().map((user) => user.id));
  readonly allSelected = computed(() => {
    const ids = this.pageIds();
    return ids.length > 0 && ids.every((id) => this.lists.selected().has(id));
  });
  readonly someSelected = computed(
    () => this.lists.selected().size > 0 && !this.allSelected(),
  );

  isSelf(user: User): boolean {
    return !!this.auth.user()?.username && user.username === this.auth.user()?.username;
  }

  onKeyword(event: Event): void {
    this.lists.updateParams({ keyword: (event.target as HTMLInputElement).value });
  }

  onGroup(groupId: string): void {
    this.lists.updateParams({ groupId });
  }

  onStatus(status: string): void {
    this.lists.updateParams({ status });
  }

  toggleAll(event: MatCheckboxChange): void {
    this.lists.toggleAll(this.pageIds(), event.checked);
  }

  onPage(event: PageEvent): void {
    if (event.pageSize !== this.size()) {
      this.lists.setSize(event.pageSize);
    } else {
      this.lists.setPage(event.pageIndex + 1);
    }
  }

  sortByName(): void {
    this.lists.toggleSort('name');
  }

  openAdd(): void {
    const ref = this.dialog.open(UserDialogComponent, {
      data: { mode: 'add' },
      width: '760px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((result: UserDialogResult | undefined) => {
      if (!result?.saved) return;
      this.notify.success(this.i18n.t('message.success'));
      if (result.password) this.dialogs.showPassword(result.password, result.username);
      this.lists.reload();
    });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(UserDialogComponent, {
      data: { mode: 'edit', id: user.id },
      width: '760px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((result: UserDialogResult | undefined) => {
      if (!result?.saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  changeStatus(user: User, status: string): void {
    this.api.updateUserStatus(user.id, status as '0' | '1').subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.reload();
      },
      error: () => this.lists.reload(),
    });
  }

  async requestDelete(users: User[]): Promise<void> {
    const deletable = users.filter((user) => !this.isSelf(user));
    if (deletable.length !== users.length) {
      this.notify.warning(this.i18n.t('message.cannotDeleteSelf'));
    }
    if (deletable.length === 0) return;
    const confirmed =
      deletable.length === 1
        ? await this.dialogs.confirmDeleteSingle(deletable[0].username)
        : await this.dialogs.confirmDeleteMany(deletable.length);
    if (!confirmed) return;
    this.api.deleteUsers(deletable.map((user) => user.id)).subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.clampAfterDelete(deletable.length);
      },
    });
  }

  async deleteSelected(): Promise<void> {
    const ids = new Set(this.lists.selected());
    const users = this.lists.rows().filter((user) => ids.has(user.id));
    await this.requestDelete(users);
  }

  async resetPassword(user: User): Promise<void> {
    const confirmed = await this.dialogs.confirmAction(
      this.i18n.t('table.resetPasswordTitle'),
      this.i18n.t('table.resetPasswordConfirm', { name: user.username }),
      this.i18n.t('button.reset.password'),
    );
    if (!confirmed) return;
    this.api.resetUserPassword(user.id).subscribe((password) => {
      this.notify.success(this.i18n.t('message.success'));
      this.dialogs.showPassword(password, user.username);
    });
  }
}
