import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { createAccess } from './access';
import { baseUrl } from './refresh.service';
import { RefreshService } from './refresh.service';
import { TokenStore } from './token.store';
import { sessionHint } from './session-hint';
import { I18nService } from './i18n.service';
import { findMenuChain } from './menu';
import type { Envelope, MenuNode, Permission, TokenResponse, UserInfo } from './models';

export const ALL_ROLES = 'all';

const ROLE_STORAGE_PREFIX = 'orange.currentRole.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStore);
  private readonly refreshService = inject(RefreshService);
  private readonly i18n = inject(I18nService);

  private readonly _user = signal<UserInfo | null>(null);
  private readonly _menus = signal<MenuNode[]>([]);
  private readonly _menusLoading = signal(false);
  private readonly _menusError = signal(false);
  private readonly _currentRole = signal<string>(ALL_ROLES);
  private readonly _forcedPasswordChange = signal(false);

  readonly user = this._user.asReadonly();
  readonly menus = this._menus.asReadonly();
  readonly menusLoading = this._menusLoading.asReadonly();
  readonly menusError = this._menusError.asReadonly();
  readonly currentRole = this._currentRole.asReadonly();

  readonly roles = computed(() => this._user()?.roles ?? []);

  /** Merge direct permissions with the selected role's grants (UI-only view). */
  readonly permissions = computed<Permission[]>(() => {
    const user = this._user();
    if (!user) return [];
    const role = this._currentRole();
    const list: Permission[] = [...(user.userPermissions ?? [])];
    for (const permission of user.rolePermissions ?? []) {
      if (role === ALL_ROLES || permission.role === role) {
        list.push(permission);
      }
    }
    return list;
  });

  readonly access = computed(() => createAccess(this.permissions()));
  readonly visibleMenus = computed(() => this.access().visibleMenuTree(this._menus()));

  readonly mustChangePassword = computed(
    () => this._user()?.mustChangePassword === true || this._forcedPasswordChange(),
  );

  readonly displayName = computed(
    () => this._user()?.name || this._user()?.username || '',
  );

  readonly menuChain = (path: string): MenuNode[] =>
    findMenuChain(this.visibleMenus(), path);

  canView(path: string): boolean {
    return this.access().canView(path);
  }

  canAct(path: string, action: string): boolean {
    return this.access().canAct(path, action);
  }

  firstVisibleLeaf(): string | null {
    return this.access().firstVisibleLeaf(this.visibleMenus());
  }

  /**
   * Restore the session from the refresh cookie at application start.
   * The non-sensitive session hint avoids a noisy refresh for first-time visitors.
   */
  async bootstrap(): Promise<void> {
    if (!sessionHint.has()) return;
    const token = await this.refreshService.refresh();
    if (!token) return;
    await this.loadIdentity().catch(() => this.clearSession());
  }

  /** Guard helper: true when an access token exists or can be refreshed. */
  async ensureSession(): Promise<boolean> {
    if (this.tokens.has()) return true;
    if (!sessionHint.has()) return false;
    const token = await this.refreshService.refresh();
    return token !== null;
  }

  async login(username: string, password: string): Promise<UserInfo> {
    const response = await fetch(`${baseUrl()}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Locale: this.i18n.locale(),
      },
      body: JSON.stringify({ username, password }),
    });

    const body = (await response.json().catch(() => null)) as Envelope<TokenResponse> | null;

    const token = body?.data?.token;
    if (!response.ok || body?.code !== 200 || !token) {
      throw {
        code: body?.code ?? response.status,
        message: body?.message || this.i18n.t('login.failed'),
        data: body?.data,
        status: response.status,
        traceId: body?.traceId,
      };
    }

    this.tokens.set(token, body.data.expiresIn);
    sessionHint.set();
    await this.loadIdentity();
    const user = this._user();
    if (!user) {
      throw {
        code: 40101,
        message: this.i18n.t('login.failed'),
        status: 401,
      };
    }
    return user;
  }

  async loadIdentity(): Promise<UserInfo | null> {
    const [user] = await Promise.all([this.loadUser(), this.loadMenus()]);
    return user;
  }

  async loadUser(): Promise<UserInfo | null> {
    const response = await new Promise<Envelope<UserInfo>>((resolve, reject) => {
      this.http.get<Envelope<UserInfo>>('/auth/user-info').subscribe({
        next: resolve,
        error: reject,
      });
    });
    const user = response.data ?? null;
    this._user.set(user);
    if (user) {
      const stored = localStorage.getItem(ROLE_STORAGE_PREFIX + (user.username ?? ''));
      const valid =
        stored && (user.roles ?? []).some((role) => role.id === stored) ? stored : ALL_ROLES;
      this._currentRole.set(valid);
      this._forcedPasswordChange.set(false);
    }
    return user;
  }

  async loadMenus(): Promise<void> {
    this._menusLoading.set(true);
    this._menusError.set(false);
    try {
      const response = await new Promise<Envelope<MenuNode[]>>((resolve, reject) => {
        this.http.get<Envelope<MenuNode[]>>('/auth/menus').subscribe({
          next: resolve,
          error: reject,
        });
      });
      this._menus.set(this.normalizeMenus(response.data ?? []));
    } catch {
      this._menusError.set(true);
    } finally {
      this._menusLoading.set(false);
    }
  }

  private normalizeMenus(nodes: MenuNode[]): MenuNode[] {
    return nodes.map((node) => ({
      ...node,
      children: this.normalizeMenus(node.children ?? []),
    }));
  }

  switchRole(role: string): void {
    this._currentRole.set(role);
    const username = this._user()?.username;
    if (username) {
      localStorage.setItem(ROLE_STORAGE_PREFIX + username, role);
    }
  }

  markMustChangePassword(): void {
    this._forcedPasswordChange.set(true);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.http
        .post<Envelope<unknown>>('/auth/change-password', { oldPassword, newPassword })
        .subscribe({ next: () => resolve(), error: reject });
    });
    this.clearSession();
  }

  /** Clear local state immediately so network failures cannot trap the user. */
  clearSession(): void {
    this._user.set(null);
    this._menus.set([]);
    this._menusLoading.set(false);
    this._menusError.set(false);
    this._currentRole.set(ALL_ROLES);
    this._forcedPasswordChange.set(false);
    this.tokens.clear();
    sessionHint.clear();
    localStorage.removeItem('token');
  }

  async logout(): Promise<void> {
    const token = this.tokens.get();
    this.clearSession();
    try {
      await fetch(`${baseUrl()}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      // Local sign-out already happened; a failed revocation must not block it.
    }
  }
}

export function apiUrl(path: string): string {
  return `${environment.apiBase.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
