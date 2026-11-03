import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ALL_ROLES, AuthService } from '../core/auth.service';
import { I18nService, Locale } from '../core/i18n.service';
import { NavigationState } from '../core/navigation-state';
import { TranslatePipe } from '../core/translate.pipe';
import { ChangePasswordDialogComponent } from '../shared/change-password-dialog.component';
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
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    TranslatePipe,
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
  readonly allRoles = ALL_ROLES;

  private forcedDialog: MatDialogRef<ChangePasswordDialogComponent> | null = null;

  readonly currentPath = computed(() => this.navigation.currentUrl().split('?')[0]);
  readonly breadcrumb = computed<MenuNode[]>(() => this.auth.menuChain(this.currentPath()));
  readonly initials = computed(() => {
    const name = this.auth.displayName();
    return name ? name.slice(0, 1).toUpperCase() : '?';
  });

  constructor() {
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

  toggleNav(): void {
    if (this.mobile()) {
      this.navOpen.update((value) => !value);
    }
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

  changeLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
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
