import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../../shared/page-header.component';

interface DemoRow {
  id: number;
  name: string;
  role: string;
  status: string;
  score: number;
}

const ROWS: DemoRow[] = [
  { id: 1, name: 'Olivia Martin', role: 'Admin', status: 'Active', score: 92 },
  { id: 2, name: 'Jackson Lee', role: 'Editor', status: 'Active', score: 81 },
  { id: 3, name: 'Isabella Nguyen', role: 'Viewer', status: 'Invited', score: 64 },
  { id: 4, name: 'William Kim', role: 'Editor', status: 'Active', score: 88 },
  { id: 5, name: 'Sofia Davis', role: 'Viewer', status: 'Suspended', score: 42 },
  { id: 6, name: 'Liam Chen', role: 'Admin', status: 'Active', score: 95 },
  { id: 7, name: 'Emma Wilson', role: 'Editor', status: 'Invited', score: 73 },
  { id: 8, name: 'Noah Brown', role: 'Viewer', status: 'Active', score: 69 },
  { id: 9, name: 'Ava Garcia', role: 'Editor', status: 'Active', score: 86 },
  { id: 10, name: 'Ethan Miller', role: 'Viewer', status: 'Suspended', score: 38 },
  { id: 11, name: 'Mia Rodriguez', role: 'Admin', status: 'Active', score: 91 },
  { id: 12, name: 'Lucas Anderson', role: 'Viewer', status: 'Invited', score: 57 },
];

@Component({
  selector: 'app-component-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.table.title" descKey="page.component.table.desc" />

      <div class="toolbar-row">
        <mat-form-field appearance="outline" class="filter" subscriptSizing="dynamic">
          <mat-label>Filter</mat-label>
          <input matInput [value]="keyword()" (input)="onFilter($event)" placeholder="Name, role or status" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <span class="grow"></span>
        <span class="muted">{{ selected().size }} selected</span>
        <button mat-stroked-button type="button" [disabled]="selected().size === 0" (click)="clearSelection()">
          Clear
        </button>
      </div>

      <div class="table-wrap">
        <table mat-table [dataSource]="paged()">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef class="select-cell">
              <mat-checkbox
                [checked]="allPageSelected()"
                [indeterminate]="selected().size > 0 && !allPageSelected()"
                (change)="toggleAll($event)"
                aria-label="Select all rows"
              />
            </th>
            <td mat-cell *matCellDef="let row" class="select-cell">
              <mat-checkbox [checked]="selected().has(row.id)" (change)="toggle(row.id)" />
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let row">{{ row.role }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="pill" [class.warn]="row.status === 'Invited'" [class.off]="row.status === 'Suspended'">
                {{ row.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="score">
            <th mat-header-cell *matHeaderCellDef>
              <button mat-button type="button" class="sort-button" (click)="toggleSort()">
                Score <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </button>
            </th>
            <td mat-cell *matCellDef="let row">{{ row.score }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>

        @if (paged().length === 0) {
          <div class="empty-state"><mat-icon>search_off</mat-icon><p>No matching rows</p></div>
        }

        <mat-paginator
          [length]="filtered().length"
          [pageIndex]="page() - 1"
          [pageSize]="size()"
          [pageSizeOptions]="[5, 10, 20]"
          (page)="onPage($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .filter {
        width: min(320px, 70vw);
      }
      .select-cell {
        width: 52px;
      }
      .sort-button mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
      .pill {
        padding: 2px 9px;
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.12);
        color: #15803d;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .pill.warn {
        background: rgba(217, 119, 6, 0.12);
        color: #b45309;
      }
      .pill.off {
        background: rgba(185, 28, 28, 0.1);
        color: #b91c1c;
      }
    `,
  ],
})
export class ComponentTableComponent {
  readonly columns = ['select', 'name', 'role', 'status', 'score'];
  readonly keyword = signal('');
  readonly sortAsc = signal(false);
  readonly page = signal(1);
  readonly size = signal(5);
  readonly selected = signal<ReadonlySet<number>>(new Set<number>());

  readonly filtered = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    const rows = ROWS.filter(
      (row) =>
        !keyword ||
        row.name.toLowerCase().includes(keyword) ||
        row.role.toLowerCase().includes(keyword) ||
        row.status.toLowerCase().includes(keyword),
    );
    return [...rows].sort((a, b) => (this.sortAsc() ? a.score - b.score : b.score - a.score));
  });

  readonly paged = computed(() => {
    const start = (this.page() - 1) * this.size();
    return this.filtered().slice(start, start + this.size());
  });

  readonly allPageSelected = computed(
    () => this.paged().length > 0 && this.paged().every((row) => this.selected().has(row.id)),
  );

  onFilter(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  toggleSort(): void {
    this.sortAsc.update((value) => !value);
  }

  onPage(event: PageEvent): void {
    if (event.pageSize !== this.size()) {
      this.size.set(event.pageSize);
      this.page.set(1);
    } else {
      this.page.set(event.pageIndex + 1);
    }
  }

  toggle(id: number): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selected.set(next);
  }

  toggleAll(event: MatCheckboxChange): void {
    const next = new Set(this.selected());
    for (const row of this.paged()) {
      if (event.checked) next.add(row.id);
      else next.delete(row.id);
    }
    this.selected.set(next);
  }

  clearSelection(): void {
    this.selected.set(new Set<number>());
  }
}
