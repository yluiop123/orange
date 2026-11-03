import { describe, expect, it } from 'vitest';
import { createAccess } from './access';
import type { MenuNode, Permission } from './models';

const permissions: Permission[] = [
  { type: 'menu', path: '/system/user', action: null },
  { type: 'menu', path: '/system/role', action: null },
  { type: 'directory', path: '/dashboard', action: null },
  { type: 'action', path: '/system/user', action: 'add' },
  { type: 'action', path: '/system/user', action: 'edit' },
];

const tree: MenuNode[] = [
  {
    id: '0000',
    name: 'Dashboard',
    path: '/dashboard',
    type: 'menu',
    children: [
      {
        id: '000000',
        name: 'Normal',
        path: '/dashboard/normal',
        type: 'menu',
        children: [],
      },
      {
        id: '000001',
        name: 'Network',
        path: '/dashboard/network',
        type: 'menu',
        children: [],
      },
    ],
  },
  {
    id: '0005',
    name: 'System',
    path: '/system',
    type: 'menu',
    children: [
      {
        id: '000500',
        name: 'Users',
        path: '/system/user',
        type: 'menu',
        children: [],
      },
      {
        id: '000501',
        name: 'Roles',
        path: '/system/role',
        type: 'menu',
        children: [],
      },
      {
        id: '000502',
        name: 'Permissions',
        path: '/system/permission',
        type: 'menu',
        children: [],
      },
    ],
  },
  {
    id: '0004',
    name: 'Maps',
    path: '/map',
    type: 'menu',
    children: [
      { id: '000400', name: 'Leaflet', path: '/map/leaflet', type: 'menu', children: [] },
    ],
  },
];

describe('createAccess', () => {
  it('grants a menu path exactly, regardless of trailing slash', () => {
    const access = createAccess(permissions);
    expect(access.canView('/system/user')).toBe(true);
    expect(access.canView('/system/user/')).toBe(true);
    expect(access.canView('/system/permission')).toBe(false);
  });

  it('grants every menu below a directory permission', () => {
    const access = createAccess(permissions);
    expect(access.canView('/dashboard/normal')).toBe(true);
    expect(access.canView('/dashboard/network')).toBe(true);
    expect(access.canView('/dashboard')).toBe(true);
    // A directory does not leak into sibling roots.
    expect(access.canView('/dashboardx')).toBe(false);
  });

  it('checks action permissions per path and action name', () => {
    const access = createAccess(permissions);
    expect(access.canAct('/system/user', 'add')).toBe(true);
    expect(access.canAct('/system/user', 'delete')).toBe(false);
    expect(access.canAct('/system/role', 'add')).toBe(false);
  });

  it('filters the menu tree to visible branches only', () => {
    const access = createAccess(permissions);
    const visible = access.visibleMenuTree(tree);
    expect(visible.map((node) => node.id)).toEqual(['0000', '0005']);
    expect(visible[1].children.map((node) => node.id)).toEqual(['000500', '000501']);
    expect(visible[0].children.map((node) => node.id)).toEqual(['000000', '000001']);
  });

  it('keeps a container when only a child is granted', () => {
    const access = createAccess([{ type: 'menu', path: '/system/permission', action: null }]);
    const visible = access.visibleMenuTree(tree);
    expect(visible.map((node) => node.id)).toEqual(['0005']);
    expect(visible[0].children.map((node) => node.id)).toEqual(['000502']);
  });

  it('returns the first visible leaf in menu order', () => {
    const access = createAccess(permissions);
    expect(access.firstVisibleLeaf(access.visibleMenuTree(tree))).toBe('/dashboard/normal');
  });

  it('returns null when nothing is granted', () => {
    const access = createAccess([]);
    expect(access.visibleMenuTree(tree)).toEqual([]);
    expect(access.firstVisibleLeaf(tree)).toBeNull();
    expect(access.canView('/system/user')).toBe(false);
  });
});
