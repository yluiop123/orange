import type { Group, OperationLog, PermissionRow, Role, User } from '../core/models';
import { PERMISSION_CATALOG, ROLE_PERMISSIONS } from '../core/permission-catalog';

export interface MockPermission extends PermissionRow {
  nameEn?: string;
}

export interface MockUser extends User {
  password: string;
  roleIds: string[];
  permissionIds: string[];
  mustChangePassword: boolean;
}

export interface MockState {
  users: MockUser[];
  roles: Role[];
  groups: Group[];
  permissions: MockPermission[];
  logs: OperationLog[];
}

const NOW = new Date().toISOString();

function permissionFromCatalog(entry: (typeof PERMISSION_CATALOG)[number]): MockPermission {
  return {
    id: entry.id,
    name: entry.nameZh,
    nameEn: entry.nameEn,
    path: entry.path,
    action: entry.action,
    type: entry.type,
    status: '1',
    parentId: entry.parentId,
    createTime: NOW,
  };
}

function user(
  id: string,
  name: string,
  username: string,
  email: string,
  groupId: string,
  groupName: string,
  roleIds: string[],
  password: string,
  extra: Partial<MockUser> = {},
): MockUser {
  const phone = `1380000${id.replace(/\D/g, '').padStart(4, '0').slice(0, 4)}`;
  return {
    id,
    name,
    username,
    email,
    groupId,
    groupName,
    phone,
    status: '1',
    createTime: NOW,
    updateTime: NOW,
    roles: roleIds.map((role) => ({ id: role, name: role })),
    permissions: [],
    password,
    roleIds,
    permissionIds: [],
    mustChangePassword: false,
    ...extra,
  };
}

const permissions = PERMISSION_CATALOG.map(permissionFromCatalog);

export const INITIAL_STATE: MockState = {
  permissions,
  roles: [
    {
      id: 'super',
      name: '超级管理员',
      status: '1',
      permissions: ROLE_PERMISSIONS['super'],
      createTime: NOW,
    },
    {
      id: 'admin',
      name: '管理员',
      status: '1',
      permissions: ROLE_PERMISSIONS['admin'],
      createTime: NOW,
    },
    {
      id: 'user',
      name: '普通用户',
      status: '1',
      permissions: ROLE_PERMISSIONS['user'],
      createTime: NOW,
    },
    {
      id: 'auditor',
      name: '审计员',
      status: '1',
      permissions: ['0005', '000504'],
      createTime: NOW,
    },
  ],
  groups: [
    { id: '00', name: '总公司', status: '1', parentId: null, createTime: NOW },
    { id: '0001', name: '研发部', status: '1', parentId: '00', createTime: NOW },
    { id: '0002', name: '市场部', status: '1', parentId: '00', createTime: NOW },
    { id: '0003', name: '财务部', status: '1', parentId: '00', createTime: NOW },
    { id: '000100', name: '前端组', status: '1', parentId: '0001', createTime: NOW },
    { id: '000101', name: '后端组', status: '1', parentId: '0001', createTime: NOW },
    { id: '000200', name: '华东区', status: '1', parentId: '0002', createTime: NOW },
    { id: '000201', name: '华南区', status: '0', parentId: '0002', createTime: NOW },
    { id: '000300', name: '会计组', status: '1', parentId: '0003', createTime: NOW },
  ],
  users: [
    user(
      'u-super',
      '超级管理员',
      'super',
      'super@example.com',
      '0001',
      '研发部',
      ['super', 'admin', 'user'],
      'super',
    ),
    user(
      'u-admin',
      '系统管理员',
      'admin',
      'admin@example.com',
      '0001',
      '研发部',
      ['admin', 'user'],
      'admin',
    ),
    user('u-user', '普通用户', 'user', 'user@example.com', '0002', '市场部', ['user'], 'user'),
    user(
      'u-audit',
      '审计员',
      'auditor',
      'auditor@example.com',
      '0003',
      '财务部',
      ['auditor'],
      'auditor',
    ),
    user('u-new', '新同事', 'newbie', 'newbie@example.com', '0001', '研发部', ['user'], 'newbie', {
      mustChangePassword: true,
    }),
    user('u-1001', '林一', 'linyi', 'linyi@example.com', '000100', '前端组', ['admin'], 'admin'),
    user('u-1002', '陈二', 'chener', 'chener@example.com', '000100', '前端组', ['user'], 'user'),
    user(
      'u-1003',
      '张三',
      'zhangsan',
      'zhangsan@example.com',
      '000101',
      '后端组',
      ['admin'],
      'admin',
    ),
    user('u-1004', '李四', 'lisi', 'lisi@example.com', '000101', '后端组', ['user'], 'user'),
    user('u-1005', '王五', 'wangwu', 'wangwu@example.com', '000200', '华东区', ['user'], 'user'),
    user('u-1006', '赵六', 'zhaoliu', 'zhaoliu@example.com', '000200', '华东区', ['user'], 'user'),
    user(
      'u-1007',
      '孙七',
      'sunqi',
      'sunqi@example.com',
      '000300',
      '会计组',
      ['auditor'],
      'auditor',
      {
        status: '0',
      },
    ),
    user('u-1008', '周八', 'zhouba', 'zhouba@example.com', '0001', '研发部', ['user'], 'user'),
  ],
  logs: [],
};

const LOG_ACTIONS = ['POST', 'PATCH', 'DELETE', 'GET'] as const;
const LOG_PATHS = [
  '/api/v1/system/users',
  '/api/v1/system/roles',
  '/api/v1/system/groups',
  '/api/v1/system/permissions',
  '/api/v1/auth/change-password',
];

INITIAL_STATE.logs = Array.from({ length: 26 }, (_, index) => {
  const method = LOG_ACTIONS[index % LOG_ACTIONS.length];
  const status = index % 7 === 0 ? 403 : index % 11 === 0 ? 400 : 200;
  return {
    id: 2600 - index,
    traceId: `trace-${(index + 41).toString(16).padStart(8, '0')}`,
    username: ['super', 'admin', 'linyi', 'zhangsan', 'auditor'][index % 5],
    method,
    path: LOG_PATHS[index % LOG_PATHS.length],
    queryString: index % 3 === 0 ? 'page=1&size=10' : '',
    requestBody:
      method === 'GET' ? '' : `{"name":"示例 ${index + 1}","status":"1","password":"***"}`,
    status,
    durationMs: 12 + ((index * 17) % 240),
    ip: `10.20.${index % 8}.${(index * 7) % 250}`,
    createTime: new Date(Date.now() - index * 7 * 60 * 1000).toISOString(),
  } satisfies OperationLog;
});

export function resetState(): MockState {
  return {
    users: INITIAL_STATE.users.map((entry) => ({
      ...entry,
      roles: entry.roles?.map((role) => ({ ...role })),
      permissionIds: [...entry.permissionIds],
    })),
    roles: INITIAL_STATE.roles.map((entry) => ({
      ...entry,
      permissions: [...(entry.permissions ?? [])],
    })),
    groups: INITIAL_STATE.groups.map((entry) => ({ ...entry })),
    permissions: INITIAL_STATE.permissions.map((entry) => ({ ...entry })),
    logs: INITIAL_STATE.logs.map((entry) => ({ ...entry })),
  };
}
