import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { isSamePath } from '../core/path';
import type {
  Envelope,
  Group,
  MenuNode,
  OperationLog,
  PageResult,
  PermissionRow,
  Role,
  TokenResponse,
  User,
  UserInfo,
} from '../core/models';
import { buildTree } from '../core/tree-rows';
import { resetState, type MockPermission, type MockState, type MockUser } from './mock-data';

const CURRENT_USER_KEY = 'orange.mock.currentUser';
const MOCK_FLAG_KEY = 'orange.mock.enabled';
const SENSITIVE_SEGMENTS = ['login', 'refresh', 'change-password', 'reset-password'];

type Locale = 'zh' | 'en';
type Json = Record<string, unknown>;

export interface MockReply {
  status: number;
  body: Envelope<unknown>;
}

/**
 * Enables the in-memory API when the build flag is on, or when the app is
 * opened with `?mock=1` (persisted so client-side navigation keeps it).
 */
export function isMockEnabled(): boolean {
  if (environment.mock) return true;
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('mock');
    if (flag === '1' || flag === 'true') {
      localStorage.setItem(MOCK_FLAG_KEY, '1');
    } else if (flag === '0' || flag === 'false') {
      localStorage.removeItem(MOCK_FLAG_KEY);
    }
    return localStorage.getItem(MOCK_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function traceId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function envelope<T>(data: T, message = 'success'): Envelope<T> {
  return { code: 200, message, data, timestamp: Date.now(), traceId: traceId() };
}

function failure(code: number, message: string, status: number, data: unknown = null): MockReply {
  return {
    status,
    body: { code, message, data, timestamp: Date.now(), traceId: traceId() },
  };
}

function ok<T>(data: T, message = 'success'): MockReply {
  return { status: 200, body: envelope(data, message) };
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  return value === null || value === undefined ? '' : String(value);
}

function trim(value: unknown): string {
  return text(value).trim();
}

function numberParam(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate<T>(rows: T[], page: number, size: number): PageResult<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * size;
  return { total, list: rows.slice(start, start + size), page: safePage, size, totalPages };
}

function localeName(entry: MockPermission, locale: Locale): string {
  return entry.translations?.[locale] ?? (locale === 'en' && entry.nameEn ? entry.nameEn : entry.name);
}

function tempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(
    { length: 12 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('');
}

function codeIssue(
  kind: 'group' | 'permission',
  id: string,
  parentId?: string | null,
): string | null {
  const rootLength = kind === 'group' ? 2 : 4;
  if (!id) return '编码不能为空 / Code is required';
  if (!/^\d+$/.test(id)) return '编码只能包含数字 / Code must be digits only';
  if (!parentId) {
    return id.length === rootLength
      ? null
      : `根编码必须是 ${rootLength} 位 / Root code must be ${rootLength} digits`;
  }
  if (id.length !== parentId.length + 2) {
    return `编码必须是 ${parentId.length + 2} 位 / Code must be ${parentId.length + 2} digits`;
  }
  if (!id.startsWith(parentId)) {
    return `编码必须以 ${parentId} 开头 / Code must start with ${parentId}`;
  }
  return null;
}

function descendantIds(rows: { id: string; parentId?: string | null }[], rootId: string): string[] {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const next = rows
      .filter((row) => row.parentId && frontier.includes(row.parentId))
      .map((row) => row.id);
    ids.push(...next);
    frontier = next;
  }
  return ids;
}

function withAncestors<T extends { id: string; parentId?: string | null }>(
  rows: T[],
  matched: T[],
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ids = new Set(matched.map((row) => row.id));
  for (const row of matched) {
    let parentId = row.parentId;
    while (parentId) {
      ids.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }
  return rows.filter((row) => ids.has(row.id));
}

@Injectable({ providedIn: 'root' })
export class MockBackend {
  readonly enabled = isMockEnabled();

  private state: MockState = resetState();

  reset(): void {
    this.state = resetState();
  }

  login(username: string, password: string, locale: Locale): Envelope<TokenResponse> {
    const entry = this.findUser(username.trim());
    if (!entry) {
      return {
        code: 40101,
        message: locale === 'en' ? 'Unknown username' : '用户名错误',
        data: null as unknown as TokenResponse,
      };
    }
    if (entry.password !== password) {
      return {
        code: 40101,
        message: locale === 'en' ? 'Wrong password' : '密码错误',
        data: null as unknown as TokenResponse,
      };
    }
    this.setCurrentUser(entry.username);
    return envelope({
      token: 'mock-access-token',
      expiresIn: 1800,
      refreshExpiresIn: 604800,
    });
  }

  refresh(): Envelope<TokenResponse> | null {
    const entry = this.findUser(this.currentUsername());
    if (!entry) return null;
    return envelope({ token: 'mock-access-token', expiresIn: 1800 });
  }

  logout(): void {
    this.clearCurrentUser();
  }

  handle(request: HttpRequest<unknown>): MockReply {
    const started = Date.now();
    const method = request.method.toUpperCase();
    const rawPath = request.url.replace(/^https?:\/\/[^/]+/, '');
    const path = rawPath.replace(/^\/api\/v1/, '').split('?')[0];
    const actor = this.currentUsername();
    const isPublic = method === 'POST' && /^\/auth\/(login|refresh)$/.test(path);
    const isAuthPath = path.startsWith('/auth/');
    const authorization = request.headers.get('Authorization') ?? '';

    let reply: MockReply;
    if (!isPublic && !authorization) {
      reply = failure(40101, '未登录 / Not authenticated', 401);
    } else if (!isPublic && !isAuthPath && this.findUser(actor)?.mustChangePassword === true) {
      reply = failure(40302, '请先修改初始密码 / Change the temporary password first', 403);
    } else {
      const denied = this.authorize(method, path, actor);
      reply =
        denied ??
        this.handleAuth(method, path, request) ??
        this.handleUsers(method, path, request, actor) ??
        this.handleRoles(method, path, request) ??
        this.handleGroups(method, path, request) ??
        this.handlePermissions(method, path, request) ??
        this.handleLogs(method, path, request) ??
        failure(40401, `Mock route not found: ${method} ${path}`, 404);
    }

    this.recordLog(request, method, rawPath, reply.status, actor, Date.now() - started);
    return reply;
  }

  private currentUsername(): string {
    try {
      return localStorage.getItem(CURRENT_USER_KEY) || 'super';
    } catch {
      return 'super';
    }
  }

  private setCurrentUser(username: string): void {
    try {
      localStorage.setItem(CURRENT_USER_KEY, username);
    } catch {
      // Storage is unavailable (SSR/tests); the in-memory seed still works.
    }
  }

  private clearCurrentUser(): void {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  private findUser(username: string): MockUser | undefined {
    return this.state.users.find((entry) => entry.username === username);
  }

  private isSuper(username: string): boolean {
    return this.findUser(username)?.roleIds.includes('super') ?? false;
  }

  private groupNameOf(groupId: string): string {
    return this.state.groups.find((group) => group.id === groupId)?.name ?? groupId;
  }

  private permissionsOf(username: string): MockPermission[] {
    const entry = this.findUser(username);
    if (!entry) return [];
    const ids = new Set<string>(entry.permissionIds);
    for (const roleId of entry.roleIds) {
      const role = this.state.roles.find((item) => item.id === roleId);
      if (role?.status === '1') {
        for (const id of role.permissions ?? []) ids.add(id);
      }
    }
    return this.state.permissions.filter(
      (permission) => ids.has(permission.id) && permission.status === '1',
    );
  }

  /** Mirrors backend authorization: 403 when the actor lacks the permission. */
  private authorize(method: string, path: string, actor: string): MockReply | null {
    const required = requiredPermission(method, path);
    if (!required) return null;
    const permissions = this.permissionsOf(actor);
    const allowed =
      required.action === 'view'
        ? permissions.some(
            (item) =>
              (item.type === 'menu' || item.type === 'directory') &&
              isSamePath(item.path, required.path),
          )
        : permissions.some(
            (item) =>
              item.type === 'action' &&
              isSamePath(item.path, required.path) &&
              item.action === required.action,
          );
    return allowed ? null : failure(40301, '没有执行该操作的权限 / Forbidden', 403);
  }

  private handleAuth(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
  ): MockReply | null {
    const locale = localeOf(request);

    if (method === 'POST' && path === '/auth/login') {
      const payload = bodyOf(request);
      const result = this.login(trim(payload['username']), text(payload['password']), locale);
      return result.code === 200 ? ok(result.data) : failure(result.code, result.message, 401);
    }

    if (method === 'POST' && path === '/auth/refresh') {
      const result = this.refresh();
      return result ? ok(result.data) : failure(40101, '未登录 / Not authenticated', 401);
    }

    if (method === 'POST' && path === '/auth/logout') {
      this.clearCurrentUser();
      return ok('ok');
    }

    if (method === 'GET' && path === '/auth/user-info') {
      const entry = this.findUser(this.currentUsername());
      if (!entry) return failure(40101, '未登录 / Not authenticated', 401);
      return ok(this.userInfoOf(entry, locale));
    }

    if (method === 'GET' && path === '/auth/menus') {
      return ok(this.menuTree(locale));
    }

    if (method === 'POST' && path === '/auth/change-password') {
      const entry = this.findUser(this.currentUsername());
      if (!entry) return failure(40101, '未登录 / Not authenticated', 401);
      const payload = bodyOf(request);
      const oldPassword = text(payload['oldPassword']);
      const newPassword = text(payload['newPassword']);
      if (entry.password !== oldPassword) {
        return failure(40002, '原密码错误 / Current password is wrong', 400);
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(newPassword)) {
        return failure(40002, '新密码需 8 位以上且包含字母和数字 / Weak password', 400);
      }
      if (oldPassword === newPassword) {
        return failure(40002, '新密码不能与原密码相同 / New password must differ', 400);
      }
      entry.password = newPassword;
      entry.mustChangePassword = false;
      return ok('ok', locale === 'en' ? 'Password changed' : '密码已修改');
    }

    return null;
  }

  private handleUsers(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
    actor: string,
  ): MockReply | null {
    if (path === '/system/users') {
      if (method === 'GET') {
        const keyword = trim(request.params.get('keyword')).toLowerCase();
        const status = text(request.params.get('status'));
        const groupId = trim(request.params.get('groupId'));
        const sort = trim(request.params.get('sort')) || 'createTime';
        const direction = request.params.get('direction') === 'desc' ? -1 : 1;

        let rows = this.state.users.filter((entry) => {
          if (status && status !== 'all' && entry.status !== status) return false;
          if (groupId && entry.groupId !== groupId) return false;
          if (!keyword) return true;
          return [entry.name, entry.username, entry.email, entry.phone]
            .join(' ')
            .toLowerCase()
            .includes(keyword);
        });

        rows = [...rows].sort((a, b) => {
          const left = text((a as unknown as Record<string, unknown>)[sort]);
          const right = text((b as unknown as Record<string, unknown>)[sort]);
          return left.localeCompare(right) * direction;
        });

        const result = paginate(
          rows,
          numberParam(request.params.get('page'), 1),
          numberParam(request.params.get('size'), 10),
        );
        return ok({ ...result, list: result.list.map((entry) => this.userDto(entry)) });
      }

      if (method === 'POST') {
        const payload = bodyOf(request);
        const invalid = this.validateUser(payload, null, actor);
        if (invalid) return failure(invalid.code, invalid.message, 400, invalid.data);
        const username = trim(payload['username']);
        const temporary = tempPassword();
        const roleIds = arrayOf(payload['roles']);
        const permissionIds = arrayOf(payload['permissions']);
        const entry: MockUser = {
          id: `u-${Date.now()}`,
          name: trim(payload['name']),
          username,
          email: trim(payload['email']),
          groupId: trim(payload['groupId']),
          groupName: this.groupNameOf(trim(payload['groupId'])),
          phone: trim(payload['phone']),
          status: (trim(payload['status']) || '1') as User['status'],
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          roles: roleIds.map((id) => ({ id, name: id })),
          permissions: permissionIds,
          password: temporary,
          roleIds,
          permissionIds,
          mustChangePassword: true,
        };
        this.state.users.push(entry);
        return ok(temporary);
      }

      if (method === 'DELETE') {
        const ids = trim(request.params.get('ids')).split(',').filter(Boolean);
        if (
          ids.some((id) => this.state.users.find((entry) => entry.id === id)?.username === actor)
        ) {
          return failure(40901, '不能删除当前登录账号 / Cannot delete yourself', 409);
        }
        for (const id of ids) this.deleteUser(id);
        return ok('ok');
      }
    }

    const statusMatch = path.match(/^\/system\/users\/([^/]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const entry = this.state.users.find((user) => user.id === statusMatch[1]);
      if (!entry) return failure(40401, '用户不存在 / User not found', 404);
      const status = trim(bodyOf(request)['status']);
      if (status === '0' && entry.username === actor) {
        return failure(40901, '不能停用当前登录账号 / Cannot disable yourself', 409);
      }
      if (status === '0' && this.lastEnabledSuper(entry.id)) {
        return failure(40901, '至少保留一个启用的超级管理员 / Keep one enabled super', 409);
      }
      entry.status = status === '1' ? '1' : '0';
      return ok('ok');
    }

    const resetMatch = path.match(/^\/system\/users\/([^/]+)\/reset-password$/);
    if (resetMatch && method === 'POST') {
      const entry = this.state.users.find((user) => user.id === resetMatch[1]);
      if (!entry) return failure(40401, '用户不存在 / User not found', 404);
      if (entry.roleIds.includes('super') && !this.isSuper(actor)) {
        return failure(
          40301,
          '只有超级管理员可以重置 super 的密码 / Only super may reset super',
          403,
        );
      }
      const temporary = tempPassword();
      entry.password = temporary;
      entry.mustChangePassword = true;
      return ok(temporary);
    }

    const detailMatch = path.match(/^\/system\/users\/([^/]+)$/);
    if (detailMatch) {
      const entry = this.state.users.find((user) => user.id === detailMatch[1]);
      if (!entry) return failure(40401, '用户不存在 / User not found', 404);
      if (method === 'GET') return ok(this.userDto(entry));
      if (method === 'PATCH') {
        const body = bodyOf(request);
        const payload: Json = { ...body, username: entry.username };
        const invalid = this.validateUser(payload, entry.id, actor);
        if (invalid) return failure(invalid.code, invalid.message, 400, invalid.data);
        entry.name = trim(payload['name']);
        entry.email = trim(payload['email']);
        entry.groupId = trim(payload['groupId']);
        entry.groupName = this.groupNameOf(entry.groupId);
        entry.phone = trim(payload['phone']);
        entry.status = (trim(payload['status']) || entry.status) as User['status'];
        if (Array.isArray(payload['roles'])) {
          entry.roleIds = arrayOf(payload['roles']);
          entry.roles = entry.roleIds.map((id) => ({ id, name: id }));
        }
        if (Array.isArray(payload['permissions'])) {
          entry.permissionIds = arrayOf(payload['permissions']);
          entry.permissions = [...entry.permissionIds];
        }
        entry.updateTime = new Date().toISOString();
        return ok('ok');
      }
      if (method === 'DELETE') {
        if (entry.username === actor) {
          return failure(40901, '不能删除当前登录账号 / Cannot delete yourself', 409);
        }
        this.deleteUser(entry.id);
        return ok('ok');
      }
    }

    return null;
  }

  private deleteUser(id: string): void {
    const entry = this.state.users.find((user) => user.id === id);
    if (entry && this.lastEnabledSuper(entry.id)) return;
    this.state.users = this.state.users.filter((user) => user.id !== id);
  }

  private lastEnabledSuper(id: string): boolean {
    const entry = this.state.users.find((user) => user.id === id);
    if (!entry?.roleIds.includes('super')) return false;
    const enabledSupers = this.state.users.filter(
      (user) => user.status === '1' && user.roleIds.includes('super'),
    );
    return enabledSupers.length <= 1 && entry.status === '1';
  }

  private validateUser(
    payload: Json,
    id: string | null,
    actor: string,
  ): { code: number; message: string; data: Record<string, string> } | null {
    const errors: Record<string, string> = {};
    const name = trim(payload['name']);
    const username = trim(payload['username']);
    const email = trim(payload['email']);
    const phone = trim(payload['phone']);
    const groupId = trim(payload['groupId']);

    if (name.length < 2) errors['name'] = '姓名至少2个字符 / Name needs 2+ characters';
    if (!id) {
      if (!/^[A-Za-z0-9_]{4,50}$/.test(username)) {
        errors['username'] =
          '用户名需为4–50位字母、数字或下划线 / Username must be 4–50 word chars';
      } else if (this.state.users.some((entry) => entry.username === username)) {
        errors['username'] = '用户名已存在 / Username already exists';
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['email'] = '无效的邮箱地址 / Invalid email';
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) errors['phone'] = '无效的手机号 / Invalid mobile number';
    if (!this.state.groups.some((group) => group.id === groupId)) {
      errors['groupId'] = '组织不存在 / Organization does not exist';
    }

    const roleIds = arrayOf(payload['roles']);
    if (roleIds.some((roleId) => !this.state.roles.some((role) => role.id === roleId))) {
      errors['roles'] = '角色不存在 / Role does not exist';
    }
    if (roleIds.includes('super') && !this.isSuper(actor)) {
      errors['roles'] = '只有超级管理员可以授予 super 角色 / Only super may grant super';
    }

    if (Object.keys(errors).length > 0) {
      return { code: 40002, message: '参数校验失败 / Validation failed', data: errors };
    }
    return null;
  }

  private handleRoles(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
  ): MockReply | null {
    if (path === '/system/roles') {
      if (method === 'GET') {
        const id = trim(request.params.get('id'));
        const name = trim(request.params.get('name'));
        const status = text(request.params.get('status'));
        const sort = trim(request.params.get('sort')) || 'createTime';
        const direction = request.params.get('direction') === 'desc' ? -1 : 1;
        let rows = this.state.roles.filter((role) => {
          if (id && !role.id.includes(id)) return false;
          if (name && !role.name.includes(name)) return false;
          if (status && status !== 'all' && role.status !== status) return false;
          return true;
        });
        rows = [...rows].sort((a, b) => {
          const left = text((a as unknown as Record<string, unknown>)[sort]);
          const right = text((b as unknown as Record<string, unknown>)[sort]);
          return left.localeCompare(right) * direction;
        });
        const result = paginate(
          rows,
          numberParam(request.params.get('page'), 1),
          numberParam(request.params.get('size'), 10),
        );
        return ok({ ...result, list: result.list.map((role) => ({ ...role })) });
      }

      if (method === 'POST') {
        const payload = bodyOf(request);
        const id = trim(payload['id']);
        const name = trim(payload['name']);
        if (!/^[A-Za-z0-9_-]{2,32}$/.test(id)) {
          return failure(40002, '角色编码无效 / Invalid role id', 400, {
            id: '角色编码需为2–32位字母、数字、下划线或连字符 / Invalid role id',
          });
        }
        if (name.length < 2) {
          return failure(40002, '角色名称过短 / Role name too short', 400, {
            name: '角色名称至少2个字符 / Role name needs 2+ characters',
          });
        }
        if (this.state.roles.some((role) => role.id === id)) {
          return failure(40901, '角色编码已存在 / Role id already exists', 409, {
            id: '角色编码已存在 / Role id already exists',
          });
        }
        this.state.roles.push({
          id,
          name,
          status: '1',
          permissions: arrayOf(payload['permissions']),
          createTime: new Date().toISOString(),
        });
        return ok(id);
      }

      if (method === 'DELETE') {
        const ids = trim(request.params.get('ids')).split(',').filter(Boolean);
        const referenced = ids.find((id) =>
          this.state.users.some((user) => user.roleIds.includes(id)),
        );
        if (referenced) {
          return failure(40901, '角色仍被用户引用，不能删除 / Role is referenced by a user', 409);
        }
        this.state.roles = this.state.roles.filter((role) => !ids.includes(role.id));
        return ok('ok');
      }
    }

    const match = path.match(/^\/system\/roles\/([^/]+)$/);
    if (match) {
      const role = this.state.roles.find((item) => item.id === match[1]);
      if (!role) return failure(40401, '角色不存在 / Role not found', 404);
      if (method === 'GET') return ok({ ...role });
      if (method === 'PATCH') {
        const payload = bodyOf(request);
        if (payload['name'] !== undefined) {
          const name = trim(payload['name']);
          if (name.length < 2) {
            return failure(40002, '角色名称过短 / Role name too short', 400, {
              name: '角色名称至少2个字符 / Role name needs 2+ characters',
            });
          }
          role.name = name;
        }
        if (payload['status'] !== undefined) {
          role.status = (trim(payload['status']) || role.status) as Role['status'];
        }
        if (Array.isArray(payload['permissions'])) {
          role.permissions = arrayOf(payload['permissions']);
        }
        return ok('ok');
      }
      if (method === 'DELETE') {
        if (this.state.users.some((user) => user.roleIds.includes(role.id))) {
          return failure(40901, '角色仍被用户引用，不能删除 / Role is referenced by a user', 409);
        }
        this.state.roles = this.state.roles.filter((item) => item.id !== role.id);
        return ok('ok');
      }
    }

    return null;
  }

  private handleGroups(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
  ): MockReply | null {
    if (path === '/system/groups') {
      if (method === 'GET') {
        const code = trim(request.params.get('id'));
        const name = trim(request.params.get('name'));
        const status = text(request.params.get('status'));
        const textFilter = Boolean(code || name);
        let matched = this.state.groups.filter((group) => {
          if (code && !group.id.includes(code)) return false;
          if (name && !group.name.includes(name)) return false;
          if (status && status !== 'all' && group.status !== status) return false;
          return true;
        });
        if (textFilter) matched = withAncestors(this.state.groups, matched);
        const rows = [...matched].sort((a, b) => a.id.localeCompare(b.id));
        return ok(rows.map((group) => ({ ...group })));
      }

      if (method === 'DELETE') {
        const ids = trim(request.params.get('ids')).split(',').filter(Boolean);
        const all = ids.flatMap((id) => descendantIds(this.state.groups, id));
        if (this.state.users.some((user) => all.includes(user.groupId))) {
          return failure(40901, '组织（或其子组织）下仍有用户 / Group still has users', 409);
        }
        this.state.groups = this.state.groups.filter((group) => !all.includes(group.id));
        return ok('ok');
      }
    }

    if (path === '/system/groups/children' && method === 'POST') {
      const payload = bodyOf(request);
      const id = trim(payload['id']);
      const name = trim(payload['name']);
      const parentId = trim(payload['parentId']) || null;
      const issue = codeIssue('group', id, parentId);
      if (issue) return failure(40002, issue, 400, { id: issue });
      if (name.length < 2) {
        return failure(40002, '组织名称过短 / Group name too short', 400, {
          name: '组织名称至少2个字符 / Group name needs 2+ characters',
        });
      }
      if (parentId && !this.state.groups.some((group) => group.id === parentId)) {
        return failure(40002, '上级组织不存在 / Parent group not found', 400, {
          parentId: '上级组织不存在 / Parent group not found',
        });
      }
      if (this.state.groups.some((group) => group.id === id)) {
        return failure(40901, '组织编码已存在 / Group code already exists', 409, {
          id: '组织编码已存在 / Group code already exists',
        });
      }
      this.state.groups.push({
        id,
        name,
        status: '1',
        parentId,
        createTime: new Date().toISOString(),
      });
      return ok('ok');
    }

    const statusMatch = path.match(/^\/system\/groups\/([^/]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const group = this.state.groups.find((item) => item.id === statusMatch[1]);
      if (!group) return failure(40401, '组织不存在 / Group not found', 404);
      const status = trim(bodyOf(request)['status']);
      if (status === '0') {
        const descendants = descendantIds(this.state.groups, group.id).filter(
          (id) => id !== group.id,
        );
        if (
          this.state.groups.some((item) => descendants.includes(item.id) && item.status === '1')
        ) {
          return failure(40901, '请先停用全部子组织 / Disable descendants first', 409);
        }
      }
      group.status = status === '1' ? '1' : '0';
      return ok('ok');
    }

    const match = path.match(/^\/system\/groups\/([^/]+)$/);
    if (match) {
      const group = this.state.groups.find((item) => item.id === match[1]);
      if (!group) return failure(40401, '组织不存在 / Group not found', 404);
      if (method === 'GET') return ok({ ...group });
      if (method === 'PATCH') {
        const payload = bodyOf(request);
        const name = trim(payload['name']);
        if (name.length < 2) {
          return failure(40002, '组织名称过短 / Group name too short', 400, {
            name: '组织名称至少2个字符 / Group name needs 2+ characters',
          });
        }
        group.name = name;
        const status = trim(payload['status']);
        if (status) {
          if (status === '0') {
            const descendants = descendantIds(this.state.groups, group.id).filter(
              (id) => id !== group.id,
            );
            if (
              this.state.groups.some((item) => descendants.includes(item.id) && item.status === '1')
            ) {
              return failure(40901, '请先停用全部子组织 / Disable descendants first', 409);
            }
          }
          group.status = status as Group['status'];
        }
        return ok('ok');
      }
      if (method === 'DELETE') {
        const all = descendantIds(this.state.groups, group.id);
        if (this.state.users.some((user) => all.includes(user.groupId))) {
          return failure(40901, '组织（或其子组织）下仍有用户 / Group still has users', 409);
        }
        this.state.groups = this.state.groups.filter((item) => !all.includes(item.id));
        return ok('ok');
      }
    }

    return null;
  }

  private referencedPermission(permission: MockPermission): boolean {
    return (
      this.state.roles.some((role) => (role.permissions ?? []).includes(permission.id)) ||
      this.state.users.some((user) => user.permissionIds.includes(permission.id))
    );
  }

  private handlePermissions(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
  ): MockReply | null {
    const locale = localeOf(request);

    if (path === '/system/permissions') {
      if (method === 'GET') {
        const code = trim(request.params.get('id'));
        const name = trim(request.params.get('name'));
        const routePath = trim(request.params.get('path'));
        const status = text(request.params.get('status'));
        const type = text(request.params.get('type'));
        const textFilter = Boolean(code || name || routePath);
        let matched = this.state.permissions.filter((permission) => {
          if (code && !permission.id.includes(code)) return false;
          if (name && !localeName(permission, locale).includes(name)) return false;
          if (routePath && !permission.path.includes(routePath)) return false;
          if (status && status !== 'all' && permission.status !== status) return false;
          if (type && type !== 'all' && permission.type !== type) return false;
          return true;
        });
        if (textFilter) matched = withAncestors(this.state.permissions, matched);
        const rows = [...matched].sort((a, b) => a.id.localeCompare(b.id));
        return ok(rows.map((permission) => this.permissionDto(permission, locale)));
      }

      if (method === 'DELETE') {
        const ids = trim(request.params.get('ids')).split(',').filter(Boolean);
        const all = ids.flatMap((id) => descendantIds(this.state.permissions, id));
        const referenced = this.state.permissions.find(
          (permission) => all.includes(permission.id) && this.referencedPermission(permission),
        );
        if (referenced) {
          return failure(
            40901,
            '权限（或其子权限）仍被角色或用户引用 / Permission is referenced',
            409,
          );
        }
        this.state.permissions = this.state.permissions.filter(
          (permission) => !all.includes(permission.id),
        );
        return ok('ok');
      }
    }

    if (path === '/system/permissions/children' && method === 'POST') {
      const payload = bodyOf(request);
      const id = trim(payload['id']);
      const parentId = trim(payload['parentId']) || null;
      const issue = codeIssue('permission', id, parentId);
      if (issue) return failure(40002, issue, 400, { id: issue });
      if (this.state.permissions.some((permission) => permission.id === id)) {
        return failure(40901, '权限编码已存在 / Permission code already exists', 409, {
          id: '权限编码已存在 / Permission code already exists',
        });
      }
      if (parentId) {
        const parent = this.state.permissions.find((permission) => permission.id === parentId);
        if (!parent) {
          return failure(40002, '上级权限不存在 / Parent permission not found', 400, {
            parentId: '上级权限不存在 / Parent permission not found',
          });
        }
        if (parent.type === 'action') {
          return failure(40901, '操作类型不能有子权限 / Action cannot have children', 409);
        }
      }
      const name = trim(payload['name']);
      const entry: MockPermission = {
        id,
        name,
        translations:
          (payload['translations'] as Record<string, string> | undefined) ?? {
            [locale]: name,
          },
        path: trim(payload['path']),
        action: trim(payload['action']) || null,
        type: trim(payload['type']) as PermissionRow['type'],
        status: '1',
        parentId,
        createTime: new Date().toISOString(),
      };
      if (entry.name.length < 2) {
        return failure(40002, '名称过短 / Name too short', 400, {
          name: '名称至少2个字符 / Name needs 2+ characters',
        });
      }
      const invalid = validatePermission(entry, null, this.state.permissions);
      if (invalid) return invalid;
      this.state.permissions.push(entry);
      return ok(this.permissionDto(entry, locale));
    }

    const match = path.match(/^\/system\/permissions\/([^/]+)$/);
    if (match) {
      const permission = this.state.permissions.find((item) => item.id === match[1]);
      if (!permission) return failure(40401, '权限不存在 / Permission not found', 404);
      if (method === 'GET') return ok(this.permissionDto(permission, locale));
      if (method === 'PATCH') {
        const payload = bodyOf(request);
        const next: MockPermission = {
          ...permission,
          name: payload['name'] !== undefined ? trim(payload['name']) : permission.name,
          translations:
            payload['translations'] !== undefined
              ? (payload['translations'] as Record<string, string>)
              : permission.translations,
          path: payload['path'] !== undefined ? trim(payload['path']) : permission.path,
          action:
            payload['action'] !== undefined ? trim(payload['action']) || null : permission.action,
          type:
            payload['type'] !== undefined
              ? (trim(payload['type']) as PermissionRow['type'])
              : permission.type,
          status:
            payload['status'] !== undefined
              ? (trim(payload['status']) as PermissionRow['status'])
              : permission.status,
        };
        if (next.name.length < 2) {
          return failure(40002, '名称过短 / Name too short', 400, {
            name: '名称至少2个字符 / Name needs 2+ characters',
          });
        }
        const invalid = validatePermission(next, permission.id, this.state.permissions);
        if (invalid) return invalid;
        if (next.status === '0') {
          const descendants = descendantIds(this.state.permissions, permission.id).filter(
            (id) => id !== permission.id,
          );
          if (
            this.state.permissions.some(
              (item) => descendants.includes(item.id) && item.status === '1',
            )
          ) {
            return failure(40901, '请先停用全部子权限 / Disable descendants first', 409);
          }
        }
        if (
          next.type === 'action' &&
          this.state.permissions.some((item) => item.parentId === permission.id)
        ) {
          return failure(40901, '操作类型不能有子权限 / Action cannot have children', 409);
        }
        Object.assign(permission, next, { updateTime: new Date().toISOString() });
        return ok('ok');
      }
      if (method === 'DELETE') {
        const all = descendantIds(this.state.permissions, permission.id);
        if (
          this.state.permissions.some(
            (item) => all.includes(item.id) && this.referencedPermission(item),
          )
        ) {
          return failure(
            40901,
            '权限（或其子权限）仍被角色或用户引用 / Permission is referenced',
            409,
          );
        }
        this.state.permissions = this.state.permissions.filter((item) => !all.includes(item.id));
        return ok('ok');
      }
    }

    return null;
  }

  private handleLogs(
    method: string,
    path: string,
    request: HttpRequest<unknown>,
  ): MockReply | null {
    if (method !== 'GET' || path !== '/system/operation-logs') return null;
    const username = trim(request.params.get('username'));
    const routePath = trim(request.params.get('path'));
    const status = trim(request.params.get('status'));
    const from = trim(request.params.get('from'));
    const to = trim(request.params.get('to'));

    const rows = this.state.logs.filter((log) => {
      if (username && !log.username?.includes(username)) return false;
      if (routePath && !log.path.includes(routePath)) return false;
      if (status && String(log.status) !== status) return false;
      if (from && new Date(log.createTime).getTime() < new Date(from).getTime()) return false;
      if (to && new Date(log.createTime).getTime() > new Date(to).getTime()) return false;
      return true;
    });

    return ok(
      paginate(
        rows,
        numberParam(request.params.get('page'), 1),
        numberParam(request.params.get('size'), 10),
      ),
    );
  }

  private userDto(entry: MockUser): User {
    return {
      id: entry.id,
      name: entry.name,
      username: entry.username,
      email: entry.email,
      groupId: entry.groupId,
      groupName: this.groupNameOf(entry.groupId),
      phone: entry.phone,
      status: entry.status,
      createTime: entry.createTime,
      updateTime: entry.updateTime,
      roles: entry.roleIds.map((id) => ({
        id,
        name: this.state.roles.find((role) => role.id === id)?.name ?? id,
      })),
      permissions: [...entry.permissionIds],
    };
  }

  private userInfoOf(entry: MockUser, locale: Locale): UserInfo {
    const roles = entry.roleIds
      .map((id) => this.state.roles.find((role) => role.id === id))
      .filter((role): role is Role => Boolean(role))
      .filter((role) => role.status === '1');

    const permissionsOf = (ids: string[]) =>
      ids
        .map((id) => this.state.permissions.find((permission) => permission.id === id))
        .filter((permission): permission is MockPermission => Boolean(permission))
        .filter((permission) => permission.status === '1');

    return {
      id: entry.id,
      name: entry.name,
      username: entry.username,
      email: entry.email,
      groupId: entry.groupId,
      groupName: this.groupNameOf(entry.groupId),
      phone: entry.phone,
      status: entry.status,
      mustChangePassword: entry.mustChangePassword,
      roles: roles.map((role) => ({ id: role.id, name: role.name })),
      rolePermissions: roles.flatMap((role) =>
        permissionsOf(role.permissions ?? []).map((permission) => ({
          path: permission.path,
          role: role.id,
          type: permission.type,
          action: permission.action,
          name: localeName(permission, locale),
        })),
      ),
      userPermissions: permissionsOf(entry.permissionIds).map((permission) => ({
        path: permission.path,
        role: '',
        type: permission.type,
        action: permission.action,
        name: localeName(permission, locale),
      })),
    };
  }

  private permissionDto(permission: MockPermission, locale: Locale): PermissionRow {
    return {
      id: permission.id,
      name: localeName(permission, locale),
      translations: permission.translations ?? { zh: permission.name },
      path: permission.path,
      action: permission.action,
      type: permission.type,
      status: permission.status,
      parentId: permission.parentId,
      createTime: permission.createTime,
    };
  }

  private menuTree(locale: Locale): MenuNode[] {
    const rows = this.state.permissions
      .filter(
        (permission) =>
          permission.status === '1' &&
          (permission.type === 'menu' || permission.type === 'directory'),
      )
      .map<MenuNode>((permission) => ({
        id: permission.id,
        path: permission.path,
        type: permission.type,
        name: localeName(permission, locale),
        parentId: permission.parentId,
        children: [],
      }));

    return buildTree(
      rows,
      (node) => node.id,
      (node) => node.parentId,
    );
  }

  private recordLog(
    request: HttpRequest<unknown>,
    method: string,
    path: string,
    status: number,
    username: string,
    durationMs: number,
  ): void {
    if (method === 'GET' || method === 'OPTIONS') return;
    if (!path.startsWith('/system/') && !path.includes('/auth/change-password')) return;
    const sensitive = SENSITIVE_SEGMENTS.some((segment) => path.includes(segment));
    const rawBody = request.body ? JSON.stringify(request.body) : '';
    const redacted = rawBody
      .replace(/("(?:password|token|secret)"\s*:\s*")[^"]*(")/gi, '$1***$2')
      .slice(0, 4000);
    const log: OperationLog = {
      id: Date.now(),
      traceId: traceId(),
      username,
      method,
      path: `/api/v1${path}`,
      queryString: request.params.toString().slice(0, 500),
      requestBody: sensitive ? '' : redacted,
      status,
      durationMs,
      ip: '127.0.0.1',
      createTime: new Date().toISOString(),
    };
    this.state.logs.unshift(log);
    this.state.logs = this.state.logs.slice(0, 500);
  }
}

interface RequiredPermission {
  path: string;
  action: 'view' | 'add' | 'edit' | 'delete';
}

function requiredPermission(method: string, path: string): RequiredPermission | null {
  const known = [
    { prefix: '/system/users', path: '/system/user' },
    { prefix: '/system/roles', path: '/system/role' },
    { prefix: '/system/groups', path: '/system/group' },
    { prefix: '/system/permissions', path: '/system/permission' },
    { prefix: '/system/operation-logs', path: '/system/operation-log' },
  ].find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`));
  if (!known) return null;
  const action =
    method === 'GET' ? 'view' : method === 'POST' ? 'add' : method === 'DELETE' ? 'delete' : 'edit';
  return { path: known.path, action };
}

function localeOf(request: HttpRequest<unknown>): Locale {
  return (request.headers.get('Locale') ?? '').toLowerCase().startsWith('en') ? 'en' : 'zh';
}

function bodyOf(request: HttpRequest<unknown>): Json {
  return request.body && typeof request.body === 'object' ? (request.body as Json) : {};
}

function arrayOf(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function validatePermission(
  entry: MockPermission,
  id: string | null,
  permissions: MockPermission[],
): MockReply | null {
  const type = entry.type;
  const path = entry.path;
  const action = entry.action ?? '';
  if (!['menu', 'action', 'directory'].includes(type)) {
    return failure(40002, '类型无效 / Invalid type', 400, {
      type: '类型无效 / Invalid type',
    });
  }
  if (path.length < 2 || !/^[A-Za-z0-9/_-]+$/.test(path)) {
    return failure(40002, '路径无效 / Invalid path', 400, {
      path: '路径无效 / Invalid path',
    });
  }
  if (type === 'action' && !action) {
    return failure(40002, '操作类型必须填写 action / action is required for type action', 400, {
      action: '请填写操作名称 / Action is required',
    });
  }
  if (type !== 'action' && action) {
    return failure(40002, '非操作类型不能填写 action / action is forbidden here', 400, {
      action: '该类型不能填写操作名称 / Action is forbidden',
    });
  }
  const duplicate = permissions.some(
    (permission) =>
      permission.id !== id &&
      permission.type === type &&
      permission.path === path &&
      (permission.action ?? '') === action,
  );
  if (duplicate) {
    return failure(40901, '权限已存在 / Permission already exists', 409);
  }
  return null;
}
