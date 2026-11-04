import { Component, computed, effect, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { map } from 'rxjs';
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
import { GroupDialogComponent } from './group-dialog.component';
import { allNodeIds, buildTree, flattenTree } from '../../../core/tree-rows';
import { clampPageAfterDelete } from '../../../core/page-clamp';
import type { Group } from '../../../core/models';

@Component({
  selector: 'app-group-page',
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
  templateUrl: './group-page.component.html',
  styleUrl: './group-page.component.scss',
})
export class GroupPageComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(SystemApi);
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialogs = inject(SystemDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatDateTime = formatDateTime;
  readonly path = '/system/group';

  readonly columnDefs = [
    { key: 'name', labelKey: 'page.system.group.header.name', hideable: false },
    { key: 'id', labelKey: 'page.system.group.header.id', hideable: true },
    { key: 'status', labelKey: 'page.system.group.header.status', hideable: true },
    { key: 'createTime', labelKey: 'page.system.group.header.createTime', hideable: true },
  ];
  readonly hiddenColumns = signal<ReadonlySet<string>>(new Set<string>());
  readonly visibleColumns = computed(() => [
    'select',
    'expand',
    ...this.columnDefs.filter((column) => !this.hiddenColumns().has(column.key)).map((column) => column.key),
    'actions',
  ]);

  readonly lists = new ListController<Group>(
    (params) =>
      this.api
        .listGroups({
          id: String(params['id'] ?? ''),
          name: String(params['name'] ?? ''),
          status: String(params['status'] ?? 'all'),
        })
        .pipe(map((rows) => ({ total: rows.length, list: rows }))),
    { page: 1, size: 10, id: '', name: '', status: 'all' },
    this.destroyRef,
  );

  readonly expanded = signal<ReadonlySet<string>>(new Set<string>());
  readonly page = signal(1);
  readonly size = signal(10);

  readonly fullTree = computed(() =>
    buildTree(
      this.lists.rows().map((group) => ({ ...group })),
      (group) => group.id,
      (group) => group.parentId,
    ),
  );
  readonly rootsTotal = computed(() => this.fullTree().length);
  readonly allFlatRows = computed(() =>
    flattenTree(
      this.fullTree(),
      (group) => group.children ?? [],
      this.expanded(),
      (group) => group.id,
    ),
  );
  readonly flatRows = computed(() => {
    const start = (this.page() - 1) * this.size();
    return this.allFlatRows().slice(start, start + this.size());
  });
  readonly visibleRowCount = computed(() => this.allFlatRows().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.visibleRowCount() / this.size())),
  );
  readonly allExpanded = computed(() => {
    const expandableIds = this.expandableIds();
    return expandableIds.length > 0 && expandableIds.every((id) => this.expanded().has(id));
  });
  readonly visibleIds = computed(() => this.flatRows().map((row) => row.node.id));
  readonly allSelected = computed(() => {
    const ids = this.visibleIds();
    return ids.length > 0 && ids.every((id) => this.lists.selected().has(id));
  });
  readonly someSelected = computed(() => this.lists.selected().size > 0 && !this.allSelected());
  readonly selectedCount = computed(() => this.lists.selected().size);
  readonly nameValue = computed(() => String(this.lists.params()['name'] ?? ''));
  readonly idValue = computed(() => String(this.lists.params()['id'] ?? ''));
  readonly statusValue = computed(() => String(this.lists.params()['status'] ?? 'all'));

  private readonly expandableIds = computed(() =>
    allNodeIds(
      this.fullTree().filter((group) => (group.children ?? []).length > 0),
      (group) => group.children ?? [],
      (group) => group.id,
    ),
  );

  readonly nodeMap = computed(() => {
    const map = new Map<string, Group>();
    const walk = (nodes: Group[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        walk(node.children ?? []);
      }
    };
    walk(this.fullTree());
    return map;
  });

  constructor() {
    // Keep the page inside range when collapsing the tree shrinks the row count.
    effect(() => {
      const totalPages = Math.max(1, Math.ceil(this.allFlatRows().length / this.size()));
      if (this.page() > totalPages) this.page.set(totalPages);
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

  onStatus(status: string): void {
    this.page.set(1);
    this.lists.updateParams({ status });
  }

  toggle(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  toggleExpandAll(): void {
    this.expanded.set(
      this.allExpanded()
        ? new Set<string>()
        : new Set(this.expandableIds()),
    );
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
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }

  toggleAll(event: MatCheckboxChange): void {
    this.lists.toggleAll(this.visibleIds(), event.checked);
  }

  openAdd(parent: Group | null): void {
    const ref = this.dialog.open(GroupDialogComponent, {
      data: { mode: 'add', parentId: parent?.id ?? null },
      width: '520px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  openEdit(group: Group): void {
    const ref = this.dialog.open(GroupDialogComponent, {
      data: { mode: 'edit', id: group.id },
      width: '520px',
      maxWidth: '96vw',
    });
    ref.afterClosed().subscribe((saved: boolean | undefined) => {
      if (!saved) return;
      this.notify.success(this.i18n.t('message.success'));
      this.lists.reload();
    });
  }

  changeStatus(group: Group, status: string): void {
    this.api.updateGroupStatus(group.id, status as '0' | '1').subscribe({
      next: () => {
        this.notify.success(this.i18n.t('message.success'));
        this.lists.reload();
      },
      error: () => this.lists.reload(),
    });
  }

  async requestDelete(groups: Group[]): Promise<void> {
    if (groups.length === 0) return;
    const map = this.nodeMap();
    const selectedIds = new Set(groups.map((group) => group.id));
    const topLevel = groups.filter((group) => {
      let parentId = group.parentId ?? null;
      while (parentId) {
        if (selectedIds.has(parentId)) return false;
        parentId = map.get(parentId)?.parentId ?? null;
      }
      return true;
    });

    const allIds = new Set<string>();
    const collect = (group: Group) => {
      allIds.add(group.id);
      for (const child of group.children ?? []) collect(child);
    };
    for (const group of topLevel) collect(group);

    const confirmed =
      topLevel.length === 1
        ? await this.dialogs.confirmDeleteSingle(topLevel[0].name)
        : await this.dialogs.confirmDeleteMany(topLevel.length);
    if (!confirmed) return;

    const ids = [...allIds].sort((a, b) => b.length - a.length);
    this.api.deleteGroups(ids).subscribe({
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
    const groups = [...this.lists.selected()]
      .map((id) => map.get(id))
      .filter((group): group is Group => !!group);
    await this.requestDelete(groups);
  }
}
