import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import type { PageResult } from './models';
import { SystemApi } from './system-api.service';
import type { Group, PermissionRow, Role } from './models';

/** Lazily loaded reference lists shared by filters and dialogs. */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly api = inject(SystemApi);

  readonly groups = signal<Group[]>([]);
  readonly permissions = signal<PermissionRow[]>([]);
  readonly roles = signal<Role[]>([]);

  private groups$?: Observable<Group[]>;
  private permissions$?: Observable<PermissionRow[]>;
  private roles$?: Observable<Role[]>;

  ensureGroups(): Observable<Group[]> {
    if (!this.groups$) {
      this.groups$ = this.api.listGroups().pipe(
        tap((groups) => this.groups.set(groups ?? [])),
        shareReplay(1),
      );
    }
    return this.groups$;
  }

  ensurePermissions(): Observable<PermissionRow[]> {
    if (!this.permissions$) {
      this.permissions$ = this.api.listPermissions().pipe(
        tap((rows) => this.permissions.set(rows ?? [])),
        shareReplay(1),
      );
    }
    return this.permissions$;
  }

  ensureRoles(): Observable<Role[]> {
    if (!this.roles$) {
      this.roles$ = this.api.listRoles({ page: 1, size: 100 }).pipe(
        map((result: PageResult<Role>) => result.list ?? []),
        tap((roles) => this.roles.set(roles)),
        shareReplay(1),
      );
    }
    return this.roles$;
  }

  invalidateGroups(): void {
    this.groups$ = undefined;
  }

  invalidatePermissions(): void {
    this.permissions$ = undefined;
  }

  invalidateRoles(): void {
    this.roles$ = undefined;
  }
}
