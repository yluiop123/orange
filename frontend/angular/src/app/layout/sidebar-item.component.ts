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
        [style.paddingLeft.px]="12 + depth() * 14"
        (click)="toggle()"
        [attr.aria-expanded]="expanded()"
      >
        <mat-icon class="nav-icon">{{ icon() }}</mat-icon>
        <span class="nav-label">{{ node().name }}</span>
        <mat-icon class="chevron">{{ expanded() ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>
      @if (expanded()) {
        @for (child of node().children; track child.id) {
          <app-sidebar-item [node]="child" [depth]="depth() + 1" />
        }
      }
    } @else {
      <a
        class="nav-item"
        [routerLink]="node().path"
        routerLinkActive="active"
        [style.paddingLeft.px]="12 + depth() * 14"
      >
        <mat-icon class="nav-icon">{{ icon() }}</mat-icon>
        <span class="nav-label">{{ node().name }}</span>
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
        gap: 12px;
        width: 100%;
        min-height: 42px;
        padding-right: 12px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--app-sidebar-fg);
        text-decoration: none;
        font: inherit;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .nav-item:hover {
        background: var(--app-sidebar-hover);
        color: #fff;
      }
      .nav-item.active {
        background: var(--app-sidebar-active);
        color: #fff;
        font-weight: 600;
      }
      .nav-icon {
        flex: none;
        font-size: 20px;
        width: 20px;
        height: 20px;
        opacity: 0.9;
      }
      .nav-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chevron {
        margin-left: auto;
        font-size: 18px;
        width: 18px;
        height: 18px;
        opacity: 0.75;
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
