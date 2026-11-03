import { Component } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-general',
  standalone: true,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.general.title" descKey="page.component.general.desc" />
      <div class="demo-grid">
        <section class="panel">
          <h2>Buttons</h2>
          <div class="row">
            <button mat-flat-button type="button">Flat</button>
            <button mat-raised-button type="button">Raised</button>
            <button mat-stroked-button type="button">Stroked</button>
            <button mat-button type="button">Text</button>
            <button mat-icon-button type="button" aria-label="Favorite"><mat-icon>favorite</mat-icon></button>
            <button mat-fab extended type="button"><mat-icon>add</mat-icon> Create</button>
          </div>
          <div class="row">
            <button mat-flat-button type="button" disabled>Disabled</button>
            <button mat-stroked-button type="button" color="warn">Danger</button>
          </div>
        </section>

        <section class="panel">
          <h2>Badges &amp; chips</h2>
          <div class="row">
            <mat-icon matBadge="4" matBadgeColor="accent">notifications</mat-icon>
            <mat-icon matBadge="12" matBadgeColor="warn">mail</mat-icon>
            <span matBadge="New" matBadgeOverlap="false" class="badge-text">Releases</span>
          </div>
          <mat-chip-set aria-label="Status chips">
            <mat-chip highlighted>Active</mat-chip>
            <mat-chip>Beta</mat-chip>
            <mat-chip disabled>Retired</mat-chip>
          </mat-chip-set>
        </section>

        <section class="panel">
          <h2>Typography</h2>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p class="lead">Lead paragraph demonstrates the Material type scale and spacing.</p>
          <p class="muted">Secondary copy uses the muted token from the theme.</p>
          <mat-divider />
        </section>

        <section class="panel">
          <h2>Progress</h2>
          <mat-progress-bar mode="determinate" value="72" />
          <mat-progress-bar mode="indeterminate" />
          <div class="row spinners">
            <mat-spinner diameter="32" />
            <mat-spinner diameter="44" />
            <mat-spinner diameter="56" />
          </div>
        </section>

        <section class="panel">
          <h2>Icons</h2>
          <div class="row icons">
            @for (icon of icons; track icon) {
              <span class="icon-cell"><mat-icon>{{ icon }}</mat-icon><small>{{ icon }}</small></span>
            }
          </div>
        </section>

        <section class="panel">
          <h2>Cards</h2>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>Outlined card</mat-card-title>
              <mat-card-subtitle>Compact content container</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="muted">Cards group related actions and content.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button type="button">Details</button>
              <button mat-flat-button type="button">Open</button>
            </mat-card-actions>
          </mat-card>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 16px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 8px 0 14px;
      }
      h2 {
        font-size: 0.95rem;
      }
      .badge-text {
        margin-right: 26px;
        font-size: 0.85rem;
      }
      .lead {
        font-size: 1.02rem;
      }
      .spinners {
        margin-top: 16px;
      }
      .icons {
        gap: 14px;
      }
      .icon-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        width: 64px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .icon-cell small {
        font-size: 0.58rem;
        text-align: center;
        word-break: break-all;
      }
    `,
  ],
})
export class ComponentGeneralComponent {
  readonly icons = ['dashboard', 'security', 'map', 'public', 'insights', 'settings', 'group', 'key', 'history', 'widgets', 'table_chart', 'view_in_ar'];
}
