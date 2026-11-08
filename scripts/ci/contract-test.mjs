/**
 * Cross-stack contract acceptance test.
 *
 * Usage: node scripts/ci/contract-test.mjs http://127.0.0.1:18080/api/v1
 *
 * It exercises the whole documented API (auth, users, roles, groups,
 * permissions, operation logs and error envelope) and asserts the same
 * observable behaviour from every backend. The database is mutated, so run it
 * against a disposable/fresh database.
 */
const base = (process.argv[2] || process.env.CONTRACT_BASE_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/$/, '');

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail === undefined ? '' : ` -> ${JSON.stringify(detail).slice(0, 600)}`}`);
    console.log(`  FAIL ${failures[failures.length - 1]}`);
  }
}

function field(data, key) {
  return data && typeof data === 'object' ? data[key] : undefined;
}

async function request(method, path, { token, body, cookie, headers: extraHeaders } = {}) {
  const headers = { Accept: 'application/json', Locale: 'zh', ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
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
  return { status: response.status, json, headers: response.headers };
}

function setCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const value = headers.get('set-cookie');
  return value ? [value] : [];
}

function refreshCookie(headers) {
  const row = setCookies(headers).find((item) => item.startsWith('refresh_token='));
  if (!row) return '';
  const raw = row.split(';', 1)[0].slice('refresh_token='.length).trim();
  const unquoted = raw.replace(/^"|"$/g, '');
  return unquoted ? row.split(';', 1)[0] : '';
}

function hasTraceHeader(response) {
  return Boolean(response.headers.get('x-trace-id'));
}

function tokenAlgorithm(token) {
  try {
    const header = JSON.parse(Buffer.from(String(token).split('.')[0], 'base64url').toString('utf8'));
    return header.alg;
  } catch {
    return null;
  }
}

function isEnvelope(json) {
  return json !== null
    && typeof json === 'object'
    && Number.isInteger(Number(json.code))
    && typeof json.message === 'string'
    && 'data' in json
    && 'traceId' in json;
}

async function login(username, password) {
  const response = await request('POST', '/auth/login', { body: { username, password } });
  return {
    response,
    token: field(field(response.json, 'data'), 'token'),
    cookie: refreshCookie(response.headers),
  };
}

function expectOk(name, response) {
  check(`${name}: HTTP 200`, response.status === 200, { status: response.status, body: response.json });
  check(`${name}: envelope code 200`, Number(field(response.json, 'code')) === 200, response.json);
  check(`${name}: trace header`, hasTraceHeader(response), 'missing X-Trace-Id');
  check(`${name}: body traceId`, typeof field(response.json, 'traceId') === 'string' && response.json.traceId.length > 0, response.json);
}

function expectStringPayload(name, response, expected) {
  expectOk(name, response);
  const data = field(response.json, 'data');
  check(`${name}: data is ${JSON.stringify(expected)}`, data === expected, data);
  check(
    `${name}: message mirrors data`,
    field(response.json, 'message') === expected,
    field(response.json, 'message'),
  );
}

function expectError(name, response, code) {
  check(`${name}: HTTP status matches code`, response.status === Number(String(code).slice(0, 3)), {
    status: response.status,
    code,
    body: response.json,
  });
  check(`${name}: envelope code ${code}`, Number(field(response.json, 'code')) === code, response.json);
  check(`${name}: trace header`, hasTraceHeader(response), 'missing X-Trace-Id');
  check(`${name}: body traceId`, typeof field(response.json, 'traceId') === 'string' && response.json.traceId.length > 0, response.json);
}

function todayRange(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { from: `${day}T00:00:00`, to: `${day}T23:59:59` };
}

const suffix = String(Date.now()).slice(-6);
const created = { users: [], roles: [], groups: [], permissions: [] };

console.log(`contract base: ${base}`);

async function waitForBackend() {
  const deadline = Date.now() + 120_000;
  let last = null;
  while (Date.now() < deadline) {
    try {
      const response = await request('POST', '/auth/login', {
        body: { username: 'super', password: 'super' },
      });
      if (response.status === 200 && field(field(response.json, 'data'), 'token')) return;
      last = response;
    } catch (error) {
      last = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`backend did not become ready: ${JSON.stringify(last)}`);
}

await waitForBackend();

// ---------------------------------------------------------------- auth basics
const anonymous = await request('GET', '/auth/user-info');
expectError('anonymous user-info', anonymous, 40101);

const badLogin = await login('super', 'definitely-wrong');
expectError('wrong password', badLogin.response, 40101);
check('wrong password clears refresh cookie', !refreshCookie(badLogin.response.headers), 'refresh cookie present');

const superLogin = await login('super', 'super');
expectOk('super login', superLogin.response);
let token = superLogin.token;
check('login returns access token', typeof token === 'string' && token.length > 20, token);
check('access token uses the shared RS256 algorithm', tokenAlgorithm(token) === 'RS256', tokenAlgorithm(token));

// Each backend must expose its own annotation-generated document and UI.
const docsBase = base.replace(/\/api\/v1$/, '');
const specResponse = await fetch(`${docsBase}/openapi.json`);
const specText = await specResponse.text();
let spec = null;
try {
  spec = JSON.parse(specText);
} catch {
  spec = null;
}
check(
  'generated OpenAPI is served',
  specResponse.status === 200 && spec !== null && Boolean(spec.openapi || spec.swagger),
  { status: specResponse.status, body: specText.slice(0, 200) },
);
const specPaths = Object.keys(field(spec, 'paths') ?? {});
check(
  'generated OpenAPI lists the auth login operation',
  specPaths.some((path) => path.endsWith('/auth/login')),
  specPaths.slice(0, 5),
);
check(
  'generated OpenAPI lists the menus operation',
  specPaths.some((path) => path.endsWith('/auth/menus')),
  specPaths.slice(0, 5),
);
const swaggerResponse = await fetch(`${docsBase}/swagger`);
check('Swagger UI is served', swaggerResponse.status === 200, swaggerResponse.status);
check('login returns expiresIn', Number(field(field(superLogin.response.json, 'data'), 'expiresIn')) > 0, superLogin.response.json);
check('login returns refreshExpiresIn', Number(field(field(superLogin.response.json, 'data'), 'refreshExpiresIn')) > 0, superLogin.response.json);
check('login sets HttpOnly refresh cookie', /refresh_token=/.test(superLogin.cookie), superLogin.cookie);

const userInfo = await request('GET', '/auth/user-info', { token });
expectOk('user-info', userInfo);
const info = field(userInfo.json, 'data');
check('user-info username', info?.username === 'super', info);
check('user-info has roles', Array.isArray(info?.roles) && info.roles.length > 0, info?.roles);
check('user-info has userPermissions', Array.isArray(info?.userPermissions), info?.userPermissions);
check('user-info has rolePermissions', Array.isArray(info?.rolePermissions), info?.rolePermissions);
check('user-info mustChangePassword false', info?.mustChangePassword === false, info?.mustChangePassword);

const menus = await request('GET', '/auth/menus', { token });
expectOk('menus', menus);
const menuTree = field(menus.json, 'data');
check('menus is a non-empty array', Array.isArray(menuTree) && menuTree.length > 0, menuTree);
check('menu node has id/name/path/children', Array.isArray(menuTree) && menuTree.every((node) => node && typeof node.id === 'string' && typeof node.name === 'string' && typeof node.path === 'string' && Array.isArray(node.children)), menuTree?.[0]);

// refresh rotation on an isolated session
const refreshLogin = await login('super', 'super');
const firstCookie = refreshLogin.cookie;
const refreshed = await request('POST', '/auth/refresh', { cookie: firstCookie });
expectOk('refresh', refreshed);
const refreshedToken = field(field(refreshed.json, 'data'), 'token');
const rotatedCookie = refreshCookie(refreshed.headers);
check('refresh returns a new token', typeof refreshedToken === 'string' && refreshedToken !== refreshLogin.token, refreshedToken);
check('refresh rotates the cookie', Boolean(rotatedCookie) && rotatedCookie !== firstCookie, rotatedCookie);
const replay = await request('POST', '/auth/refresh', { cookie: firstCookie });
expectError('refresh replay old cookie', replay, 40101);

// logout revokes the isolated token
const logoutLogin = await login('super', 'super');
const logout = await request('POST', '/auth/logout', { token: logoutLogin.token, cookie: logoutLogin.cookie });
expectOk('logout', logout);
const afterLogout = await request('GET', '/auth/user-info', { token: logoutLogin.token });
expectError('token revoked after logout', afterLogout, 40101);

// Logout bumps token_version, which invalidates every super session.
token = (await login('super', 'super')).token;

// --------------------------------------------------------------- query basics
const usersList = await request('GET', '/system/users?page=1&size=5', { token });
expectOk('users list', usersList);
const usersPage = field(usersList.json, 'data');
check('users page has total/list/page/size/totalPages', usersPage && Number.isInteger(usersPage.total) && Array.isArray(usersPage.list) && Number.isInteger(usersPage.page) && Number.isInteger(usersPage.size) && Number.isInteger(usersPage.totalPages), usersPage);
check('users page size honoured', usersPage?.size === 5 && usersPage?.list?.length <= 5, usersPage);
const superLookup = await request('GET', '/system/users?page=1&size=5&keyword=super', { token });
expectOk('users lookup super', superLookup);
const superRow = (field(superLookup.json, 'data')?.list ?? []).find((row) => row.username === 'super');
check('users row has documented fields', Boolean(superRow && superRow.id && superRow.name && superRow.username && superRow.email && superRow.groupId !== undefined && superRow.groupName !== undefined && superRow.phone !== undefined && superRow.status !== undefined && superRow.createTime), superRow);

const sorted = await request('GET', '/system/users?page=1&size=100&sort=username&direction=asc', { token });
expectOk('users sorted', sorted);
const usernames = (field(sorted.json, 'data')?.list ?? []).map((row) => row.username);
check('users sort asc by username', usernames.every((name, index) => index === 0 || usernames[index - 1] <= name), usernames.slice(0, 5));

const keyword = await request('GET', '/system/users?page=1&size=10&keyword=super', { token });
expectOk('users keyword filter', keyword);
check('users keyword matches super', (field(keyword.json, 'data')?.list ?? []).some((row) => row.username === 'super'), field(keyword.json, 'data'));

const missingUser = await request('GET', '/system/users/00000000-0000-0000-0000-000000000000', { token });
expectError('user not found', missingUser, 40401);

// ---------------------------------------------------------------- user CRUD
const username = `qa_${suffix}`;
const createUser = await request('POST', '/system/users', {
  token,
  body: {
    name: 'QA User',
    username,
    email: `qa_${suffix}@example.com`,
    groupId: '00',
    phone: '13912345678',
    roles: ['user'],
    permissions: [],
    status: '1',
  },
});
expectOk('create user', createUser);
const temporaryPassword = field(createUser.json, 'data');
check('create user returns 12-character temporary password', typeof temporaryPassword === 'string' && temporaryPassword.length === 12, temporaryPassword);

const createdUsers = await request('GET', `/system/users?page=1&size=10&keyword=${encodeURIComponent(username)}`, { token });
const newUser = (field(createdUsers.json, 'data')?.list ?? []).find((row) => row.username === username);
check('created user is listed', Boolean(newUser), field(createdUsers.json, 'data'));
if (newUser) created.users.push(newUser.id);

const duplicateUser = await request('POST', '/system/users', {
  token,
  body: { name: 'QA Duplicate', username, email: `dup_${suffix}@example.com`, groupId: '00', phone: '13912345679' },
});
expectError('duplicate username', duplicateUser, 40901);

const invalidUser = await request('POST', '/system/users', {
  token,
  body: { name: 'X', username: 'ab', email: 'bad', groupId: '', phone: '123' },
});
expectError('user validation', invalidUser, 40002);
check('validation failure has a message', typeof field(invalidUser.json, 'message') === 'string' && invalidUser.json.message.length > 0, invalidUser.json);

const editUser = await request('PATCH', `/system/users/${newUser.id}`, {
  token,
  body: { name: 'QA User Renamed', email: `qa_renamed_${suffix}@example.com`, phone: '13912345670' },
});
expectOk('edit user', editUser);
const editedUser = await request('GET', `/system/users/${newUser.id}`, { token });
check('edit user persisted', field(editedUser.json, 'data')?.name === 'QA User Renamed', field(editedUser.json, 'data'));

const disableUser = await request('PATCH', `/system/users/${newUser.id}/status`, { token, body: { status: '0' } });
expectOk('disable user', disableUser);
const disabledUsers = await request('GET', `/system/users?page=1&size=10&keyword=${encodeURIComponent(username)}&status=0`, { token });
check('disabled user appears in status=0', (field(disabledUsers.json, 'data')?.list ?? []).some((row) => row.id === newUser.id), field(disabledUsers.json, 'data'));
const enableUser = await request('PATCH', `/system/users/${newUser.id}/status`, { token, body: { status: '1' } });
expectOk('enable user', enableUser);

const reset = await request('POST', `/system/users/${newUser.id}/reset-password`, { token });
expectOk('reset password', reset);
const resetPassword = field(reset.json, 'data');
check('reset returns 12-character temporary password', typeof resetPassword === 'string' && resetPassword.length === 12, resetPassword);
check('reset response is not cacheable', /no-store/i.test(reset.headers.get('cache-control') ?? ''), reset.headers.get('cache-control'));

// temporary password login + forced password change
const tempLogin = await login(username, resetPassword);
expectOk('temporary password login', tempLogin.response);
const tempInfo = await request('GET', '/auth/user-info', { token: tempLogin.token });
check('temporary account must change password', field(tempInfo.json, 'data')?.mustChangePassword === true, field(tempInfo.json, 'data'));
const blocked = await request('GET', '/system/users?page=1&size=1', { token: tempLogin.token });
expectError('must-change-password blocks other endpoints', blocked, 40302);
const changed = await request('POST', '/auth/change-password', {
  token: tempLogin.token,
  body: { oldPassword: resetPassword, newPassword: 'QaPass1234' },
});
expectStringPayload('change password', changed, '密码已修改，请重新登录');
const newLogin = await login(username, 'QaPass1234');
expectOk('login with changed password', newLogin.response);
check('changed account no longer forced', field(field(newLogin.response.json, 'data'), 'status') === 'ok', newLogin.response.json);

// permission enforcement with the seeded limited account
const limitedLogin = await login('user', 'user');
expectOk('limited login', limitedLogin.response);
const limited = await request('POST', '/system/users', {
  token: limitedLogin.token,
  body: { name: 'No Access', username: 'no_access_1', email: 'no@example.com', groupId: '00', phone: '13912345671' },
});
expectError('limited account cannot create users', limited, 40301);
const limitedRead = await request('GET', '/system/roles?page=1&size=1', { token: limitedLogin.token });
expectError('limited account cannot list roles', limitedRead, 40301);
const unauthorizedInvalid = await request('POST', '/system/users', {
  token: limitedLogin.token,
  body: { name: 'X', username: 'ab', email: 'bad', groupId: '', phone: '123' },
});
expectError('authorization precedes DTO validation', unauthorizedInvalid, 40301);

// batch delete + self-delete guard
const batchNames = [`qa_a_${suffix}`, `qa_b_${suffix}`];
const batchIds = [];
for (const batchName of batchNames) {
  const response = await request('POST', '/system/users', {
    token,
    body: { name: 'QA Batch', username: batchName, email: `${batchName}@example.com`, groupId: '00', phone: '13912345672' },
  });
  expectOk(`create batch user ${batchName}`, response);
  const list = await request('GET', `/system/users?page=1&size=10&keyword=${encodeURIComponent(batchName)}`, { token });
  const row = (field(list.json, 'data')?.list ?? []).find((item) => item.username === batchName);
  if (row) batchIds.push(row.id);
}
check('batch users created', batchIds.length === 2, batchIds);
if (batchIds.length) {
  const batchDelete = await request('DELETE', `/system/users?ids=${batchIds.join(',')}`, { token });
  expectOk('batch delete users', batchDelete);
}
const deleteWithoutIds = await request('DELETE', '/system/users', { token });
expectError('delete without ids', deleteWithoutIds, 40001);
const selfDelete = await request('DELETE', `/system/users/${info.id}`, { token });
check('self delete rejected', Number(field(selfDelete.json, 'code')) !== 200, selfDelete.json);

// ----------------------------------------------------------------- role CRUD
const roleId = `qa_role_${suffix}`;
const createRole = await request('POST', '/system/roles', { token, body: { id: roleId, name: 'QA Role' } });
expectOk('create role', createRole);
created.roles.push(roleId);

const rolesList = await request('GET', '/system/roles?page=1&size=10&id=' + encodeURIComponent(roleId), { token });
expectOk('roles list', rolesList);
const rolePage = field(rolesList.json, 'data');
check('roles page shape', rolePage && Array.isArray(rolePage.list) && rolePage.list.some((row) => row.id === roleId), rolePage);

const roleDetail = await request('GET', `/system/roles/${roleId}`, { token });
expectOk('role detail', roleDetail);
check('role detail has permissions', Array.isArray(field(roleDetail.json, 'data')?.permissions), field(roleDetail.json, 'data'));

const editRole = await request('PATCH', `/system/roles/${roleId}`, { token, body: { name: 'QA Role Renamed', permissions: [] } });
expectOk('edit role', editRole);
const roleAfter = await request('GET', `/system/roles/${roleId}`, { token });
check('role rename persisted', field(roleAfter.json, 'data')?.name === 'QA Role Renamed', field(roleAfter.json, 'data'));

const duplicateRole = await request('POST', '/system/roles', { token, body: { id: roleId, name: 'QA Role' } });
expectError('duplicate role', duplicateRole, 40901);
const invalidRole = await request('POST', '/system/roles', { token, body: { id: '!', name: 'x' } });
expectError('role validation', invalidRole, 40002);

const deleteRole = await request('DELETE', `/system/roles/${roleId}`, { token });
expectOk('delete role', deleteRole);
const missingRole = await request('GET', `/system/roles/${roleId}`, { token });
expectError('deleted role is gone', missingRole, 40401);

// ---------------------------------------------------------------- group CRUD
const rootGroup = `9${String(Number(suffix.slice(-1)) + 0)}`.slice(0, 2);
const childGroup = `${rootGroup}01`;
const createGroup = await request('POST', '/system/groups/children', { token, body: { id: rootGroup, name: 'QA Group' } });
expectOk('create group', createGroup);
created.groups.push(rootGroup);
const createChild = await request('POST', '/system/groups/children', { token, body: { id: childGroup, name: 'QA Child', parentId: rootGroup } });
expectOk('create child group', createChild);
created.groups.push(childGroup);

const groupsList = await request('GET', '/system/groups', { token });
expectOk('groups list', groupsList);
const groupRows = field(groupsList.json, 'data');
check('groups list is an array', Array.isArray(groupRows), groupRows);
check('groups list includes created nodes', Array.isArray(groupRows) && groupRows.some((row) => row.id === rootGroup) && groupRows.some((row) => row.id === childGroup), groupRows?.slice(-3));

const groupDetail = await request('GET', `/system/groups/${rootGroup}`, { token });
expectOk('group detail', groupDetail);
check('group detail parent is null', field(groupDetail.json, 'data')?.parentId === null, field(groupDetail.json, 'data'));

const editGroup = await request('PATCH', `/system/groups/${rootGroup}`, { token, body: { name: 'QA Group Renamed' } });
expectStringPayload('edit group', editGroup, '操作成功');
const disableParent = await request('PATCH', `/system/groups/${rootGroup}/status`, { token, body: { status: '0' } });
expectError('disable parent with enabled child', disableParent, 40901);
const disableChild = await request('PATCH', `/system/groups/${childGroup}/status`, { token, body: { status: '0' } });
expectOk('disable child group', disableChild);
const disableParentAgain = await request('PATCH', `/system/groups/${rootGroup}/status`, { token, body: { status: '0' } });
expectOk('disable parent after child', disableParentAgain);
const enableParent = await request('PATCH', `/system/groups/${rootGroup}/status`, { token, body: { status: '1' } });
expectOk('enable parent group', enableParent);
const enableChild = await request('PATCH', `/system/groups/${childGroup}/status`, { token, body: { status: '1' } });
expectOk('enable child group', enableChild);

const duplicateGroup = await request('POST', '/system/groups/children', { token, body: { id: rootGroup, name: 'QA Duplicate' } });
expectError('duplicate group code', duplicateGroup, 40901);
const invalidGroup = await request('POST', '/system/groups/children', { token, body: { id: '123', name: 'QA Invalid' } });
expectError('group code validation', invalidGroup, 40002);

const deleteChild = await request('DELETE', `/system/groups/${childGroup}`, { token });
expectOk('delete child group', deleteChild);
const deleteRoot = await request('DELETE', `/system/groups/${rootGroup}`, { token });
expectOk('delete root group', deleteRoot);

// ---------------------------------------------------------- permission CRUD
const permRoot = `98${String(Number(suffix.slice(-1)) + 10)}`.slice(0, 2) + '00';
const permMenu = `${permRoot}00`;
const permAction = `${permMenu}01`;
const createPermRoot = await request('POST', '/system/permissions/children', {
  token,
  body: {
    id: permRoot,
    name: 'QA 目录',
    translations: { zh: 'QA 目录', en: 'QA Directory' },
    path: `/qa-${suffix}`,
    type: 'directory',
  },
});
expectOk('create permission directory', createPermRoot);
created.permissions.push(permRoot);
const createPermMenu = await request('POST', '/system/permissions/children', {
  token,
  body: {
    id: permMenu,
    name: 'QA 菜单',
    translations: { zh: 'QA 菜单', en: 'QA Menu EN' },
    path: `/qa-${suffix}/menu`,
    type: 'menu',
    parentId: permRoot,
  },
});
expectOk('create permission menu', createPermMenu);
created.permissions.push(permMenu);
const createPermAction = await request('POST', '/system/permissions/children', {
  token,
  body: {
    id: permAction,
    name: 'QA 动作',
    translations: { zh: 'QA 动作', en: 'QA Action' },
    path: `/qa-${suffix}/menu`,
    type: 'action',
    action: 'view',
    parentId: permMenu,
  },
});
expectOk('create permission action', createPermAction);
created.permissions.push(permAction);

const permissionsList = await request('GET', '/system/permissions', { token });
expectOk('permissions list', permissionsList);
const permissionRows = field(permissionsList.json, 'data');
check('permissions list is an array', Array.isArray(permissionRows), permissionRows);
check('permissions list includes created nodes', Array.isArray(permissionRows) && permissionRows.some((row) => row.id === permAction), permissionRows?.slice(-3));

const permissionDetail = await request('GET', `/system/permissions/${permAction}`, { token });
expectOk('permission detail', permissionDetail);
check('permission detail has type/action', field(permissionDetail.json, 'data')?.type === 'action' && field(permissionDetail.json, 'data')?.action === 'view', field(permissionDetail.json, 'data'));
check(
  'permission detail has translations',
  field(permissionDetail.json, 'data')?.translations?.en === 'QA Action',
  field(permissionDetail.json, 'data')?.translations,
);

const editPermission = await request('PATCH', `/system/permissions/${permAction}`, {
  token,
  body: {
    name: 'QA Action Renamed',
    translations: { zh: 'QA 动作', en: 'QA Action Updated' },
  },
});
expectStringPayload('edit permission', editPermission, '操作成功');
const permissionAfter = await request('GET', `/system/permissions/${permAction}`, { token });
check('permission rename persisted', field(permissionAfter.json, 'data')?.name === 'QA Action Renamed', field(permissionAfter.json, 'data'));
check(
  'permission translations persisted',
  field(permissionAfter.json, 'data')?.translations?.en === 'QA Action Updated',
  field(permissionAfter.json, 'data')?.translations,
);
const clearTranslations = await request('PATCH', `/system/permissions/${permAction}`, {
  token,
  body: { translations: {} },
});
expectStringPayload('clear permission translations', clearTranslations, '操作成功');
const cleared = await request('GET', `/system/permissions/${permAction}`, { token });
check(
  'empty translation map clears rows',
  Object.keys(field(cleared.json, 'data')?.translations ?? {}).length === 0,
  field(cleared.json, 'data')?.translations,
);

const zhMenus = await request('GET', '/auth/menus', { token, headers: { Locale: 'zh' } });
const enMenus = await request('GET', '/auth/menus', { token, headers: { Locale: 'en-US' } });
const findMenu = (nodes, id) => {
  for (const node of nodes ?? []) {
    if (node.id === id) return node;
    const child = findMenu(node.children, id);
    if (child) return child;
  }
  return null;
};
check(
  'menu uses zh translation',
  findMenu(field(zhMenus.json, 'data'), permMenu)?.name === 'QA 菜单',
  findMenu(field(zhMenus.json, 'data'), permMenu),
);
check(
  'menu uses exact/language English fallback',
  findMenu(field(enMenus.json, 'data'), permMenu)?.name === 'QA Menu EN',
  findMenu(field(enMenus.json, 'data'), permMenu),
);

const actionWithoutName = await request('POST', '/system/permissions/children', {
  token,
  body: { id: `${permRoot}99`, name: 'Bad Action', path: '/qa-bad', type: 'action', parentId: permRoot },
});
expectError('action permission needs action name', actionWithoutName, 40002);
const menuWithAction = await request('POST', '/system/permissions/children', {
  token,
  body: { id: `${permRoot}98`, name: 'Bad Menu', path: '/qa-bad-menu', type: 'menu', action: 'view', parentId: permRoot },
});
expectError('menu cannot have action name', menuWithAction, 40002);
const childOfAction = await request('POST', '/system/permissions/children', {
  token,
  body: { id: `${permAction}01`, name: 'Bad Child', path: '/qa-child', type: 'menu', parentId: permAction },
});
expectError('action cannot have children', childOfAction, 40002);

const deleteAction = await request('DELETE', `/system/permissions/${permAction}`, { token });
expectOk('delete action permission', deleteAction);
const deleteMenu = await request('DELETE', `/system/permissions/${permMenu}`, { token });
expectOk('delete menu permission', deleteMenu);
const deletePermRoot = await request('DELETE', `/system/permissions/${permRoot}`, { token });
expectOk('delete directory permission', deletePermRoot);

// ------------------------------------------------------------ operation logs
const logs = await request('GET', '/system/operation-logs?page=1&size=10&username=super', { token });
expectOk('operation logs', logs);
const logPage = field(logs.json, 'data');
check('log page shape', logPage && Array.isArray(logPage.list) && Number.isInteger(logPage.total), logPage);
check('log rows have documented fields', (logPage?.list ?? []).every((row) => row.id !== undefined && row.method && row.path && row.status !== undefined && row.durationMs !== undefined && row.createTime && row.traceId), logPage?.list?.[0]);
check('log rows belong to super', (logPage?.list ?? []).every((row) => row.username === 'super'), logPage?.list?.slice(0, 3));
const byPath = await request('GET', `/system/operation-logs?page=1&size=10&path=${encodeURIComponent('/api/v1/system/groups')}`, { token });
expectOk('operation logs path filter', byPath);
check('log path filter matches group writes', (field(byPath.json, 'data')?.list ?? []).some((row) => row.path.includes('/system/groups')), field(byPath.json, 'data'));
const range = todayRange();
const byDate = await request('GET', `/system/operation-logs?page=1&size=10&from=${encodeURIComponent(`${range.from}+08:00`)}&to=${encodeURIComponent(`${range.to}+08:00`)}`, { token });
expectOk('operation logs date filter', byDate);
check('log date filter returns rows', (field(byDate.json, 'data')?.list ?? []).length > 0, field(byDate.json, 'data'));

// ------------------------------------------------------------ errors / CORS
const unknown = await request('GET', '/system/not-a-real-endpoint', { token });
expectError('unknown route', unknown, 40401);
const badStatus = await request('PATCH', `/system/users/${newUser.id}/status`, { token, body: { status: '2' } });
expectError('invalid status value', badStatus, 40002);

const preflight = await request('OPTIONS', '/system/users', {
  headers: {
    Origin: 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,content-type,locale',
  },
});
check('CORS preflight succeeds', preflight.status === 200 || preflight.status === 204, { status: preflight.status });
check('CORS allows localhost:5173', (preflight.headers.get('access-control-allow-origin') ?? '').includes('http://localhost:5173'), {
  allowOrigin: preflight.headers.get('access-control-allow-origin'),
});

// ------------------------------------------------------------------ cleanup
for (const id of created.users) {
  await request('DELETE', `/system/users/${id}`, { token });
}
for (const id of created.roles) {
  await request('DELETE', `/system/roles/${id}`, { token });
}
for (const id of created.permissions.slice().reverse()) {
  await request('DELETE', `/system/permissions/${id}`, { token });
}
for (const id of created.groups.slice().reverse()) {
  await request('DELETE', `/system/groups/${id}`, { token });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
