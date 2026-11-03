import {
  authorityOf,
  computeEffectivePermissions,
  PermissionLike,
} from './effective-permissions';

function permission(
  id: string,
  type: string,
  path: string,
  action: string | null,
  status: string,
): PermissionLike {
  return { id, type, path, action, status };
}

describe('effective permissions', () => {
  const menu = permission('000500', 'menu', '/system/user', null, '1');
  const addAction = permission('00050000', 'action', '/system/user', 'add', '1');
  const disabledAction = permission('00050001', 'action', '/system/user', 'delete', '0');
  const direct = permission('000001', 'menu', '/profile', null, '1');

  it('unions enabled roles and direct grants while dropping disabled ones', () => {
    const effective = computeEffectivePermissions({
      roles: [
        { id: 'admin', name: 'Admin', status: '1', permissions: [menu, addAction, disabledAction] },
        {
          id: 'guest',
          status: '0',
          permissions: [permission('001', 'menu', '/guest', null, '1')],
        },
      ],
      permissions: [direct],
    });

    expect(effective.roles.map((role) => role.id)).toEqual(['admin']);
    expect(effective.rolePermissions.map((item) => item.roleId)).toEqual(['admin', 'admin']);
    expect(effective.directPermissions.map((item) => item.id)).toEqual(['000001']);
    expect([...effective.authorities]).toEqual(
      expect.arrayContaining([
        '000500',
        'menu#/system/user',
        '00050000',
        'action#/system/user:add',
        '000001',
        'menu#/profile',
      ]),
    );
    expect([...effective.authorities]).not.toEqual(
      expect.arrayContaining(['00050001', 'action#/system/user:delete', '001', 'menu#/guest']),
    );
  });

  it('deduplicates a permission granted by several roles and directly', () => {
    const second = { id: 'auditor', status: '1', permissions: [menu] };
    const effective = computeEffectivePermissions({
      roles: [
        { id: 'admin', status: '1', permissions: [menu] },
        second,
      ],
      permissions: [menu],
    });

    expect(effective.permissions.filter((item) => item.id === '000500')).toHaveLength(1);
    expect(effective.authorities.has('menu#/system/user')).toBe(true);
  });

  it('formats authorities as type#path[:action]', () => {
    expect(authorityOf(menu)).toBe('menu#/system/user');
    expect(authorityOf(addAction)).toBe('action#/system/user:add');
    expect(authorityOf(permission('0000', 'directory', '/system', null, '1'))).toBe(
      'directory#/system',
    );
    expect(
      authorityOf(permission('00050002', 'action', '/system/user', '  edit  ', '1')),
    ).toBe('action#/system/user:edit');
  });

  it('returns nothing for a user with only disabled grants', () => {
    const effective = computeEffectivePermissions({
      roles: [{ id: 'guest', status: '0', permissions: [menu] }],
      permissions: [disabledAction],
    });

    expect(effective.authorities.size).toBe(0);
    expect(effective.roles).toHaveLength(0);
    expect(effective.directPermissions).toHaveLength(0);
  });
});
