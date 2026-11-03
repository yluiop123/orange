import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-navigation',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatStepperModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.navigation.title" descKey="page.component.navigation.desc" />
      <div class="nav-stack">
        <section class="panel">
          <h2>Tabs</h2>
          <mat-tab-group>
            <mat-tab label="Overview">
              <p class="muted tab-body">Tab content is lazy by default; this panel renders on first activation.</p>
            </mat-tab>
            <mat-tab label="Members">
              <p class="muted tab-body">Member management, invitations and roles.</p>
            </mat-tab>
            <mat-tab label="Billing">
              <p class="muted tab-body">Invoices, payment methods and usage.</p>
            </mat-tab>
            <mat-tab label="Disabled" disabled>
              <p>Disabled tab</p>
            </mat-tab>
          </mat-tab-group>
        </section>

        <section class="panel">
          <h2>Breadcrumb</h2>
          <nav class="crumbs" aria-label="Breadcrumb example">
            <a href="javascript:void(0)">Home</a>
            <mat-icon>chevron_right</mat-icon>
            <a href="javascript:void(0)">System</a>
            <mat-icon>chevron_right</mat-icon>
            <span aria-current="page">Users</span>
          </nav>
          <p class="muted">The application breadcrumb is generated from the backend menu chain.</p>
        </section>

        <section class="panel">
          <h2>Menus</h2>
          <div class="row">
            <button mat-stroked-button type="button" [matMenuTriggerFor]="actionsMenu">
              Actions <mat-icon>expand_more</mat-icon>
            </button>
            <mat-menu #actionsMenu="matMenu">
              <button mat-menu-item type="button"><mat-icon>edit</mat-icon><span>Edit</span></button>
              <button mat-menu-item type="button"><mat-icon>content_copy</mat-icon><span>Duplicate</span></button>
              <button mat-menu-item type="button" disabled><mat-icon>archive</mat-icon><span>Archive</span></button>
              <button mat-menu-item type="button"><mat-icon>delete</mat-icon><span>Delete</span></button>
            </mat-menu>

            <button mat-icon-button type="button" [matMenuTriggerFor]="iconMenu" aria-label="More actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #iconMenu="matMenu" xPosition="before">
              <button mat-menu-item type="button">Rename</button>
              <button mat-menu-item type="button">Share</button>
            </mat-menu>
          </div>
        </section>

        <section class="panel">
          <h2>Pagination</h2>
          <p class="muted">Server pagination uses the same Material paginator as the system pages.</p>
          <mat-paginator [length]="120" [pageSize]="10" [pageSizeOptions]="[10, 20, 50]" showFirstLastButtons />
        </section>

        <section class="panel">
          <h2>Stepper</h2>
          <mat-stepper orientation="horizontal" #stepper>
            <mat-step label="Account">
              <p class="muted">Provide the account identity and organization.</p>
              <button mat-flat-button type="button" matStepperNext>Next</button>
            </mat-step>
            <mat-step label="Roles">
              <p class="muted">Select roles; direct permissions are granted separately.</p>
              <button mat-button type="button" matStepperPrevious>Back</button>
              <button mat-flat-button type="button" matStepperNext>Next</button>
            </mat-step>
            <mat-step label="Review">
              <p class="muted">Review and submit. A 12-character temporary password is returned.</p>
              <button mat-button type="button" matStepperPrevious>Back</button>
              <button mat-flat-button type="button" (click)="stepper.reset()">Finish</button>
            </mat-step>
          </mat-stepper>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .nav-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h2 {
        font-size: 0.95rem;
      }
      .tab-body {
        padding: 18px 4px;
      }
      .crumbs {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
      }
      .crumbs a {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        text-decoration: none;
      }
      .crumbs mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .crumbs span {
        font-weight: 600;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    `,
  ],
})
export class ComponentNavigationComponent {}
