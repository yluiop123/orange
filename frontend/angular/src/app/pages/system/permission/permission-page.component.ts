import { Component, computed, effect, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
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
import { SystemDialogService } from '../../../shared/system/system-dialog.service';
import { PermissionDialogComponent } from './permission-dialog.component';
import { allNodeIds, buildTree, flattenTree } from '../../../core/tree-rows';
import { clampPageAfterDelete } from '../../../core/page-clamp';
import type { PermissionRow } from '../../../core/models';

@Component({
  selector: 'app-permission-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeaderComponent,
    StatusFilterComponent,
    StatusToggleComponent,
  ],
  templateUrl: './permission-page.component.html',
  styleUrl: './permission-page.component.scss',
})
export class PermissionPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(SystemApi);
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialogs = inject(SystemDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatDateTime = formatDateTime;
  readonly columns = ['select', 'name', 'id', 'path', 'type', 'action', 'status', 'createTime', 'actions'];
  readonly path = '/system/permission';
  readonly types = ['all', 'directory', 'menu', 'action'];

  readonly lists = new ListController<PermissionRow>(
    (params) =>
      this.api
        .listPermissions({
          id: String(params['id'] ?? ''),
          name: String(params['name'] ?? ''),
          path: String(params['path'] ?? ''),
          status: String(params['status'] ?? 'all'),
          type: String(params['type'] ?? 'all'),
        })
        .pipe(map((rows) => ({ total: rows.length, list: rows }))),
    { page: 1, size: 10, id: '', name: '', path: '', status: 'all', type: 'all' },
    this.destroyRef,
  );

  readonly expanded = signal<ReadonlySet<string>>(new Set<string>());
  readonly page = signal(1);
  readonly size = signal(10);

  readonly fullTree = computed(() =>
    buildTree(
      this.lists.rows().map((permission) => ({ ...permission })),
      (permission) => permission.id,
      (permission) => permission.parentId,
    ),
  );
  readonly rootsTotal = computed(() => this.fullTree().length);
  readonly pagedRoots = computed(() => {
    const start = (this.page() - 1) * this.size();
    return this.fullTree().slice(start, start + this.size());
  });
  readonly flatRows = computed(() =>
    flattenTree(
      this.pagedRoots(),
      (permission) => permission.children ?? [],
      this.expanded(),
      (permission) => permission.id,
    ),
  );
  readonly visibleIds = computed(() => this.flatRows().map((row) => row.node.id));
  readonly allSelected = computed(() => {
    const ids = this.visibleIds();
    return ids.length > 0 && ids.every((id) => this.lists.selected().has(id));
  });
  readonly someSelected = computed(() => this.lists.selected().size > 0 && !this.allSelected());
  readonly nameValue = computed(() => String(this.lists.params()['name'] ?? ''));
  readonly idValue = computed(() => String(this.lists.params()['id'] ?? ''));
  readonly pathValue = computed(() => String(this.lists.params()['path'] ?? ''));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? 'all'));
  readonly typeValue = computed(() => String(this.lists.params()['type'] ?? 'all'));

  readonly nodeMap = computed(() => {
    const map = new Map<string, PermissionRow>();
    const walk = (nodes: PermissionRow[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        walk(node.children ?? []);
      }
    };
    walk(this.fullTree());
    return map;
  });

  private initialized = false;

  constructor() {
    effect(() => {
      const roots = this.fullTree();
      if (!this.initialized && roots.length > 0) {
        this.initialized = true;
        this.expanded.set(
          new Set(allNodeIds(roots, (node) => node.children ?? [], (node) => node.id)),
        );
      }
    });
  }

  onName(event: Event): void {
    this.page.set(1);
    this.lists.updateParams({ name: (event.target as HTMLInputElement).value });
  }

  onId(event: Event): void {
    this.page.set(1);
    this.lists.updateParams({ id: (event.target as HTMLInputElement).value });
  }

  onPath(event: Event): void {
    this.page.set(1);
    this.lists.updateParams({ path: (event.target as HTMLInputElement).value });
  }

  onStatus(status: string): void {
    this.page.set(1);
    this.lists.updateParams({ status });
  }

  onType(type: string): void {
    this.page.set(1);
    this.lists.updateParams({ type });
  }

  onPage(event: PageEvent): void {
    if (event.pageSize !== this.size()) {
      this.size.set(event.pageSize);
      this.page.set(1);
    } else {
      this.page.set(event.pageIndex + 1);
    }
  }

  toggle(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  expandAll(): void {
    this.expanded.set(
      new Set(allNodeIds(this.fullTree(), (node) => node.children ?? [], (node) => node.id)),
    );
  }

  collapseAll(): void {
    this.expanded.set(new Set());
  }

  toggleAll(event: MatCheckboxChange): void {
    this.lists.toggleAll(this.visibleIds(), event.checked);
  }

  openAdd(parent: PermissionRow | null): void {
    const ref = this.dialog.open(PermissionDialogComponent, {
      data: { mode: 'add', parentId: parent?.id ?? null },
      width: '700px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  openEdit(permission: PermissionRow): void {
    const ref = this.dialog.open(PermissionDialogComponent, {
      data: { mode: 'edit', id: permission.id },
      width: '700px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  changeStatus(permission: PermissionRow, status: string): void {
    this.api.updatePermission(permission.id, { status: status as '0' | '1' }).subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.reload();
      },
      error: () => this.lists.reload(),
    });
  }

  async requestDelete(permissions: PermissionRow[]): Promise<void> {
    if (permissions.length === 0) return;
    const map = this.nodeMap();
    const selectedIds = new Set(permissions.map((permission) => permission.id));
    const topLevel = permissions.filter((permission) => {
      let parentId = permission.parentId ?? null;
      while (parentId) {
        if (selectedIds.has(parentId)) return false;
        parentId = map.get(parentId)?.parentId ?? null;
      }
      return true;
    });

    const allIds = new Set<string>();
    const collect = (permission: PermissionRow) => {
      allIds.add(permission.id);
      for (const child of permission.children ?? []) collect(child);
    };
    for (const permission of topLevel) collect(permission);

    const confirmed =
      topLevel.length === 1
        ? await this.dialogs.confirmDeleteSingle(topLevel[0].name)
        : await this.dialogs.confirmDeleteMany(topLevel.length);
    if (!confirmed) return;

    const ids = [...allIds].sort((a, b) => b.length - a.length);
    this.api.deletePermissions(ids).subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.page.set(
          clampPageAfterDelete(this.rootsTotal(), topLevel.length, this.size(), this.page()),
        );
        this.lists.clearSelection();
        this.lists.reload();
      },
    });
  }

  async deleteSelected(): Promise<void> {
    const map = this.nodeMap();
    const permissions = [...this.lists.selected()]
      .map((id) => map.get(id))
      .filter((permission): permission is PermissionRow => !!permission);
    await this.requestDelete(permissions);
  }
}
