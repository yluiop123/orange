import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-layout',
  standalone: true,
  imports: [
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.layout.title" descKey="page.component.layout.desc" />
      <div class="layout-stack">
        <section class="panel">
          <h2>Responsive grid</h2>
          <p class="muted">CSS grid with auto-fit columns, used by the dashboards.</p>
          <div class="auto-grid">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="grid-cell">Cell {{ item }}</div>
            }
          </div>
        </section>

        <section class="panel">
          <h2>Split layout</h2>
          <div class="split">
            <div class="split-main">Main content · 2fr</div>
            <div class="split-side">Sidebar · 1fr</div>
          </div>
        </section>

        <section class="panel">
          <h2>Cards</h2>
          <div class="card-row">
            @for (card of cards; track card.title) {
              <mat-card appearance="outlined" class="mini-card">
                <mat-icon>{{ card.icon }}</mat-icon>
                <mat-card-title>{{ card.title }}</mat-card-title>
                <mat-card-content><p class="muted">{{ card.text }}</p></mat-card-content>
              </mat-card>
            }
          </div>
        </section>

        <section class="panel">
          <h2>Expansion panels</h2>
          <mat-accordion multi>
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Project settings</mat-panel-title>
                <mat-panel-description>Workspace defaults</mat-panel-description>
              </mat-expansion-panel-header>
              <p class="muted">Panel content is lazily created and kept in the DOM when collapsed.</p>
            </mat-expansion-panel>
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Notifications</mat-panel-title>
                <mat-panel-description>Email and in-app</mat-panel-description>
              </mat-expansion-panel-header>
              <p class="muted">Use expansion panels for secondary settings that do not deserve a route.</p>
            </mat-expansion-panel>
          </mat-accordion>
        </section>

        <section class="panel">
          <h2>Grid list</h2>
          <mat-grid-list cols="4" rowHeight="90px" gutterSize="10px">
            @for (tile of [1, 2, 3, 4, 5, 6, 7, 8]; track tile) {
              <mat-grid-tile class="tile">{{ tile }}</mat-grid-tile>
            }
          </mat-grid-list>
        </section>

        <section class="panel">
          <h2>Dividers and spacing</h2>
          <p>Content above a divider.</p>
          <mat-divider />
          <p class="spaced">Content below a divider with token-based spacing.</p>
          <mat-divider [inset]="true" />
          <p class="spaced muted">Inset dividers align with list avatars.</p>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .layout-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .auto-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }
      .grid-cell,
      .split > div,
      .tile {
        display: grid;
        place-items: center;
        min-height: 64px;
        border-radius: var(--app-radius);
        background: var(--mat-sys-surface-container-low, #f7f8fa);
        border: 1px dashed var(--mat-sys-outline-variant, #d8dce1);
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.8rem;
      }
      .split {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 12px;
      }
      .split > div {
        min-height: 120px;
      }
      .card-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .mini-card {
        padding: 8px;
      }
      .mini-card mat-icon {
        color: #b45309;
      }
      .mini-card p {
        margin: 0;
        font-size: 0.78rem;
      }
      .spaced {
        margin-top: 14px;
      }
      .tile {
        background: rgba(245, 158, 11, 0.1);
        border-style: solid;
      }
      @media (max-width: 640px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ComponentLayoutComponent {
  readonly cards = [
    { icon: 'bolt', title: 'Fast', text: 'Lazy routes keep the initial bundle small.' },
    { icon: 'shield', title: 'Safe', text: 'Actions are hidden without permission.' },
    { icon: 'layers', title: 'Composable', text: 'Standalone components compose freely.' },
  ];
}
