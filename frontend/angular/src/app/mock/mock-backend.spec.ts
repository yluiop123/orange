import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { MockBackend } from './mock-backend';

function request(
  method: string,
  path: string,
  options: { body?: unknown; locale?: string; params?: Record<string, string> } = {},
): HttpRequest<unknown> {
  return new HttpRequest(method, `/api/v1${path}`, options.body ?? null, {
    headers: new HttpHeaders({
      Authorization: 'Bearer mock-access-token',
      Locale: options.locale ?? 'zh',
    }),
    params: new HttpParams({ fromObject: options.params ?? {} }),
  });
}

function login(backend: MockBackend, username: string): void {
  const result = backend.login(username, username, 'zh');
  expect(result.code).toBe(200);
}

describe('MockBackend', () => {
  let backend: MockBackend;

  beforeEach(() => {
    localStorage.clear();
    backend = new MockBackend();
  });

  it('accepts the seeded super account', () => {
    expect(backend.login('super', 'super', 'zh').data.token).toBe('mock-access-token');
    expect(backend.login('super', 'wrong', 'zh').code).toBe(40101);
  });

  it('refreshes the current mock session', () => {
    login(backend, 'super');
    expect(backend.refresh()?.data.token).toBe('mock-access-token');
  });

  it('localizes menus from the Locale header', () => {
    login(backend, 'super');
    const zh = backend.handle(request('GET', '/auth/menus')).body;
    const en = backend.handle(request('GET', '/auth/menus', { locale: 'en' })).body;
    expect(JSON.stringify(zh.data)).toContain('仪表盘');
    expect(JSON.stringify(en.data)).toContain('Dashboard');
    expect(JSON.stringify(en.data)).toContain('Users');
  });

  it('returns 403 when the actor lacks the action permission', () => {
    login(backend, 'user');
    expect(backend.handle(request('GET', '/system/users')).status).toBe(403);
  });

  it('returns 40302 while a temporary password is pending', () => {
    login(backend, 'newbie');
    const reply = backend.handle(request('GET', '/system/users'));
    expect(reply.status).toBe(403);
    expect(reply.body.code).toBe(40302);
  });

  it('refuses to disable the signed-in account', () => {
    login(backend, 'super');
    const reply = backend.handle(
      request('PATCH', '/system/users/u-super/status', { body: { status: '0' } }),
    );
    expect(reply.status).toBe(409);
    expect(reply.body.message).toContain('Cannot disable yourself');
  });

  it('lists paged users and operation logs', () => {
    login(backend, 'super');
    const users = backend.handle(
      request('GET', '/system/users', { params: { page: '1', size: '10' } }),
    );
    expect(users.status).toBe(200);
    const logs = backend.handle(
      request('GET', '/system/operation-logs', { params: { page: '1', size: '5' } }),
    );
    expect(logs.status).toBe(200);
    expect((logs.body.data as { list: unknown[] }).list.length).toBe(5);
  });
});
