import { describe, expect, it } from 'vitest'
import { createAccess, computePermissions, type MenuNode, type Permission } from './access'

const menus: MenuNode[] = [
  {
    id: '0000',
    path: '/dashboard',
    type: 'directory',
    name: 'Dashboard',
    children: [
      { id: '000000', path: '/dashboard/normal', type: 'menu', name: 'Normal', children: [] },
      { id: '000001', path: '/dashboard/security', type: 'menu', name: 'Security', children: [] },
    ],
  },
  {
    id: '0005',
    path: '/system',
    type: 'menu',
    name: 'System',
    children: [
      { id: '000500', path: '/system/user', type: 'menu', name: 'Users', children: [] },
      { id: '000501', path: '/system/role', type: 'menu', name: 'Roles', children: [] },
    ],
  },
  { id: '0007', path: '/systematic', type: 'menu', name: 'Boundary', children: [] },
]

const permissions: Permission[] = [
  { type: 'menu', path: '/dashboard/normal', action: null },
  { type: 'menu', path: '/system/user', action: null },
  { type: 'action', path: '/system/user', action: 'add' },
  { type: 'action', path: '/system/user', action: 'delete' },
]

describe('createAccess', () => {
  it('grants a menu path and its actions, not sibling actions', () => {
    const access = createAccess(permissions)
    expect(access.canView('/system/user')).toBe(true)
    expect(access.canAct('/system/user', 'add')).toBe(true)
    expect(access.canAct('/system/user', 'edit')).toBe(false)
    expect(access.canView('/system/role')).toBe(false)
    expect(access.canAct('/system/role', 'add')).toBe(false)
  })

  it('matches paths at a segment boundary', () => {
    const access = createAccess(permissions)
    expect(access.canView('/system')).toBe(false)
    expect(access.canView('/systematic')).toBe(false)
    expect(access.canView('/system/user/')).toBe(true)
  })

  it('keeps only granted leaves and prunes their ancestors', () => {
    const access = createAccess(permissions)
    const visible = access.visibleMenuTree(menus)
    expect(visible.map((node) => node.path)).toEqual(['/dashboard', '/system'])
    expect(visible[0].children.map((node) => node.path)).toEqual(['/dashboard/normal'])
    expect(visible[1].children.map((node) => node.path)).toEqual(['/system/user'])
    expect(visible[1].children[0].children).toEqual([])
  })

  it('shows an entire subtree for a directory grant', () => {
    const access = createAccess([{ type: 'directory', path: '/dashboard' }])
    expect(access.canView('/dashboard/security')).toBe(true)
    expect(access.visibleMenuTree(menus)[0].children).toHaveLength(2)
    expect(access.firstVisibleLeaf(menus)).toBe('/dashboard/normal')
  })

  it('returns the first visible leaf in menu order', () => {
    const access = createAccess([
      { type: 'menu', path: '/system/role' },
      { type: 'menu', path: '/dashboard/security' },
    ])
    expect(access.firstVisibleLeaf(menus)).toBe('/dashboard/security')
    expect(access.firstVisibleLeaf([])).toBeNull()
  })

  it('treats a missing permission list as no access', () => {
    const access = createAccess(null)
    expect(access.canView('/dashboard/normal')).toBe(false)
    expect(access.visibleMenuTree(menus)).toEqual([])
    expect(access.firstVisibleLeaf(menus)).toBeNull()
  })
})

describe('computePermissions', () => {
  const rolePermissions: Permission[] = [
    { type: 'menu', path: '/system/user', action: null, role: 'super' },
    { type: 'menu', path: '/system/role', action: null, role: 'admin' },
  ]
  const userPermissions: Permission[] = [{ type: 'menu', path: '/profile', action: null }]

  it('unions direct grants with every role by default', () => {
    const result = computePermissions({ rolePermissions, userPermissions })
    expect(result.map((item) => item.path)).toEqual(['/profile', '/system/user', '/system/role'])
  })

  it('filters role grants for a UI-only role switch', () => {
    const result = computePermissions({ currentRole: 'admin', rolePermissions, userPermissions })
    expect(result.map((item) => item.path)).toEqual(['/profile', '/system/role'])
  })
})
