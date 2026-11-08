import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { isPathWithin } from '../core/path';
import { menuIcon } from '../core/menu-icons';
import { NavigationState } from '../core/navigation-state';
import type { MenuNode } from '../core/models';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule],
  template: `
    @if (node().children.length > 0) {
      <button
        type="button"
        class="nav-item"
        [class.active]="isActive()"
        [class.branch]="true"
        [class.nav-item--sub]="depth() > 0"
        (click)="toggle()"
        [attr.aria-expanded]="expanded()"
      >
        <mat-icon class="nav-icon">{{ icon() }}</mat-icon>
        <span class="nav-label">{{ label() }}</span>
        <mat-icon class="chevron">{{ expanded() ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>
      @if (expanded()) {
        <div class="sub-menu">
          @for (child of node().children; track child.id) {
            <app-sidebar-item [node]="child" [depth]="depth() + 1" />
          }
        </div>
      }
    } @else {
      <a
        class="nav-item"
        [class.nav-item--sub]="depth() > 0"
        [routerLink]="node().path"
        routerLinkActive="active"
      >
        <mat-icon class="nav-icon">{{ icon() }}</mat-icon>
        <span class="nav-label">{{ label() }}</span>
      </a>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 32px;
        height: 32px;
        padding-left: 16px;
        padding-right: 8px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--app-sidebar-foreground);
        text-decoration: none;
        font: inherit;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .nav-item--sub {
        min-height: 32px;
        height: 32px;
        font-size: 14px;
      }
      .sub-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 0 14px;
        padding: 2px 10px;
        border-left: 1px solid var(--app-sidebar-border);
      }
      .nav-item:hover {
        background: var(--app-sidebar-hover);
        color: var(--app-sidebar-foreground);
      }
      .nav-item.active {
        background: var(--app-sidebar-active);
        color: var(--app-foreground);
        font-weight: 500;
      }
      .nav-item.active.branch {
        background: transparent;
        color: var(--app-primary);
        font-weight: 500;
      }
      .nav-item.active .nav-label {
        font-weight: 500;
      }
      .nav-icon {
        flex: none;
        font-size: 16px;
        width: 16px;
        height: 16px;
        opacity: 1;
      }
      .nav-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chevron {
        margin-left: auto;
        font-size: 16px;
        width: 16px;
        height: 16px;
        opacity: 0.7;
      }
    `,
  ],
})
export class SidebarItemComponent {
  readonly node = input.required<MenuNode>();
  readonly depth = input(0);

  private readonly navigation = inject(NavigationState);
  readonly expanded = signal(false);
  readonly icon = computed(() => menuIcon(this.node()));
  // 标题来自 /auth/menus（数据库名称，后端按 Locale 本地化）
  readonly label = computed(() => this.node().name);
  readonly isActive = computed(() =>
    isPathWithin(this.navigation.currentUrl().split('?')[0], this.node().path),
  );

  constructor() {
    effect(() => {
      if (this.isActive()) this.expanded.set(true);
    });
  }

  toggle(): void {
    this.expanded.update((value) => !value);
  }
}
