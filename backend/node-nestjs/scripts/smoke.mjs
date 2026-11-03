/**
 * End-to-end smoke test against a running PostgreSQL-backed instance.
 *
 *   1. load database/postgres/ddl.sql + dml.sql
 *   2. start the API (pnpm start:prod)
 *   3. node scripts/smoke.mjs
 *
 * The script creates a few temporary rows and deletes them again. It exits
 * non-zero on the first failed assertion summary.
 */
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000/api/v1';

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` -> ${JSON.stringify(detail)}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

function cookieOf(response, name) {
  for (const value of response.headers.getSetCookie?.() ?? []) {
    const [pair] = value.split(';');
    const [key, ...rest] = pair.split('=');
    if (key.trim() === name) {
      return rest.join('=');
    }
  }
  return null;
}

async function call(method, path, options = {}) {
  const headers = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.cookie) {
    headers.Cookie = `refresh_token=${options.cookie}`;
  }
  if (options.forwardedFor) {
    headers['X-Forwarded-For'] = options.forwardedFor;
  }
  if (options.traceId) {
    headers['X-Trace-Id'] = options.traceId;
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

function isEnvelope(body) {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.code === 'number' &&
    typeof body.message === 'string' &&
    'data' in body &&
    typeof body.timestamp === 'number' &&
    typeof body.traceId === 'string'
  );
}

async function main() {
  const suffix = Date.now().toString(36).slice(-6);
  const smokeUsername = `smoke_${suffix}`;
  const smokePassword = 'SmokePass123';
  const smokeGroup = '0099';
  const smokeRole = `smoke-${suffix}`;
  const created = { user: false, group: false, role: false };
  let superId = '';

  console.log(`Smoke testing ${BASE}`);

  // 1. Unauthenticated request
  {
    const response = await call('GET', '/system/users');
    check('unauthenticated -> HTTP 401', response.status === 401, response.status);
    check('unauthenticated -> envelope', isEnvelope(response.body), response.body);
    check('unauthenticated -> business code 40101', response.body?.code === 40101, response.body?.code);
    check(
      'unauthenticated -> X-Trace-Id header matches body',
      response.headers.get('x-trace-id') === response.body?.traceId,
      { header: response.headers.get('x-trace-id'), body: response.body?.traceId },
    );
  }

  // 2. Bad credentials
  {
    const response = await call('POST', '/auth/login', {
      body: { username: 'user', password: 'definitely-wrong' },
    });
    check('wrong password -> HTTP 401', response.status === 401, response.status);
    check('wrong password -> 40101', response.body?.code === 40101, response.body?.code);
  }

  // 3. Login as super (seed password equals the username)
  const login = await call('POST', '/auth/login', {
    body: { username: 'super', password: 'super' },
  });
  const superToken = login.body?.data?.token;
  const superRefresh = cookieOf(login, 'refresh_token');
  check('login super -> 200', login.status === 200, login.body);
  check('login super -> access token', typeof superToken === 'string' && superToken.length > 20);
  check('login super -> refresh cookie', !!superRefresh);
  check(
    'login super -> refresh cookie is HttpOnly',
    (login.headers.getSetCookie?.() ?? []).some(
      (value) => value.startsWith('refresh_token=') && value.toLowerCase().includes('httponly'),
    ),
    login.headers.getSetCookie?.(),
  );
  check('login super -> expiresIn', typeof login.body?.data?.expiresIn === 'number', login.body?.data);

  // 4. user-info
  {
    const response = await call('GET', '/auth/user-info', { token: superToken });
    superId = response.body?.data?.id ?? '';
    check('user-info -> 200', response.status === 200, response.body);
    check('user-info -> username super', response.body?.data?.username === 'super', response.body?.data);
    check(
      'user-info -> roles include super',
      (response.body?.data?.roles ?? []).some((role) => role.id === 'super'),
      response.body?.data?.roles,
    );
    check(
      'user-info -> mustChangePassword false',
      response.body?.data?.mustChangePassword === false,
      response.body?.data?.mustChangePassword,
    );
    check(
      'user-info -> rolePermissions array',
      Array.isArray(response.body?.data?.rolePermissions),
      response.body?.data?.rolePermissions,
    );
  }

  // 5. menus
  {
    const response = await call('GET', '/auth/menus', { token: superToken });
    const tree = response.body?.data;
    const flat = [];
    const walk = (nodes) => {
      for (const node of nodes ?? []) {
        flat.push(node);
        walk(node.children);
      }
    };
    walk(tree);
    check('menus -> 200 array', response.status === 200 && Array.isArray(tree), response.body);
    check('menus -> non-empty', flat.length > 0, flat.length);
    check(
      'menus -> only menu/directory and enabled',
      flat.every((node) => node.type === 'menu' || node.type === 'directory'),
      flat.filter((node) => node.type !== 'menu' && node.type !== 'directory').slice(0, 3),
    );
    check(
      'menus -> ordered by code',
      flat.map((node) => node.id).join(',') === [...flat.map((node) => node.id)].sort().join(','),
      flat.map((node) => node.id).slice(0, 5),
    );
  }

  // 6. Refresh rotation
  {
    const first = await call('POST', '/auth/refresh', { cookie: superRefresh });
    const rotated = cookieOf(first, 'refresh_token');
    check('refresh -> 200', first.status === 200 && !!first.body?.data?.token, first.body);
    check('refresh -> new cookie', !!rotated && rotated !== superRefresh);

    const replay = await call('POST', '/auth/refresh', { cookie: superRefresh });
    check('refresh replay -> 401', replay.status === 401, replay.status);

    const usable = await call('GET', '/auth/user-info', { token: first.body?.data?.token });
    check('refreshed access token works', usable.status === 200, usable.status);
  }

  // 7. One list endpoint per resource
  for (const [path, shape] of [
    ['/system/users?page=1&size=5', 'page'],
    ['/system/roles?page=1&size=5', 'page'],
    ['/system/groups', 'array'],
    ['/system/permissions', 'array'],
    ['/system/operation-logs?page=1&size=5', 'page'],
  ]) {
    const response = await call('GET', path, { token: superToken });
    const data = response.body?.data;
    const valid = shape === 'page' ? Array.isArray(data?.list) && typeof data.total === 'number' : Array.isArray(data);
    check(`list ${path} -> 200`, response.status === 200, response.body);
    check(`list ${path} -> shape`, valid, data);
  }

  // 8. Unauthorized call -> 403
  const lowLogin = await call('POST', '/auth/login', { body: { username: 'user', password: 'user' } });
  const lowToken = lowLogin.body?.data?.token;
  const lowRefresh = cookieOf(lowLogin, 'refresh_token');
  check('login user -> 200', lowLogin.status === 200, lowLogin.body);
  {
    const response = await call('GET', '/system/users', { token: lowToken });
    check('user without authority -> 403', response.status === 403, response.status);
    check('user without authority -> 40301', response.body?.code === 40301, response.body?.code);
  }

  try {
    // 9. Group code policy and delete guards
    {
      const createdGroup = await call('POST', '/system/groups/children', {
        token: superToken,
        body: { id: smokeGroup, name: 'Smoke Group', parentId: '00' },
      });
      check('create group -> 200', createdGroup.status === 200, createdGroup.body);
      created.group = createdGroup.status === 200;

      const patched = await call('PATCH', `/system/groups/${smokeGroup}`, {
        token: superToken,
        body: { name: 'Smoke Group 2' },
      });
      check('edit group -> 200', patched.status === 200, patched.body);

      const detail = await call('GET', `/system/groups/${smokeGroup}`, { token: superToken });
      check('group detail -> new name', detail.body?.data?.name === 'Smoke Group 2', detail.body);

      const invalid = await call('POST', '/system/groups/children', {
        token: superToken,
        body: { id: '0', name: 'Bad', parentId: null },
      });
      check('invalid group code -> 400xx', invalid.status === 400, invalid.body);

      const disableRoot = await call('PATCH', '/system/groups/00/status', {
        token: superToken,
        body: { status: '0' },
      });
      check('disable parent with enabled children -> 400', disableRoot.status === 400, disableRoot.body);

      const referenced = await call('DELETE', '/system/groups/0001', { token: superToken });
      check('delete group with users -> 409', referenced.status === 409, referenced.body);
    }

    // 10. Permission identity uniqueness
    {
      const duplicate = await call('POST', '/system/permissions/children', {
        token: superToken,
        body: { id: '000598', name: 'Dup', path: '/system/user', type: 'menu', parentId: '0005' },
      });
      check('duplicate permission identity -> 409', duplicate.status === 409, duplicate.body);
    }

    // 10b. Permission CRUD
    {
      const createdPermission = await call('POST', '/system/permissions/children', {
        token: superToken,
        body: {
          id: '000599',
          name: 'Smoke Page',
          path: '/smoke/page',
          type: 'menu',
          parentId: '0005',
        },
      });
      check('create permission -> 200', createdPermission.status === 200, createdPermission.body);

      const patched = await call('PATCH', '/system/permissions/000599', {
        token: superToken,
        body: { name: 'Smoke Page 2', path: '/smoke/page2' },
      });
      check('edit permission -> 200', patched.status === 200, patched.body);

      const detail = await call('GET', '/system/permissions/000599', { token: superToken });
      check(
        'permission detail -> updated path',
        detail.body?.data?.path === '/smoke/page2',
        detail.body,
      );

      const referenced = await call('DELETE', '/system/permissions/000500', { token: superToken });
      check('delete referenced permission -> 409', referenced.status === 409, referenced.body);

      const removed = await call('DELETE', '/system/permissions/000599', { token: superToken });
      check('delete permission -> 200', removed.status === 200, removed.body);
    }

    // 11. Role CRUD
    {
      const createdRole = await call('POST', '/system/roles', {
        token: superToken,
        body: { id: smokeRole, name: 'Smoke Role', permissions: [] },
      });
      check('create role -> 200', createdRole.status === 200, createdRole.body);
      created.role = createdRole.status === 200;

      const patched = await call('PATCH', `/system/roles/${smokeRole}`, {
        token: superToken,
        body: { name: 'Smoke Role 2', status: '0' },
      });
      check('edit role -> 200', patched.status === 200, patched.body);

      const detail = await call('GET', `/system/roles/${smokeRole}`, { token: superToken });
      check(
        'role detail -> updated fields',
        detail.body?.data?.id === smokeRole &&
          detail.body?.data?.name === 'Smoke Role 2' &&
          detail.body?.data?.status === '0',
        detail.body,
      );

      const referenced = await call('DELETE', '/system/roles/admin', { token: superToken });
      check('delete role referenced by users -> 409', referenced.status === 409, referenced.body);

      await call('PATCH', `/system/roles/${smokeRole}`, {
        token: superToken,
        body: { status: '1' },
      });
    }

    // 12. User CRUD + forced password change
    {
      const createdUser = await call('POST', '/system/users', {
        token: superToken,
        body: {
          name: 'Smoke User',
          username: smokeUsername,
          email: `${smokeUsername}@example.com`,
          groupId: '00',
          phone: '13800000099',
          roles: ['user'],
        },
      });
      const tempPassword = createdUser.body?.data;
      check('create user -> 200', createdUser.status === 200, createdUser.body);
      check('create user -> 12-char temp password', typeof tempPassword === 'string' && tempPassword.length === 12, tempPassword);
      created.user = createdUser.status === 200;

      if (created.user) {
        const tempLogin = await call('POST', '/auth/login', {
          body: { username: smokeUsername, password: tempPassword },
        });
        const tempToken = tempLogin.body?.data?.token;
        check('temp password login -> 200', tempLogin.status === 200, tempLogin.body);

        const blocked = await call('GET', '/system/users', { token: tempToken });
        check('must change password -> 40302', blocked.status === 403 && blocked.body?.code === 40302, blocked.body);

        const info = await call('GET', '/auth/user-info', { token: tempToken });
        check('must change password -> user-info allowed', info.status === 200 && info.body?.data?.mustChangePassword === true, info.body);

        const changed = await call('POST', '/auth/change-password', {
          token: tempToken,
          body: { oldPassword: tempPassword, newPassword: smokePassword },
        });
        check('change-password -> 200', changed.status === 200, changed.body);
        check('change-password -> message', changed.body?.message === '密码已修改，请重新登录', changed.body?.message);

        const oldToken = await call('GET', '/auth/user-info', { token: tempToken });
        check('change-password revokes old token -> 401', oldToken.status === 401, oldToken.status);

        const relogin = await call('POST', '/auth/login', {
          body: { username: smokeUsername, password: smokePassword },
        });
        check('relogin with new password -> 200', relogin.status === 200, relogin.body);

        const found = await call(
          'GET',
          `/system/users?keyword=${smokeUsername}&page=1&size=10`,
          { token: superToken },
        );
        const userId = found.body?.data?.list?.[0]?.id;

        const edited = await call('PATCH', `/system/users/${userId}`, {
          token: superToken,
          body: { name: 'Smoke User 2', email: `${smokeUsername}+2@example.com` },
        });
        check('edit user -> 200', edited.status === 200, edited.body);

        const detail = await call('GET', `/system/users/${userId}`, { token: superToken });
        check(
          'user detail -> updated name',
          detail.body?.data?.name === 'Smoke User 2',
          detail.body?.data,
        );
        check(
          'user detail -> roles loaded',
          (detail.body?.data?.roles ?? []).some((role) => role.id === 'user'),
          detail.body?.data?.roles,
        );

        const disabled = await call('PATCH', `/system/users/${userId}/status`, {
          token: superToken,
          body: { status: '0' },
        });
        check('disable user -> 200', disabled.status === 200, disabled.body);
        const enabled = await call('PATCH', `/system/users/${userId}/status`, {
          token: superToken,
          body: { status: '1' },
        });
        check('enable user -> 200', enabled.status === 200, enabled.body);

        const reset = await call('POST', `/system/users/${userId}/reset-password`, {
          token: superToken,
        });
        check(
          'reset password -> 12-char temp password',
          reset.status === 200 && typeof reset.body?.data === 'string' && reset.body.data.length === 12,
          reset.body,
        );

        const selfDisable = await call('PATCH', `/system/users/${superId}/status`, {
          token: superToken,
          body: { status: '0' },
        });
        check('disable self -> 400', selfDisable.status === 400, selfDisable.body);

        const lastSuper = await call('DELETE', `/system/users/${superId}`, { token: superToken });
        check('delete last super -> 400', lastSuper.status === 400, lastSuper.body);
      }
    }

    // 13. Operation log recorded the writes
    await new Promise((resolve) => setTimeout(resolve, 500));
    {
      const logs = await call('GET', '/system/operation-logs?path=/system/users&page=1&size=10', {
        token: superToken,
      });
      const entries = logs.body?.data?.list ?? [];
      check('operation log -> 200', logs.status === 200, logs.body);
      check('operation log -> has entries', entries.length > 0, entries.length);
      check(
        'operation log -> stored POST /system/users',
        entries.some((entry) => entry.method === 'POST' && entry.path === '/api/v1/system/users'),
        entries.slice(0, 2),
      );
      check(
        'operation log -> request body redacted',
        entries.every((entry) => !entry.requestBody || !entry.requestBody.includes('SmokePass123')),
        entries.map((entry) => entry.requestBody).slice(0, 2),
      );
    }

    // 14. Logout revokes the access token
    {
      const logout = await call('POST', '/auth/logout', { token: lowToken, cookie: lowRefresh });
      check('logout -> 200', logout.status === 200, logout.body);
      const after = await call('GET', '/auth/user-info', { token: lowToken });
      check('logout revokes access token -> 401', after.status === 401, after.status);
    }

    // 15. Login lockout (isolated IP so repeated smoke runs cannot lock the host)
    {
      const lockIp = `198.51.100.${(Number.parseInt(suffix, 36) % 200) + 1}`;
      const lockUsername = `lock_${suffix}`;
      let last;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        last = await call('POST', '/auth/login', {
          body: { username: lockUsername, password: 'wrong-password' },
          forwardedFor: lockIp,
        });
      }
      check('fifth failure -> 401', last.status === 401, last.body);

      const blocked = await call('POST', '/auth/login', {
        body: { username: lockUsername, password: 'wrong-password' },
        forwardedFor: lockIp,
      });
      check(
        'sixth attempt -> 429 lockout',
        blocked.status === 429 && blocked.body?.code === 429,
        blocked.body,
      );
    }
  } finally {
    // Cleanup with a fresh super token in case the original was invalidated.
    const fresh = await call('POST', '/auth/login', { body: { username: 'super', password: 'super' } });
    const token = fresh.body?.data?.token;
    if (created.user) {
      const list = await call('GET', `/system/users?keyword=${smokeUsername}&page=1&size=10`, { token });
      const ids = (list.body?.data?.list ?? []).map((user) => user.id);
      if (ids.length > 0) {
        await call('DELETE', `/system/users?ids=${ids.join(',')}`, { token });
      }
    }
    if (created.role) {
      await call('DELETE', `/system/roles/${smokeRole}`, { token });
    }
    if (created.group) {
      await call('DELETE', `/system/groups/${smokeGroup}`, { token });
    }
  }

  console.log(`\n${passed} checks passed, ${failures.length} failed`);
  if (failures.length > 0) {
    console.error(failures.map((failure) => ` - ${failure}`).join('\n'));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
