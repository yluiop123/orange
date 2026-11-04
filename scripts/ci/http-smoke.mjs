/**
 * Cross-stack HTTP smoke test used by CI.
 *
 * Usage: node scripts/ci/http-smoke.mjs http://127.0.0.1:8080/api/v1
 *
 * Every backend exposes the same envelope and the same 34 endpoints, so this
 * script runs unchanged against Spring, Go, NestJS, C#, Rust and FastAPI.
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/$/, '');

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

async function request(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json', Locale: 'zh' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

async function waitForLogin() {
  const deadline = Date.now() + 90_000;
  let last;
  while (Date.now() < deadline) {
    try {
      const response = await request('POST', '/auth/login', {
        body: { username: 'super', password: 'super' },
      });
      if (response.status === 200 && response.json?.data?.token) return response;
      last = response;
    } catch (error) {
      last = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`backend did not become ready: ${JSON.stringify(last)}`);
}

const login = await waitForLogin();
check('login returns envelope and token', login.json?.code === 200 && Boolean(login.json?.data?.token), login.json);
const token = login.json.data.token;

const userInfo = await request('GET', '/auth/user-info', { token });
check('user-info returns super', userInfo.json?.data?.username === 'super', userInfo.json);

const menus = await request('GET', '/auth/menus', { token });
check('menus non-empty', Array.isArray(menus.json?.data) && menus.json.data.length > 0, menus.json);

const users = await request('GET', '/system/users?page=1&size=10', { token });
check(
  'users list non-empty',
  Array.isArray(users.json?.data?.list) && users.json.data.list.length > 0,
  users.json,
);

const unique = String(10 + (Number(String(Date.now()).slice(-2)) % 89)).padStart(2, '0');
const group = { id: unique, name: `CI组织${unique}`, parentId: null };
const created = await request('POST', '/system/groups/children', { token, body: group });
check('group created', created.status === 200 && created.json?.code === 200, created.json);

const groups = await request('GET', `/system/groups?name=${encodeURIComponent(group.name)}`, { token });
const rows = groups.json?.data;
const found = Array.isArray(rows) ? rows.some((row) => row.id === group.id) : rows?.list?.some?.((row) => row.id === group.id);
check('created group is listed', Boolean(found), groups.json);

const removed = await request('DELETE', `/system/groups?ids=${group.id}`, { token });
check('group deleted', removed.status === 200 && removed.json?.code === 200, removed.json);

const logs = await request('GET', '/system/operation-logs?page=1&size=10', { token });
check(
  'operation logs non-empty',
  Boolean(logs.json?.data) && Number(logs.json?.data?.total ?? logs.json?.data?.list?.length ?? 0) > 0,
  logs.json,
);

const logout = await request('POST', '/auth/logout', { token });
check('logout succeeds', logout.status === 200 && logout.json?.code === 200, logout.json);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
