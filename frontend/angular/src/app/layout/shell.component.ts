import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ALL_ROLES, AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { NavigationState } from '../core/navigation-state';
import { TranslatePipe } from '../core/translate.pipe';
import { ChangePasswordDialogComponent } from '../shared/change-password-dialog.component';
import { LocaleSwitcherComponent } from '../shared/locale-switcher.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { SidebarItemComponent } from './sidebar-item.component';
import type { MenuNode } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    TranslatePipe,
    LocaleSwitcherComponent,
    ThemeToggleComponent,
    SidebarItemComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly navigation = inject(NavigationState);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly breakpoint = inject(BreakpointObserver);

  readonly mobile = signal(false);
  readonly navOpen = signal(false);
  readonly sidebarCollapsed = signal(localStorage.getItem('orange.angular.sidebar') === '1');
  readonly allRoles = ALL_ROLES;
  readonly dark = signal(localStorage.getItem('orange.angular.theme') !== 'light');
  readonly color = signal(localStorage.getItem('orange.angular.color') ?? 'default');
  readonly colors = [
    { key: 'default', hex: '#18181b' },
    {
      key: 'blue',
      hex: '#2b7fff',
      darkHex: '#155dfc',
      lightForeground: '#eff6ff',
      darkForeground: '#1c398e',
    },
    { key: 'green', hex: '#22c55e' },
    { key: 'orange', hex: '#f97316' },
    { key: 'red', hex: '#ef4444' },
    { key: 'rose', hex: '#f43f5e' },
    { key: 'violet', hex: '#8b5cf6' },
    { key: 'yellow', hex: '#eab308' },
  ] as const;
  readonly currentColor = computed(() => {
    if (this.color() === 'default') return this.dark() ? '#fafafa' : '#18181b';
    return this.colors.find((item) => item.key === this.color())?.hex ?? '#18181b';
  });

  private forcedDialog: MatDialogRef<ChangePasswordDialogComponent> | null = null;

  readonly currentPath = computed(() => this.navigation.currentUrl().split('?')[0]);
  readonly breadcrumb = computed<MenuNode[]>(() => this.auth.menuChain(this.currentPath()));
  readonly initials = computed(() => {
    const name = this.auth.displayName();
    return name ? name.slice(0, 1).toUpperCase() : '?';
  });

  constructor() {
    this.applyTheme();

    this.breakpoint.observe('(max-width: 900px)').subscribe((state) => {
      this.mobile.set(state.matches);
      if (!state.matches) this.navOpen.set(false);
    });

    effect(() => {
      if (this.auth.mustChangePassword() && !this.forcedDialog) {
        this.forcedDialog = this.dialog.open(ChangePasswordDialogComponent, {
          data: { forced: true },
          disableClose: true,
          width: '440px',
          maxWidth: '94vw',
          autoFocus: 'first-tabbable',
        });
        this.forcedDialog.afterClosed().subscribe(() => {
          this.forcedDialog = null;
        });
      }
    });
  }

  toggleDark(value: boolean): void {
    this.dark.set(value);
    localStorage.setItem('orange.angular.theme', value ? 'dark' : 'light');
    this.applyTheme();
  }

  setColor(key: string): void {
    this.color.set(key);
    localStorage.setItem('orange.angular.color', key);
    this.applyTheme();
  }

  checkColor(key: string): string {
    if (key !== 'default') return '#ffffff';
    return this.dark() ? '#18181b' : '#fafafa';
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.dark());
    const root = document.documentElement;
    const item = this.colors.find((entry) => entry.key === this.color());
    const isDark = this.dark();
    if (!item || item.key === 'default') {
      root.style.removeProperty('--app-primary');
      root.style.removeProperty('--app-primary-foreground');
      root.style.removeProperty('--app-ring');
      root.style.removeProperty('--mat-sys-primary');
      root.style.removeProperty('--mat-sys-primary-fixed');
      root.style.removeProperty('--mat-sys-primary-container');
      root.style.setProperty('--app-sidebar-active', isDark ? '#27272a' : '#e7e7e7');
      root.style.setProperty('--app-sidebar-active-foreground', isDark ? '#fafafa' : '#18181b');
      root.style.setProperty('--orange-card-surface', isDark ? '#0a0a0a' : '#ffffff');
    } else {
      const hex = isDark && 'darkHex' in item ? item.darkHex : item.hex;
      const foreground =
        isDark && 'darkForeground' in item
          ? item.darkForeground
          : !isDark && 'lightForeground' in item
            ? item.lightForeground
            : isDark
              ? '#18181b'
              : '#fafafa';
      root.style.setProperty('--app-primary', hex);
      root.style.setProperty('--app-primary-foreground', foreground);
      root.style.setProperty('--mat-sys-on-primary', foreground);
      root.style.setProperty('--app-ring', hex);
      root.style.setProperty('--mat-sys-primary', hex);
      root.style.setProperty('--mat-sys-primary-fixed', hex);
      root.style.setProperty('--mat-sys-primary-container', hex);
      root.style.setProperty('--orange-card-surface', isDark ? '#18181b' : '#ffffff');
      root.style.setProperty(
        '--app-sidebar-active',
        this.mixColor(hex, isDark ? '#18181b' : '#fafafa', 0.3),
      );
      root.style.setProperty('--app-sidebar-active-foreground', hex);
    }
  }

  private mixColor(hex: string, base: string, ratio: number): string {
    const parse = (value: string) =>
      [0, 2, 4].map((index) => Number.parseInt(value.replace('#', '').slice(index, index + 2), 16));
    const source = parse(hex);
    const target = parse(base);
    const mixed = source.map((channel, index) =>
      Math.round(channel * ratio + target[index] * (1 - ratio)),
    );
    return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  toggleNav(): void {
    if (this.mobile()) {
      this.navOpen.update((value) => !value);
      return;
    }
    this.sidebarCollapsed.update((value) => {
      localStorage.setItem('orange.angular.sidebar', value ? '0' : '1');
      return !value;
    });
  }

  closeNav(): void {
    if (this.mobile()) this.navOpen.set(false);
  }

  changeRole(role: string): void {
    this.auth.switchRole(role);
    const current = this.currentPath();
    if (!this.auth.canView(current)) {
      const target = this.auth.firstVisibleLeaf();
      void this.router.navigateByUrl(target ?? '/forbidden');
    }
  }

  crumbName(node: MenuNode): string {
    return node.name;
  }

  onLocaleChanged(): void {
    // Backend menu and role names are localized by the Locale header.
    void this.auth.refreshLocalized();
  }

  swatchColor(item: { key: string; hex: string }): string {
    return item.key === 'default' ? (this.dark() ? '#fafafa' : '#18181b') : item.hex;
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      data: { forced: false },
      width: '440px',
      maxWidth: '94vw',
    });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  goHome(): void {
    const target = this.auth.firstVisibleLeaf();
    void this.router.navigateByUrl(target ?? '/forbidden');
  }
}
