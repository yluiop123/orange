import { Component, computed, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { PageHeaderComponent } from '../../../shared/page-header.component';

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

@Component({
  selector: 'app-component-display',
  standalone: true,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatTreeModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.display.title" descKey="page.component.display.desc" />
      <div class="display-grid">
        <section class="panel">
          <h2>Avatars &amp; badges</h2>
          <div class="avatar-row">
            @for (avatar of avatars; track avatar.name) {
              <div class="avatar-item">
                <span class="avatar" [style.background]="avatar.color">{{ avatar.name.charAt(0) }}</span>
                <small>{{ avatar.name }}</small>
              </div>
            }
            <span class="avatar add"><mat-icon>add</mat-icon></span>
          </div>
          <div class="row">
            <mat-icon matBadge="5" matBadgeColor="warn">notifications</mat-icon>
            <mat-icon matBadge="sync" matBadgeColor="accent">cloud</mat-icon>
            <span matBadge="Beta" matBadgeOverlap="false">Feature</span>
          </div>
        </section>

        <section class="panel">
          <h2>Tooltips</h2>
          <div class="row">
            <button mat-stroked-button type="button" matTooltip="This is a tooltip">Hover me</button>
            <button mat-icon-button type="button" matTooltip="Delete" matTooltipPosition="above" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
            <span matTooltip="Inline text tooltip" class="tip-text">Inline target</span>
          </div>
        </section>

        <section class="panel">
          <h2>List</h2>
          <mat-list>
            @for (item of notifications; track item.title) {
              <mat-list-item>
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.title }}</span>
                <span matListItemLine>{{ item.line }}</span>
              </mat-list-item>
            }
          </mat-list>
          <mat-divider />
          <mat-list>
            <mat-list-item>
              <span matListItemTitle>Two-line item</span>
              <span matListItemLine>Secondary text</span>
            </mat-list-item>
            <mat-list-item>
              <span matListItemTitle>Another item</span>
              <span matListItemLine>With metadata</span>
            </mat-list-item>
          </mat-list>
        </section>

        <section class="panel">
          <h2>Tree</h2>
          <mat-tree [dataSource]="treeData()" [childrenAccessor]="childrenAccessor">
            <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
              <mat-icon class="leaf">insert_drive_file</mat-icon>
              {{ node.name }}
            </mat-tree-node>
            <mat-tree-node *matTreeNodeDef="let node; when: hasChild" matTreeNodePadding>
              <button mat-icon-button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
                <mat-icon>expand_more</mat-icon>
              </button>
              <mat-icon class="folder">folder</mat-icon>
              {{ node.name }}
            </mat-tree-node>
          </mat-tree>
        </section>

        <section class="panel">
          <h2>Chips</h2>
          <mat-chip-set aria-label="Tags">
            <mat-chip highlighted>Angular</mat-chip>
            <mat-chip>Material</mat-chip>
            <mat-chip>Signals</mat-chip>
            <mat-chip>ECharts</mat-chip>
            <mat-chip>Leaflet</mat-chip>
          </mat-chip-set>
          <mat-divider />
          <div class="row">
            <span class="tag">stable</span>
            <span class="tag warn">beta</span>
            <span class="tag off">deprecated</span>
          </div>
        </section>

        <section class="panel">
          <h2>Card</h2>
          <mat-card appearance="raised" class="profile">
            <div class="profile-head">
              <span class="avatar large">O</span>
              <div>
                <strong>ORANGE Admin</strong>
                <p class="muted">Angular + Material</p>
              </div>
            </div>
            <mat-card-content>
              <p class="muted">
                Display surfaces for identity, status and metadata. All text comes
                from the theme tokens so light and dark stay readable.
              </p>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .display-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 16px;
      }
      h2 {
        font-size: 0.95rem;
      }
      .row,
      .avatar-row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        margin: 10px 0;
      }
      .avatar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .avatar-item small {
        font-size: 0.64rem;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .avatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        color: #fff;
        font-weight: 700;
        font-size: 0.9rem;
      }
      .avatar.add {
        background: var(--mat-sys-surface-container-high, #f1f3f4);
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .avatar.large {
        width: 48px;
        height: 48px;
        font-size: 1.15rem;
        background: linear-gradient(135deg, #f59e0b, #ea580c);
      }
      .tip-text {
        font-size: 0.82rem;
        text-decoration: underline dotted;
        cursor: help;
      }
      .leaf,
      .folder {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 6px;
        color: var(--mat-sys-on-surface-variant, #5f6368);
      }
      .folder {
        color: #b45309;
      }
      .tag {
        padding: 3px 10px;
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.12);
        color: #15803d;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .tag.warn {
        background: rgba(217, 119, 6, 0.12);
        color: #b45309;
      }
      .tag.off {
        background: rgba(185, 28, 28, 0.1);
        color: #b91c1c;
      }
      .profile-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 4px 4px;
      }
      .profile-head p {
        margin: 2px 0 0;
        font-size: 0.78rem;
      }
    `,
  ],
})
export class ComponentDisplayComponent {
  readonly avatars = [
    { name: 'Olivia', color: '#f59e0b' },
    { name: 'Jackson', color: '#2563eb' },
    { name: 'Isabella', color: '#14b8a6' },
    { name: 'William', color: '#8b5cf6' },
  ];

  readonly notifications = [
    { icon: 'mail', title: 'New message', line: 'From the operations team' },
    { icon: 'event', title: 'Deployment window', line: 'Today at 22:00 UTC' },
    { icon: 'warning', title: 'Certificate expiring', line: 'edge-gw-2 · 3 days left' },
  ];

  private readonly tree = signal<TreeNode[]>([
    {
      name: 'src',
      children: [
        { name: 'app', children: [{ name: 'core' }, { name: 'layout' }, { name: 'pages' }] },
        { name: 'assets' },
        { name: 'main.ts' },
      ],
    },
    { name: 'package.json' },
    { name: 'README.md' },
  ]);

  readonly treeData = computed(() => this.tree());
  readonly childrenAccessor = (node: TreeNode): TreeNode[] => node.children ?? [];
  readonly hasChild = (_index: number, node: TreeNode): boolean => !!node.children?.length;
}
