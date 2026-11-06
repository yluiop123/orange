import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

type PersonStatus = 'relationship' | 'single' | 'complicated';

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: PersonStatus;
  progress: number;
}

const PEOPLE: Person[] = [
  { id: 1, firstName: 'Tanner', lastName: 'Linsley', age: 24, visits: 100, status: 'relationship', progress: 50 },
  { id: 2, firstName: 'Jason', lastName: 'Maurer', age: 32, visits: 40, status: 'single', progress: 80 },
  { id: 3, firstName: 'Jesse', lastName: 'Chambers', age: 45, visits: 80, status: 'complicated', progress: 20 },
  { id: 4, firstName: 'Tandy', lastName: 'Miller', age: 40, visits: 40, status: 'single', progress: 80 },
  { id: 5, firstName: 'Joe', lastName: 'Dirte', age: 45, visits: 20, status: 'complicated', progress: 10 },
  { id: 6, firstName: 'Alice', lastName: 'Smith', age: 24, visits: 65, status: 'single', progress: 62 },
  { id: 7, firstName: 'Bob', lastName: 'Johnson', age: 32, visits: 210, status: 'relationship', progress: 74 },
  { id: 8, firstName: 'Carol', lastName: 'White', age: 28, visits: 55, status: 'complicated', progress: 33 },
  { id: 9, firstName: 'David', lastName: 'Brown', age: 36, visits: 123, status: 'relationship', progress: 55 },
  { id: 10, firstName: 'Eva', lastName: 'Martin', age: 27, visits: 200, status: 'single', progress: 88 },
  { id: 11, firstName: 'Frank', lastName: 'Wilson', age: 51, visits: 18, status: 'complicated', progress: 12 },
  { id: 12, firstName: 'Grace', lastName: 'Lee', age: 29, visits: 97, status: 'relationship', progress: 67 },
  { id: 13, firstName: 'Henry', lastName: 'Taylor', age: 34, visits: 142, status: 'single', progress: 91 },
  { id: 14, firstName: 'Ivy', lastName: 'Clark', age: 22, visits: 31, status: 'complicated', progress: 26 },
  { id: 15, firstName: 'Jack', lastName: 'Lewis', age: 48, visits: 88, status: 'relationship', progress: 45 },
  { id: 16, firstName: 'Kara', lastName: 'Walker', age: 31, visits: 176, status: 'single', progress: 79 },
  { id: 17, firstName: 'Liam', lastName: 'Hall', age: 39, visits: 64, status: 'relationship', progress: 58 },
  { id: 18, firstName: 'Mia', lastName: 'Young', age: 26, visits: 119, status: 'complicated', progress: 37 },
];

