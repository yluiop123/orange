import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type {
  Group,
  OperationLog,
  PageResult,
  PermissionRow,
  Role,
  Status,
  User,
} from './models';

export interface UserQuery {
  page: number;
  size: number;
  keyword?: string;
  status?: string;
  groupId?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface RoleQuery {
  page: number;
  size: number;
  id?: string;
  name?: string;
  status?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface GroupQuery {
  id?: string;
  name?: string;
  status?: string;
}

export interface PermissionQuery extends GroupQuery {
  path?: string;
  type?: string;
}

export interface OperationLogQuery {
  page: number;
  size: number;
  username?: string;
  path?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface UserPayload {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  groupId?: string;
  status?: Status;
  roles?: string[];
  permissions?: string[];
}

export interface RolePayload {
  id?: string;
  name?: string;
  status?: Status;
  permissions?: string[];
}

export interface GroupPayload {
  id?: string;
  name?: string;
  parentId?: string | null;
  status?: Status;
}

export interface PermissionPayload {
  id?: string;
  name?: string;
  path?: string;
  type?: 'menu' | 'directory' | 'action';
  action?: string | null;
  parentId?: string | null;
  status?: Status;
}

@Injectable({ providedIn: 'root' })
export class SystemApi {
  private readonly api = inject(ApiService);

  listUsers(query: UserQuery): Observable<PageResult<User>> {
    return this.api.get<PageResult<User>>('/system/users', query as unknown as Record<string, string | number>);
  }

  getUser(id: string): Observable<User> {
    return this.api.get<User>(`/system/users/${id}`);
  }

  createUser(payload: UserPayload): Observable<string> {
    return this.api.post<string>('/system/users', payload);
  }

  updateUser(id: string, payload: UserPayload): Observable<void> {
    return this.api.patch<void>(`/system/users/${id}`, { ...payload, id });
  }

  updateUserStatus(id: string, status: Status): Observable<void> {
    return this.api.patch<void>(`/system/users/${id}/status`, { status });
  }

  resetUserPassword(id: string): Observable<string> {
    return this.api.post<string>(`/system/users/${id}/reset-password`);
  }

  deleteUsers(ids: string[]): Observable<void> {
    return this.api.delete<void>('/system/users', { ids: ids.join(',') });
  }

  listRoles(query: RoleQuery): Observable<PageResult<Role>> {
    return this.api.get<PageResult<Role>>('/system/roles', query as unknown as Record<string, string | number>);
  }

  getRole(id: string): Observable<Role> {
    return this.api.get<Role>(`/system/roles/${id}`);
  }

  createRole(payload: RolePayload): Observable<string> {
    return this.api.post<string>('/system/roles', payload);
  }

  updateRole(id: string, payload: RolePayload): Observable<void> {
    return this.api.patch<void>(`/system/roles/${id}`, { ...payload, id });
  }

  deleteRoles(ids: string[]): Observable<void> {
    return this.api.delete<void>('/system/roles', { ids: ids.join(',') });
  }

  listGroups(query?: GroupQuery): Observable<Group[]> {
    return this.api.get<Group[]>('/system/groups', query as Record<string, string>);
  }

  getGroup(id: string): Observable<Group> {
    return this.api.get<Group>(`/system/groups/${id}`);
  }

  addGroupChild(payload: GroupPayload): Observable<void> {
    return this.api.post<void>('/system/groups/children', payload);
  }

  updateGroup(id: string, payload: GroupPayload): Observable<void> {
    return this.api.patch<void>(`/system/groups/${id}`, { ...payload, id });
  }

  updateGroupStatus(id: string, status: Status): Observable<void> {
    return this.api.patch<void>(`/system/groups/${id}/status`, { status });
  }

  deleteGroups(ids: string[]): Observable<void> {
    return this.api.delete<void>('/system/groups', { ids: ids.join(',') });
  }

  listPermissions(query?: PermissionQuery): Observable<PermissionRow[]> {
    return this.api.get<PermissionRow[]>('/system/permissions', query as Record<string, string>);
  }

  getPermission(id: string): Observable<PermissionRow> {
    return this.api.get<PermissionRow>(`/system/permissions/${id}`);
  }

  addPermissionChild(payload: PermissionPayload): Observable<void> {
    return this.api.post<void>('/system/permissions/children', payload);
  }

  updatePermission(id: string, payload: PermissionPayload): Observable<void> {
    return this.api.patch<void>(`/system/permissions/${id}`, { ...payload, id });
  }

  deletePermissions(ids: string[]): Observable<void> {
    return this.api.delete<void>('/system/permissions', { ids: ids.join(',') });
  }

  listOperationLogs(query: OperationLogQuery): Observable<PageResult<OperationLog>> {
    // 空字符串会被后端当成非法的日期/状态条件，只发送真正有值的筛选参数
    const params = Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    ) as Record<string, string | number>;
    return this.api.get<PageResult<OperationLog>>('/system/operation-logs', params);
  }
}