const STATUS_OPTIONS: PersonStatus[] = ['relationship', 'single', 'complicated'];

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
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTabsModule,
  ],
  template: `
    <div class="page">

      <mat-tab-group class="orange-tabs" animationDuration="0ms">
        <mat-tab label="Basic">
          <div class="tab-body">
            <section class="panel table-panel">
              <div class="table-toolbar">
                <div>
                  <h2>People</h2>
                  <p class="muted">A plain table with badges and progress indicators.</p>
                </div>
                <span class="muted">{{ basicRows.length }} rows</span>
              </div>
              <div class="table-scroll">
                <table mat-table [dataSource]="basicRows">
                  <ng-container matColumnDef="firstName">
                    <th mat-header-cell *matHeaderCellDef>First Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th mat-header-cell *matHeaderCellDef>Last Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef>Age</th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="visits">
                    <th mat-header-cell *matHeaderCellDef>Visits</th>
                    <td mat-cell *matCellDef="let row">{{ row.visits }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="progress">
                    <th mat-header-cell *matHeaderCellDef>Progress</th>
                    <td mat-cell *matCellDef="let row">
                      <div class="progress-cell">
                        <mat-progress-bar mode="determinate" [value]="row.progress" />
                        <span>{{ row.progress }}%</span>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="basicColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: basicColumns"></tr>
                </table>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Dataset Summary</h2>
                  <p class="muted">Aggregates computed from the same row source.</p>
                </div>
              </div>
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="label">Rows</span>
                  <div class="value">{{ people.length }}</div>
                  <div class="muted">Total records</div>
                </div>
                <div class="stat-card">
                  <span class="label">Average age</span>
                  <div class="value">{{ averageAge }}</div>
                  <div class="muted">Years</div>
                </div>
                <div class="stat-card">
                  <span class="label">Total visits</span>
                  <div class="value">{{ totalVisits }}</div>
                  <div class="muted">All people</div>
                </div>
                <div class="stat-card">
                  <span class="label">Active</span>
                  <div class="value">{{ activeCount }}</div>
                  <div class="muted">Not complicated</div>
                </div>
              </div>
              <div class="legend-row">
                <span class="status">relationship</span>
                <span class="status single">single</span>
                <span class="status complicated">complicated</span>
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Header Groups">
          <div class="tab-body">
            <section class="panel table-panel">
              <div class="table-toolbar">
                <div>
                  <h2>Grouped Headers</h2>
                  <p class="muted">Two header rows: Name spans two columns, Info spans four.</p>
                </div>
              </div>
              <div class="table-scroll">
                <table mat-table [dataSource]="groupRows">
                  <ng-container matColumnDef="nameGroup">
                    <th mat-header-cell *matHeaderCellDef [attr.colspan]="2" class="group-head">
                      Name
                    </th>
                  </ng-container>

                  <ng-container matColumnDef="infoGroup">
                    <th mat-header-cell *matHeaderCellDef [attr.colspan]="4" class="group-head">
                      Info
                    </th>
                  </ng-container>

                  <ng-container matColumnDef="firstName">
                    <th mat-header-cell *matHeaderCellDef>First Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th mat-header-cell *matHeaderCellDef>Last Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef>Age</th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="visits">
                    <th mat-header-cell *matHeaderCellDef>Visits</th>
                    <td mat-cell *matCellDef="let row">{{ row.visits }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="progress">
                    <th mat-header-cell *matHeaderCellDef>Progress</th>
                    <td mat-cell *matCellDef="let row">{{ row.progress }}%</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="groupTopHeader"></tr>
                  <tr mat-header-row *matHeaderRowDef="groupLeafHeader"></tr>
                  <tr mat-row *matRowDef="let row; columns: groupLeafHeader"></tr>
                </table>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Column Groups</h2>
                  <p class="muted">The header structure mirrors the React grouping.</p>
                </div>
              </div>
              <div class="group-grid">
                <div class="group-box">
                  <div class="group-box-title"><mat-icon>view_column</mat-icon> Name</div>
                  <div class="group-tags">
                    <span class="group-tag">First Name</span>
                    <span class="group-tag">Last Name</span>
                  </div>
                </div>
                <div class="group-box">
                  <div class="group-box-title"><mat-icon>info</mat-icon> Info</div>
                  <div class="group-tags">
                    <span class="group-tag">Age</span>
                    <span class="group-tag">Visits</span>
                    <span class="group-tag">Status</span>
                    <span class="group-tag">Progress</span>
                  </div>
                </div>
              </div>
              <p class="inline-note">
                Header cells use <code>colspan</code>; the body always renders the six leaf columns.
              </p>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Filters">
          <div class="tab-body">
            <section class="panel table-panel">
              <div class="table-toolbar filter-toolbar">
                <div>
                  <h2>Column Filters</h2>
                  <p class="muted">Filter by name, age or status.</p>
                </div>
                <button mat-stroked-button type="button" (click)="clearFilters()">Clear</button>
              </div>
              <div class="filter-grid">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>First name</mat-label>
                  <input
                    matInput
                    [value]="firstNameFilter()"
                    (input)="firstNameFilter.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Last name</mat-label>
                  <input
                    matInput
                    [value]="lastNameFilter()"
                    (input)="lastNameFilter.set($any($event.target).value)"
                  />
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Minimum age</mat-label>
                  <input
                    matInput
                    type="number"
                    [value]="ageFilter()"
                    (input)="setAgeFilter($event)"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Status</mat-label>
                  <mat-select
                    [value]="statusFilter()"
                    (selectionChange)="statusFilter.set($event.value)"
                  >
                    <mat-option value="">All statuses</mat-option>
                    @for (status of statusOptions; track status) {
                      <mat-option [value]="status">{{ status }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="table-scroll">
                <table mat-table [dataSource]="filteredPeople()">
                  <ng-container matColumnDef="firstName">
                    <th mat-header-cell *matHeaderCellDef>First Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th mat-header-cell *matHeaderCellDef>Last Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef>Age</th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="filterColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: filterColumns"></tr>
                </table>
                @if (filteredPeople().length === 0) {
                  <div class="empty-state">
                    <mat-icon>search_off</mat-icon>
                    <p>No matching rows</p>
                  </div>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Active Filters</h2>
                  <p class="muted">A summary of the current column filters.</p>
                </div>
                <span class="muted">{{ filteredPeople().length }} result(s)</span>
              </div>
              @if (filterChips().length > 0) {
                <mat-chip-set aria-label="Active filters">
                  @for (chip of filterChips(); track chip) {
                    <mat-chip>{{ chip }}</mat-chip>
                  }
                </mat-chip-set>
              } @else {
                <p class="muted">No filters applied.</p>
              }
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Faceted Filters">
          <div class="tab-body">
            <section class="panel table-panel">
              <div class="table-toolbar">
                <div>
                  <h2>Status Facets</h2>
                  <p class="muted">Toggle facet values with live counts.</p>
                </div>
                <button mat-stroked-button type="button" (click)="clearFacets()">Clear facets</button>
              </div>
              <div class="facet-row">
                @for (status of statusOptions; track status) {
                  <button
                    type="button"
                    class="facet-button"
                    [class.active]="statusFacets().has(status)"
                    (click)="toggleFacet(status)"
                  >
                    {{ status }}
                    <span class="facet-count">{{ statusCount(status) }}</span>
                  </button>
                }
              </div>
              <div class="table-scroll">
                <table mat-table [dataSource]="facetedPeople()">
                  <ng-container matColumnDef="firstName">
                    <th mat-header-cell *matHeaderCellDef>First Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th mat-header-cell *matHeaderCellDef>Last Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef>Age</th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="visits">
                    <th mat-header-cell *matHeaderCellDef>Visits</th>
                    <td mat-cell *matCellDef="let row">{{ row.visits }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="facetedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: facetedColumns"></tr>
                </table>
                @if (facetedPeople().length === 0) {
                  <div class="empty-state">
                    <mat-icon>filter_alt_off</mat-icon>
                    <p>No results for the selected facets</p>
                  </div>
                }
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Facet Counts</h2>
                  <p class="muted">Counts use the unfiltered dataset.</p>
                </div>
                <span class="muted">{{ facetedPeople().length }} of {{ people.length }} rows</span>
              </div>
              <div class="facet-summary">
                @for (status of statusOptions; track status) {
                  <div class="facet-summary-row">
                    <span
                      class="status"
                      [class.single]="status === 'single'"
                      [class.complicated]="status === 'complicated'"
                    >
                      {{ status }}
                    </span>
                    <span class="muted">{{ statusCount(status) }} rows</span>
                  </div>
                }
              </div>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Fuzzy Filters">
          <div class="tab-body">
            <section class="panel table-panel">
              <div class="table-toolbar filter-toolbar">
                <div>
                  <h2>Fuzzy Search</h2>
                  <p class="muted">Global and per-column fuzzy matching with sortable headers.</p>
                </div>
                <button mat-stroked-button type="button" (click)="resetFuzzy()">Reset</button>
              </div>

              <div class="filter-grid fuzzy-grid">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Search all columns</mat-label>
                  <input
                    matInput
                    [value]="globalQuery()"
                    (input)="setGlobalQuery($event)"
                    placeholder="Search all columns…"
                  />
                  <mat-icon matSuffix>travel_explore</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>First name</mat-label>
                  <input
                    matInput
                    [value]="firstNameQuery()"
                    (input)="setColumnQuery('firstName', $event)"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Last name</mat-label>
                  <input
                    matInput
                    [value]="lastNameQuery()"
                    (input)="setColumnQuery('lastName', $event)"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Full name</mat-label>
                  <input
                    matInput
                    [value]="fullNameQuery()"
                    (input)="setColumnQuery('fullName', $event)"
                  />
                </mat-form-field>
              </div>

              <div class="table-scroll">
                <table mat-table [dataSource]="pagedFuzzy()">
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef class="sortable" (click)="toggleSort('id')">
                      ID
                      @if (sortColumn() === 'id') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">{{ row.id }}</td>
                  </ng-container>

                  <ng-container matColumnDef="firstName">
                    <th
                      mat-header-cell
                      *matHeaderCellDef
                      class="sortable"
                      (click)="toggleSort('firstName')"
                    >
                      First Name
                      @if (sortColumn() === 'firstName') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th
                      mat-header-cell
                      *matHeaderCellDef
                      class="sortable"
                      (click)="toggleSort('lastName')"
                    >
                      Last Name
                      @if (sortColumn() === 'lastName') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="fullName">
                    <th
                      mat-header-cell
                      *matHeaderCellDef
                      class="sortable"
                      (click)="toggleSort('fullName')"
                    >
                      Full Name
                      @if (sortColumn() === 'fullName') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }} {{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef class="sortable" (click)="toggleSort('age')">
                      Age
                      @if (sortColumn() === 'age') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th
                      mat-header-cell
                      *matHeaderCellDef
                      class="sortable"
                      (click)="toggleSort('status')"
                    >
                      Status
                      @if (sortColumn() === 'status') {
                        <mat-icon>{{ sortAsc() ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                      }
                    </th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="fuzzyColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: fuzzyColumns"></tr>
                </table>
                @if (pagedFuzzy().length === 0) {
                  <div class="empty-state">
                    <mat-icon>manage_search</mat-icon>
                    <p>No rows match the fuzzy query</p>
                  </div>
                }
              </div>

              <mat-paginator
                [length]="sortedFuzzy().length"
                [pageIndex]="pageIndex()"
                [pageSize]="pageSize()"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onFuzzyPage($event)"
              />
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Query State</h2>
                  <p class="muted">The current filters, sort and pagination.</p>
                </div>
                <span class="muted">{{ sortedFuzzy().length }} matching rows</span>
              </div>
              <pre class="json">{{ fuzzyDebug() }}</pre>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Column Ordering">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Visibility &amp; Order</h2>
                  <p class="muted">Toggle columns and move them left or right.</p>
                </div>
                <div class="actions-inline">
                  <button mat-stroked-button type="button" (click)="shuffleColumns()">Shuffle</button>
                  <button mat-button type="button" (click)="resetColumns()">Reset</button>
                </div>
              </div>

              <mat-checkbox
                class="select-all"
                [checked]="hiddenColumns().size === 0"
                [indeterminate]="hiddenColumns().size > 0 && visibleColumns().length > 0"
                (change)="setAllColumns($event.checked)"
              >
                Toggle all
              </mat-checkbox>

              <div class="column-controls">
                @for (column of columnOrder(); track column; let i = $index) {
                  <div class="column-row">
                    <mat-checkbox
                      [checked]="!hiddenColumns().has(column)"
                      (change)="toggleColumn(column)"
                    >
                      {{ columnLabels[column] }}
                    </mat-checkbox>
                    <div class="column-actions">
                      <button
                        mat-icon-button
                        type="button"
                        [disabled]="i === 0"
                        [attr.aria-label]="'Move ' + columnLabels[column] + ' left'"
                        (click)="moveColumn(i, -1)"
                      >
                        <mat-icon>arrow_back</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        type="button"
                        [disabled]="i === columnOrder().length - 1"
                        [attr.aria-label]="'Move ' + columnLabels[column] + ' right'"
                        (click)="moveColumn(i, 1)"
                      >
                        <mat-icon>arrow_forward</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </section>

            <section class="panel table-panel">
              <div class="table-toolbar">
                <div>
                  <h2>Live Table</h2>
                  <p class="muted">Only visible columns render, in the chosen order.</p>
                </div>
                <span class="muted">{{ visibleColumns().length }} visible</span>
              </div>

              @if (visibleColumns().length > 0) {
                <div class="table-scroll">
                  <table mat-table [dataSource]="orderRows">
                    <ng-container matColumnDef="firstName">
                      <th mat-header-cell *matHeaderCellDef>First Name</th>
                      <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                    </ng-container>

                    <ng-container matColumnDef="lastName">
                      <th mat-header-cell *matHeaderCellDef>Last Name</th>
                      <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                    </ng-container>

                    <ng-container matColumnDef="age">
                      <th mat-header-cell *matHeaderCellDef>Age</th>
                      <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                    </ng-container>

                    <ng-container matColumnDef="visits">
                      <th mat-header-cell *matHeaderCellDef>Visits</th>
                      <td mat-cell *matCellDef="let row">{{ row.visits }}</td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let row">
                        <span
                          class="status"
                          [class.single]="row.status === 'single'"
                          [class.complicated]="row.status === 'complicated'"
                        >
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="progress">
                      <th mat-header-cell *matHeaderCellDef>Progress</th>
                      <td mat-cell *matCellDef="let row">{{ row.progress }}%</td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="visibleColumns()"></tr>
                    <tr mat-row *matRowDef="let row; columns: visibleColumns()"></tr>
                  </table>
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>visibility_off</mat-icon>
                  <p>All columns are hidden</p>
                </div>
              }

              <pre class="json">{{ columnOrderJson() }}</pre>
            </section>
          </div>
        </mat-tab>

        <mat-tab label="Column DnD">
          <div class="tab-body">
            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>Reorder Columns</h2>
                  <p class="muted">Drag handles are represented by move up and down controls.</p>
                </div>
                <div class="actions-inline">
                  <button mat-stroked-button type="button" (click)="resetDndOrder()">Reset</button>
                </div>
              </div>
              <p class="inline-note">
                <mat-icon>drag_indicator</mat-icon>
                Use the arrows to change the column order; the table updates immediately.
              </p>
              <div class="column-controls dnd">
                @for (column of dndOrder(); track column; let i = $index) {
                  <div class="column-row dnd-row">
                    <mat-icon class="drag-handle">drag_indicator</mat-icon>
                    <span class="dnd-label">{{ columnLabels[column] }}</span>
                    <div class="column-actions">
                      <button
                        mat-icon-button
                        type="button"
                        [disabled]="i === 0"
                        [attr.aria-label]="'Move ' + columnLabels[column] + ' up'"
                        (click)="moveDndColumn(i, -1)"
                      >
                        <mat-icon>arrow_upward</mat-icon>
                      </button>
                      <button
                        mat-icon-button
                        type="button"
                        [disabled]="i === dndOrder().length - 1"
                        [attr.aria-label]="'Move ' + columnLabels[column] + ' down'"
                        (click)="moveDndColumn(i, 1)"
                      >
                        <mat-icon>arrow_downward</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </section>

            <section class="panel table-panel">
              <div class="table-toolbar">
                <div>
                  <h2>Reorderable Table</h2>
                  <p class="muted">The body follows the same order as the header.</p>
                </div>
                <span class="muted">{{ dndOrder().length }} columns</span>
              </div>
              <div class="table-scroll">
                <table mat-table [dataSource]="orderRows">
                  <ng-container matColumnDef="firstName">
                    <th mat-header-cell *matHeaderCellDef>First Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastName">
                    <th mat-header-cell *matHeaderCellDef>Last Name</th>
                    <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="age">
                    <th mat-header-cell *matHeaderCellDef>Age</th>
                    <td mat-cell *matCellDef="let row">{{ row.age }}</td>
                  </ng-container>

                  <ng-container matColumnDef="visits">
                    <th mat-header-cell *matHeaderCellDef>Visits</th>
                    <td mat-cell *matCellDef="let row">{{ row.visits }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <span
                        class="status"
                        [class.single]="row.status === 'single'"
                        [class.complicated]="row.status === 'complicated'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="progress">
                    <th mat-header-cell *matHeaderCellDef>Progress</th>
                    <td mat-cell *matCellDef="let row">{{ row.progress }}%</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="dndOrder()"></tr>
                  <tr mat-row *matRowDef="let row; columns: dndOrder()"></tr>
                </table>
              </div>
              <pre class="json">{{ dndJson() }}</pre>
            </section>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      /* Keep the horizontally arranged tab header scrollable. */
      :host ::ng-deep .mat-mdc-tab-header {
        width: 100%;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
      }
      :host ::ng-deep .mat-mdc-tab-header::-webkit-scrollbar {
        display: none;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container,
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-list {
        overflow: visible;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-labels {
        flex-wrap: nowrap;
        width: max-content;
      }

      .tab-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 4px 0 8px;
      }
      .table-panel {
        padding: 0;
        overflow: hidden;
      }
      .table-toolbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding: 12px 14px;
      }
      .table-toolbar h2,
      .panel h2 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }
      .table-toolbar p,
      .section-head p {
        margin: 3px 0 0;
        font-size: 0.78rem;
      }
      .section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .actions-inline {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .table-scroll {
        overflow: auto;
      }
      .table-scroll table.mat-mdc-table {
        width: 100%;
      }
      .progress-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
      }
      .progress-cell mat-progress-bar {
        flex: 1;
      }
      .progress-cell span {
        width: 34px;
        font-size: 0.7rem;
        color: var(--app-muted-foreground);
        text-align: right;
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--app-muted);
        color: var(--app-foreground);
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: capitalize;
        white-space: nowrap;
      }
      .status::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #16a34a;
      }
      .status.single::before {
        background: #2563eb;
      }
      .status.complicated::before {
        background: #dc2626;
      }
      .legend-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0 14px;
        padding: 0 14px 12px;
      }
      .fuzzy-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .facet-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 14px 12px;
      }
      .facet-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 10px;
        border: 1px solid var(--app-border);
        border-radius: 999px;
        background: var(--app-muted);
        color: var(--app-muted-foreground);
        font: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .facet-button:hover {
        border-color: var(--app-muted-foreground);
      }
      .facet-button.active {
        background: var(--app-primary);
        border-color: var(--app-primary);
        color: var(--app-primary-foreground);
      }
      .facet-count {
        padding: 0 6px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-foreground) 12%, transparent);
        font-size: 0.68rem;
      }
      .facet-summary {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .facet-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        border-bottom: 1px solid var(--app-border);
      }
      .facet-summary-row:last-child {
        border-bottom: 0;
      }
      .group-head {
        background: var(--app-muted);
        font-size: 0.75rem;
        font-weight: 700;
        text-align: center;
      }
      .group-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .group-box {
        padding: 12px;
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        background: var(--mat-sys-surface-container-low, #fafafa);
      }
      .group-box-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .group-box-title mat-icon {
        font-size: 17px;
        width: 17px;
        height: 17px;
        color: var(--app-muted-foreground);
      }
      .group-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      .group-tag {
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--app-muted);
        font-size: 0.7rem;
      }
      .inline-note {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 12px 0 0;
        font-size: 0.76rem;
        color: var(--app-muted-foreground);
      }
      .inline-note mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .inline-note code {
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--app-muted);
        font-size: 0.72rem;
      }
      .column-controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 18px;
        margin-top: 6px;
      }
      .column-controls.dnd {
        grid-template-columns: 1fr;
      }
      .column-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 8px;
        border: 1px solid var(--app-border);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-low, #fafafa);
      }
      .column-actions {
        display: flex;
        align-items: center;
      }
      .column-row mat-icon-button {
        --mat-icon-button-state-layer-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0;
      }
      .column-row mat-icon-button mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .select-all {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
      }
      .drag-handle {
        color: var(--app-muted-foreground);
        cursor: grab;
      }
      .dnd-label {
        flex: 1;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .dnd-row {
        justify-content: flex-start;
      }
      .sortable {
        cursor: pointer;
        user-select: none;
      }
      .sortable:hover {
        color: var(--app-foreground);
      }
      .sortable mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        vertical-align: middle;
      }
      .json {
        margin: 0;
        padding: 12px 14px;
        border-top: 1px solid var(--app-border);
        background: var(--mat-sys-surface-container-low, #fafafa);
        font-size: 0.72rem;
        white-space: pre-wrap;
        word-break: break-all;
      }
      @media (max-width: 900px) {
        .filter-grid,
        .fuzzy-grid,
        .group-grid,
        .column-controls {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ComponentTableComponent {
  readonly people: Person[] = PEOPLE;
  readonly statusOptions = STATUS_OPTIONS;

  readonly basicColumns = ['firstName', 'lastName', 'age', 'visits', 'status', 'progress'];
  readonly basicRows = PEOPLE.slice(0, 8);

  readonly groupTopHeader = ['nameGroup', 'infoGroup'];
  readonly groupLeafHeader = ['firstName', 'lastName', 'age', 'visits', 'status', 'progress'];
  readonly groupRows = PEOPLE.slice(0, 4);

  readonly filterColumns = ['firstName', 'lastName', 'age', 'status'];
  readonly facetedColumns = ['firstName', 'lastName', 'age', 'visits', 'status'];
  readonly fuzzyColumns = ['id', 'firstName', 'lastName', 'fullName', 'age', 'status'];

  readonly orderRows = PEOPLE.slice(0, 10);

  readonly averageAge = Math.round(PEOPLE.reduce((sum, row) => sum + row.age, 0) / PEOPLE.length);
  readonly totalVisits = PEOPLE.reduce((sum, row) => sum + row.visits, 0);
  readonly activeCount = PEOPLE.filter((row) => row.status !== 'complicated').length;

  readonly columnLabels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    age: 'Age',
    visits: 'Visits',
    status: 'Status',
    progress: 'Progress',
  };

  /* --------------------------- Filters --------------------------- */
  readonly firstNameFilter = signal('');
  readonly lastNameFilter = signal('');
  readonly ageFilter = signal<number | null>(null);
  readonly statusFilter = signal('');

  readonly filteredPeople = computed(() => {
    const firstName = this.firstNameFilter().trim().toLowerCase();
    const lastName = this.lastNameFilter().trim().toLowerCase();
    const minimumAge = this.ageFilter();
    const status = this.statusFilter();

    return PEOPLE.filter(
      (row) =>
        (!firstName || row.firstName.toLowerCase().includes(firstName)) &&
        (!lastName || row.lastName.toLowerCase().includes(lastName)) &&
        (minimumAge === null || row.age >= minimumAge) &&
        (!status || row.status === status),
    );
  });

  readonly filterChips = computed(() => {
    const chips: string[] = [];
    if (this.firstNameFilter().trim()) chips.push(`First name: ${this.firstNameFilter().trim()}`);
    if (this.lastNameFilter().trim()) chips.push(`Last name: ${this.lastNameFilter().trim()}`);
    if (this.ageFilter() !== null) chips.push(`Age ≥ ${this.ageFilter()}`);
    if (this.statusFilter()) chips.push(`Status: ${this.statusFilter()}`);
    return chips;
  });

  /* --------------------------- Facets ---------------------------- */
  readonly statusFacets = signal<ReadonlySet<string>>(new Set<string>());

  readonly facetedPeople = computed(() => {
    const facets = this.statusFacets();
    if (facets.size === 0) return PEOPLE;
    return PEOPLE.filter((row) => facets.has(row.status));
  });

  /* ---------------------------- Fuzzy ---------------------------- */
  readonly globalQuery = signal('');
  readonly firstNameQuery = signal('');
  readonly lastNameQuery = signal('');
  readonly fullNameQuery = signal('');
  readonly sortColumn = signal<'id' | 'firstName' | 'lastName' | 'fullName' | 'age' | 'status'>(
    'firstName',
  );
  readonly sortAsc = signal(true);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);

  readonly sortedFuzzy = computed(() => {
    const rows = PEOPLE.filter((row) => {
      const fullName = `${row.firstName} ${row.lastName}`;
      return (
        this.fuzzyMatch(`${row.id} ${fullName} ${row.status} ${row.age}`, this.globalQuery()) &&
        this.fuzzyMatch(row.firstName, this.firstNameQuery()) &&
        this.fuzzyMatch(row.lastName, this.lastNameQuery()) &&
        this.fuzzyMatch(fullName, this.fullNameQuery())
      );
    });

    const column = this.sortColumn();
    const direction = this.sortAsc() ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = this.sortValue(a, column);
      const right = this.sortValue(b, column);
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });
  });

  readonly pagedFuzzy = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedFuzzy().slice(start, start + this.pageSize());
  });

  /* ----------------------- Column ordering ----------------------- */
  readonly columnOrder = signal<string[]>([
    'firstName',
    'lastName',
    'age',
    'visits',
    'status',
    'progress',
  ]);
  readonly hiddenColumns = signal<ReadonlySet<string>>(new Set<string>());

  readonly visibleColumns = computed(() =>
    this.columnOrder().filter((column) => !this.hiddenColumns().has(column)),
  );

  /* --------------------------- DnD ------------------------------- */
  readonly dndOrder = signal<string[]>([
    'firstName',
    'lastName',
    'age',
    'visits',
    'status',
    'progress',
  ]);

  /* --------------------------- Filters --------------------------- */
  setAgeFilter(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = Number(raw);
    this.ageFilter.set(raw === '' || !Number.isFinite(value) ? null : value);
  }

  clearFilters(): void {
    this.firstNameFilter.set('');
    this.lastNameFilter.set('');
    this.ageFilter.set(null);
    this.statusFilter.set('');
  }

  /* --------------------------- Facets ---------------------------- */
  toggleFacet(status: string): void {
    const next = new Set(this.statusFacets());
    if (next.has(status)) next.delete(status);
    else next.add(status);
    this.statusFacets.set(next);
  }

  clearFacets(): void {
    this.statusFacets.set(new Set<string>());
  }

  statusCount(status: string): number {
    return PEOPLE.filter((row) => row.status === status).length;
  }

  /* ---------------------------- Fuzzy ---------------------------- */
  setGlobalQuery(event: Event): void {
    this.globalQuery.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  setColumnQuery(column: 'firstName' | 'lastName' | 'fullName', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (column === 'firstName') this.firstNameQuery.set(value);
    else if (column === 'lastName') this.lastNameQuery.set(value);
    else this.fullNameQuery.set(value);
    this.pageIndex.set(0);
  }

  toggleSort(column: 'id' | 'firstName' | 'lastName' | 'fullName' | 'age' | 'status'): void {
    if (this.sortColumn() === column) {
      this.sortAsc.update((value) => !value);
    } else {
      this.sortColumn.set(column);
      this.sortAsc.set(true);
    }
    this.pageIndex.set(0);
  }

  resetFuzzy(): void {
    this.globalQuery.set('');
    this.firstNameQuery.set('');
    this.lastNameQuery.set('');
    this.fullNameQuery.set('');
    this.sortColumn.set('firstName');
    this.sortAsc.set(true);
    this.pageIndex.set(0);
  }

  onFuzzyPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  fuzzyDebug(): string {
    return JSON.stringify(
      {
        globalFilter: this.globalQuery(),
        columnFilters: {
          firstName: this.firstNameQuery(),
          lastName: this.lastNameQuery(),
          fullName: this.fullNameQuery(),
        },
        sorting: { column: this.sortColumn(), ascending: this.sortAsc() },
        pagination: { page: this.pageIndex() + 1, pageSize: this.pageSize() },
        matchingRows: this.sortedFuzzy().length,
      },
      null,
      2,
    );
  }

  /* ----------------------- Column ordering ----------------------- */
  toggleColumn(column: string): void {
    const next = new Set(this.hiddenColumns());
    if (next.has(column)) next.delete(column);
    else next.add(column);
    this.hiddenColumns.set(next);
  }

  setAllColumns(visible: boolean): void {
    this.hiddenColumns.set(visible ? new Set<string>() : new Set(this.columnOrder()));
  }

  moveColumn(index: number, delta: number): void {
    this.columnOrder.update((order) => this.moveWithin(order, index, delta));
  }

  shuffleColumns(): void {
    const order = [...this.columnOrder()];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const current = order[i];
      const other = order[j];
      if (current === undefined || other === undefined) continue;
      order[i] = other;
      order[j] = current;
    }
    this.columnOrder.set(order);
  }

  resetColumns(): void {
    this.columnOrder.set(['firstName', 'lastName', 'age', 'visits', 'status', 'progress']);
    this.hiddenColumns.set(new Set<string>());
  }

  columnOrderJson(): string {
    return JSON.stringify(
      {
        order: this.columnOrder(),
        hidden: Array.from(this.hiddenColumns()),
      },
      null,
      2,
    );
  }

  /* --------------------------- DnD ------------------------------- */
  moveDndColumn(index: number, delta: number): void {
    this.dndOrder.update((order) => this.moveWithin(order, index, delta));
  }

  resetDndOrder(): void {
    this.dndOrder.set(['firstName', 'lastName', 'age', 'visits', 'status', 'progress']);
  }

  dndJson(): string {
    return JSON.stringify(this.dndOrder(), null, 2);
  }

  /* --------------------------- Helpers --------------------------- */
  private moveWithin(order: string[], index: number, delta: number): string[] {
    const next = [...order];
    const target = index + delta;
    const moved = next[index];
    if (moved === undefined || target < 0 || target >= next.length) return next;
    next.splice(index, 1);
    next.splice(target, 0, moved);
    return next;
  }

  private fuzzyMatch(value: string, query: string): boolean {
    const text = value.toLowerCase();
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    if (text.includes(needle)) return true;

    let cursor = 0;
    for (const character of needle) {
      cursor = text.indexOf(character, cursor);
      if (cursor === -1) return false;
      cursor += 1;
    }
    return true;
  }

  private sortValue(
    row: Person,
    column: 'id' | 'firstName' | 'lastName' | 'fullName' | 'age' | 'status',
  ): string | number {
    switch (column) {
      case 'fullName':
        return `${row.firstName} ${row.lastName}`;
      case 'id':
        return row.id;
      case 'firstName':
        return row.firstName;
      case 'lastName':
        return row.lastName;
      case 'age':
        return row.age;
      case 'status':
        return row.status;
      default:
        return row.id;
    }
  }
}
