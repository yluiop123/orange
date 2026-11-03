import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import http from '@/api/http'
import { buildChildrenTree } from '@/lib/tree'
import type {
  Envelope,
  Group,
  PageResult,
  Permission,
  Role,
  User,
  UserInfo,
} from '@/api/types'
import {
  resetState,
  type MockPermission,
  type MockState,
  type MockUser,
} from './seed'

const CURRENT_USER_KEY = 'orange.mock.currentUser'
const SENSITIVE_SEGMENTS = ['login', 'refresh', 'change-password', 'reset-password']

let state: MockState = resetState()

type Reply = { status: number; body: Envelope<unknown> }
type Locale = 'zh' | 'en'
type Json = Record<string, unknown>

function traceId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function envelope<T>(data: T, message = 'success'): Envelope<T> {
  return { code: 200, message, data, timestamp: Date.now(), traceId: traceId() }
}

function failure(
  code: number,
  message: string,
  status: number,
  data: unknown = null,
): Reply {
  return {
    status,
    body: { code, message, data, timestamp: Date.now(), traceId: traceId() },
  }
}

function ok<T>(data: T, message = 'success'): Reply {
  return { status: 200, body: envelope(data, message) }
}

function header(config: InternalAxiosRequestConfig, name: string): string {
  const headers = config.headers
  const value = headers?.get?.(name) ?? headers?.[name]
  return typeof value === 'string' ? value : ''
}

function localeOf(config: InternalAxiosRequestConfig): Locale {
  return header(config, 'Locale').toLowerCase().startsWith('en') ? 'en' : 'zh'
}

function bodyOf(config: InternalAxiosRequestConfig): Json {
  if (typeof config.data !== 'string') {
    return (config.data as Json | undefined) ?? {}
  }
  try {
    return JSON.parse(config.data) as Json
  } catch {
    return {}
  }
}

function paramsOf(config: InternalAxiosRequestConfig): Record<string, unknown> {
  return (config.params as Record<string, unknown> | undefined) ?? {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value)
}

function numberParam(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function trim(value: unknown): string {
  return text(value).trim()
}

function paginate<T>(rows: T[], page: number, size: number): PageResult<T> {
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / size))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * size
  return { total, list: rows.slice(start, start + size), page: safePage, size, totalPages }
}

function localeName(entry: { name: string; nameEn?: string }, locale: Locale): string {
  return locale === 'en' && entry.nameEn ? entry.nameEn : entry.name
}

function currentUsername(): string {
  return localStorage.getItem(CURRENT_USER_KEY) || 'super'
}

function findUser(username: string): MockUser | undefined {
  return state.users.find((entry) => entry.username === username)
}

function isSuper(username: string): boolean {
  return findUser(username)?.roleIds.includes('super') ?? false
}

function groupNameOf(groupId: string): string {
  return state.groups.find((group) => group.id === groupId)?.name ?? groupId
}

function permissionDto(permission: MockPermission, locale: Locale): Permission {
  return {
    id: permission.id,
    name: localeName(permission, locale),
    path: permission.path,
    action: permission.action,
    type: permission.type,
    status: permission.status,
    parentId: permission.parentId,
    createTime: permission.createTime,
    updateTime: permission.updateTime,
  }
}

function userDto(entry: MockUser, _locale: Locale): User {
  return {
    id: entry.id,
    name: entry.name,
    username: entry.username,
    email: entry.email,
    groupId: entry.groupId,
    groupName: groupNameOf(entry.groupId),
    phone: entry.phone,
    status: entry.status,
    createTime: entry.createTime,
    updateTime: entry.updateTime,
    roles: entry.roleIds.map((id) => ({
      id,
      name: state.roles.find((role) => role.id === id)?.name ?? id,
    })),
    permissions: [...entry.permissionIds],
  } satisfies User & { permissions: string[] }
}

function roleDto(entry: Role): Role {
  return { ...entry, permissions: [...(entry.permissions ?? [])] }
}

function groupDto(entry: Group): Group {
  return { ...entry }
}

function userInfoOf(entry: MockUser, locale: Locale): UserInfo {
  const roles = entry.roleIds
    .map((id) => state.roles.find((role) => role.id === id))
    .filter((role): role is Role => Boolean(role))
    .filter((role) => role.status === '1')

  const permissionsOf = (ids: string[]) =>
    ids
      .map((id) => state.permissions.find((permission) => permission.id === id))
      .filter((permission): permission is MockPermission => Boolean(permission))
      .filter((permission) => permission.status === '1')

  return {
    id: entry.id,
    name: entry.name,
    username: entry.username,
    email: entry.email,
    groupId: entry.groupId,
    groupName: groupNameOf(entry.groupId),
    phone: entry.phone,
    status: entry.status,
    mustChangePassword: entry.mustChangePassword,
    roles: roles.map((role) => ({ id: role.id, name: role.name })),
    rolePermissions: roles.flatMap((role) =>
      permissionsOf(role.permissions ?? []).map((permission) => ({
        path: permission.path,
        role: role.id,
        type: permission.type ?? 'menu',
        action: permission.action,
        name: localeName(permission, locale),
      })),
    ),
    userPermissions: permissionsOf(entry.permissionIds).map((permission) => ({
      path: permission.path,
      role: '',
      type: permission.type ?? 'menu',
      action: permission.action,
      name: localeName(permission, locale),
    })),
  }
}

function menuTree(locale: Locale) {
  const rows = state.permissions
    .filter(
      (permission) =>
        permission.status === '1' &&
        (permission.type === 'menu' || permission.type === 'directory'),
    )
    .map((permission) => ({
      id: permission.id,
      path: permission.path,
      type: permission.type as 'menu' | 'directory',
      name: localeName(permission, locale),
      parentId: permission.parentId,
    }))

  return buildChildrenTree(rows, {
    id: (node) => node.id,
    parentId: (node) => node.parentId,
    orphan: 'drop',
  }).map(function convert(node): {
    id: string
    path: string
    type: 'menu' | 'directory'
    name: string
    children: unknown[]
  } {
    return {
      id: node.id,
      path: node.path,
      type: node.type,
      name: node.name,
      children: (node.children ?? []).map(convert),
    }
  })
}

function tempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    '',
  )
}

function codeIssue(kind: 'group' | 'permission', id: string, parentId?: string | null): string | null {
  const rootLength = kind === 'group' ? 2 : 4
  if (!id) return '编码不能为空 / Code is required'
  if (!/^\d+$/.test(id)) return '编码只能包含数字 / Code must be digits only'
  if (!parentId) {
    return id.length === rootLength
      ? null
      : `根编码必须是 ${rootLength} 位 / Root code must be ${rootLength} digits`
  }
  if (id.length !== parentId.length + 2) {
    return `编码必须是 ${parentId.length + 2} 位 / Code must be ${parentId.length + 2} digits`
  }
  if (!id.startsWith(parentId)) {
    return `编码必须以 ${parentId} 开头 / Code must start with ${parentId}`
  }
  return null
}

function recordLog(
  config: InternalAxiosRequestConfig,
  status: number,
  username: string,
  durationMs: number,
) {
  const method = (config.method ?? 'get').toUpperCase()
  if (method === 'GET' || method === 'OPTIONS') return
  const path = config.url ?? ''
  if (!path.startsWith('/system/') && !path.includes('/auth/change-password')) return
  const sensitive = SENSITIVE_SEGMENTS.some((segment) => path.includes(segment))
  const rawBody = typeof config.data === 'string' ? config.data : ''
  const redacted = rawBody
    .replace(/("(?:password|token|secret)"\s*:\s*")[^"]*(")/gi, '$1***$2')
    .slice(0, 4000)
  const now = new Date().toISOString()
  state.logs.unshift({
    id: Date.now(),
    traceId: traceId(),
    username,
    method,
    path: `/api/v1${path}`,
    queryString: JSON.stringify(config.params ?? {}).slice(0, 500),
    requestBody: sensitive ? '' : redacted,
    status,
    durationMs,
    ip: '127.0.0.1',
    createTime: now,
  })
  state.logs = state.logs.slice(0, 500)
}

function validateUser(
  payload: Json,
  id: string | null,
  actor: string,
): { code: number; message: string; data: Record<string, string> } | null {
  const errors: Record<string, string> = {}
  const name = trim(payload.name)
  const username = trim(payload.username)
  const email = trim(payload.email)
  const phone = trim(payload.phone)
  const groupId = trim(payload.groupId)

  if (name.length < 2) errors.name = '姓名至少2个字符 / Name needs 2+ characters'
  if (!id) {
    if (!/^[A-Za-z0-9_]{4,50}$/.test(username)) {
      errors.username = '用户名需为4–50位字母、数字或下划线 / Username must be 4–50 word chars'
    } else if (state.users.some((entry) => entry.username === username)) {
      errors.username = '用户名已存在 / Username already exists'
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '无效的邮箱地址 / Invalid email'
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) errors.phone = '无效的手机号 / Invalid mobile number'
  if (!state.groups.some((group) => group.id === groupId)) {
    errors.groupId = '组织不存在 / Organization does not exist'
  }

  const roleIds = Array.isArray(payload.roles) ? (payload.roles as string[]) : []
  if (roleIds.some((roleId) => !state.roles.some((role) => role.id === roleId))) {
    errors.roles = '角色不存在 / Role does not exist'
  }
  if (roleIds.includes('super') && !isSuper(actor)) {
    errors.roles = '只有超级管理员可以授予 super 角色 / Only super may grant super'
  }

  if (Object.keys(errors).length > 0) {
    return { code: 40002, message: '参数校验失败 / Validation failed', data: errors }
  }
  return null
}

function validatePermission(entry: Json, id: string | null): Reply | null {
  const type = trim(entry.type) as 'menu' | 'action' | 'directory'
  const path = trim(entry.path)
  const action = trim(entry.action)
  if (!['menu', 'action', 'directory'].includes(type)) {
    return failure(40002, '类型无效 / Invalid type', 400, { type: '类型无效 / Invalid type' })
  }
  if (path.length < 2 || !/^[A-Za-z0-9/_-]+$/.test(path)) {
    return failure(40002, '路径无效 / Invalid path', 400, { path: '路径无效 / Invalid path' })
  }
  if (type === 'action' && !action) {
    return failure(40002, '操作类型必须填写 action / action is required for type action', 400, {
      action: '请填写操作名称 / Action is required',
    })
  }
  if (type !== 'action' && action) {
    return failure(40002, '非操作类型不能填写 action / action is forbidden here', 400, {
      action: '该类型不能填写操作名称 / Action is forbidden',
    })
  }
  const duplicate = state.permissions.some(
    (permission) =>
      permission.id !== id &&
      permission.type === type &&
      permission.path === path &&
      (permission.action ?? '') === action,
  )
  if (duplicate) {
    return failure(40901, '权限已存在 / Permission already exists', 409)
  }
  return null
}

function handleAuth(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
): Reply | null {
  const locale = localeOf(config)

  if (method === 'POST' && path === '/auth/login') {
    const payload = bodyOf(config)
    const username = trim(payload.username)
    const password = text(payload.password)
    const entry = findUser(username)
    if (!entry) {
      return ok({ status: 'error', field: 'username', msg: locale === 'en' ? 'Unknown username' : '用户名错误' })
    }
    if (entry.password !== password) {
      return ok({ status: 'error', field: 'password', msg: locale === 'en' ? 'Wrong password' : '密码错误' })
    }
    localStorage.setItem(CURRENT_USER_KEY, entry.username)
    return ok({ token: 'mock-access-token', expiresIn: 1800, refreshExpiresIn: 604800, status: 'ok' })
  }

  if (method === 'POST' && path === '/auth/refresh') {
    const entry = findUser(currentUsername())
    if (!entry) return failure(40101, '未登录 / Not authenticated', 401)
    return ok({ token: 'mock-access-token', expiresIn: 1800 })
  }

  if (method === 'POST' && path === '/auth/logout') {
    localStorage.removeItem(CURRENT_USER_KEY)
    return ok('ok')
  }

  if (method === 'GET' && path === '/auth/user-info') {
    const entry = findUser(currentUsername())
    if (!entry) return failure(40101, '未登录 / Not authenticated', 401)
    return ok(userInfoOf(entry, locale))
  }

  if (method === 'GET' && path === '/auth/menus') {
    return ok(menuTree(locale))
  }

  if (method === 'POST' && path === '/auth/change-password') {
    const entry = findUser(currentUsername())
    if (!entry) return failure(40101, '未登录 / Not authenticated', 401)
    const payload = bodyOf(config)
    const oldPassword = text(payload.oldPassword)
    const newPassword = text(payload.newPassword)
    if (entry.password !== oldPassword) {
      return failure(40002, '原密码错误 / Current password is wrong', 400)
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(newPassword)) {
      return failure(40002, '新密码需 8 位以上且包含字母和数字 / Weak password', 400)
    }
    if (oldPassword === newPassword) {
      return failure(40002, '新密码不能与原密码相同 / New password must differ', 400)
    }
    entry.password = newPassword
    entry.mustChangePassword = false
    return ok('ok', locale === 'en' ? 'Password changed' : '密码已修改')
  }

  return null
}

function handleUsers(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
  actor: string,
): Reply | null {
  const locale = localeOf(config)

  if (path === '/system/users') {
    if (method === 'GET') {
      const params = paramsOf(config)
      const keyword = trim(params.keyword).toLowerCase()
      const status = text(params.status)
      const groupId = trim(params.groupId)
      const sort = trim(params.sort) || 'createTime'
      const direction = trim(params.direction) === 'desc' ? -1 : 1

      let rows = state.users.filter((entry) => {
        if (status && status !== 'all' && entry.status !== status) return false
        if (groupId && entry.groupId !== groupId) return false
        if (!keyword) return true
        return [entry.name, entry.username, entry.email, entry.phone]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })

      rows = [...rows].sort((a, b) => {
        const left = text((a as unknown as Record<string, unknown>)[sort])
        const right = text((b as unknown as Record<string, unknown>)[sort])
        return left.localeCompare(right) * direction
      })

      const page = numberParam(params.page, 1)
      const size = numberParam(params.size, 10)
      const result = paginate(rows, page, size)
      return ok({ ...result, list: result.list.map((entry) => userDto(entry, locale)) })
    }

    if (method === 'POST') {
      const payload = bodyOf(config)
      const invalid = validateUser(payload, null, actor)
      if (invalid) return failure(invalid.code, invalid.message, 400, invalid.data)
      const username = trim(payload.username)
      const temporary = tempPassword()
      const roleIds = Array.isArray(payload.roles) ? (payload.roles as string[]) : []
      const permissionIds = Array.isArray(payload.permissions) ? (payload.permissions as string[]) : []
      const entry: MockUser = {
        id: `u-${Date.now()}`,
        name: trim(payload.name),
        username,
        email: trim(payload.email),
        groupId: trim(payload.groupId),
        groupName: groupNameOf(trim(payload.groupId)),
        phone: trim(payload.phone),
        status: trim(payload.status) || '1',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        roles: roleIds.map((id) => ({ id, name: id })),
        permissions: permissionIds,
        password: temporary,
        roleIds,
        permissionIds,
        mustChangePassword: true,
      }
      state.users.push(entry)
      return ok(temporary)
    }

    if (method === 'DELETE') {
      const ids = trim(paramsOf(config).ids).split(',').filter(Boolean)
      if (ids.some((id) => state.users.find((entry) => entry.id === id)?.username === actor)) {
        return failure(40901, '不能删除当前登录账号 / Cannot delete yourself', 409)
      }
      ids.forEach((id) => {
        const entry = state.users.find((user) => user.id === id)
        if (entry?.roleIds.includes('super')) {
          const enabledSupers = state.users.filter(
            (user) => user.status === '1' && user.roleIds.includes('super'),
          )
          if (enabledSupers.length <= 1) return
        }
        state.users = state.users.filter((user) => user.id !== id)
      })
      return ok('ok')
    }
  }

  const statusMatch = path.match(/^\/system\/users\/([^/]+)\/status$/)
  if (statusMatch && method === 'PATCH') {
    const entry = state.users.find((user) => user.id === statusMatch[1])
    if (!entry) return failure(40401, '用户不存在 / User not found', 404)
    const status = trim(bodyOf(config).status)
    if (status === '0' && entry.username === actor) {
      return failure(40901, '不能停用当前登录账号 / Cannot disable yourself', 409)
    }
    if (status === '0' && entry.roleIds.includes('super')) {
      const enabledSupers = state.users.filter(
        (user) => user.status === '1' && user.roleIds.includes('super'),
      )
      if (enabledSupers.length <= 1) {
        return failure(40901, '至少保留一个启用的超级管理员 / Keep one enabled super', 409)
      }
    }
    entry.status = status === '1' ? '1' : '0'
    return ok('ok')
  }

  const resetMatch = path.match(/^\/system\/users\/([^/]+)\/reset-password$/)
  if (resetMatch && method === 'POST') {
    const entry = state.users.find((user) => user.id === resetMatch[1])
    if (!entry) return failure(40401, '用户不存在 / User not found', 404)
    if (entry.roleIds.includes('super') && !isSuper(actor)) {
      return failure(40301, '只有超级管理员可以重置 super 的密码 / Only super may reset super', 403)
    }
    const temporary = tempPassword()
    entry.password = temporary
    entry.mustChangePassword = true
    return ok(temporary)
  }

  const detailMatch = path.match(/^\/system\/users\/([^/]+)$/)
  if (detailMatch) {
    const entry = state.users.find((user) => user.id === detailMatch[1])
    if (!entry) return failure(40401, '用户不存在 / User not found', 404)
    if (method === 'GET') return ok(userDto(entry, locale))
    if (method === 'PATCH') {
      const body = bodyOf(config)
      const payload: Json = { ...body, username: entry.username }
      const invalid = validateUser(payload, entry.id, actor)
      if (invalid) return failure(invalid.code, invalid.message, 400, invalid.data)
      entry.name = trim(payload.name)
      entry.email = trim(payload.email)
      entry.groupId = trim(payload.groupId)
      entry.phone = trim(payload.phone)
      entry.status = trim(payload.status) || entry.status
      if (Array.isArray(payload.roles)) {
        entry.roleIds = payload.roles as string[]
        entry.roles = entry.roleIds.map((id) => ({ id, name: id }))
      }
      if (Array.isArray(payload.permissions)) {
        entry.permissionIds = payload.permissions as string[]
        entry.permissions = [...entry.permissionIds]
      }
      entry.updateTime = new Date().toISOString()
      return ok('ok')
    }
    if (method === 'DELETE') {
      if (entry.username === actor) {
        return failure(40901, '不能删除当前登录账号 / Cannot delete yourself', 409)
      }
      state.users = state.users.filter((user) => user.id !== entry.id)
      return ok('ok')
    }
  }

  return null
}

function handleRoles(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
): Reply | null {
  if (path === '/system/roles') {
    if (method === 'GET') {
      const params = paramsOf(config)
      const id = trim(params.id)
      const name = trim(params.name)
      const status = text(params.status)
      const sort = trim(params.sort) || 'createTime'
      const direction = trim(params.direction) === 'desc' ? -1 : 1
      let rows = state.roles.filter((role) => {
        if (id && !role.id.includes(id)) return false
        if (name && !role.name.includes(name)) return false
        if (status && status !== 'all' && role.status !== status) return false
        return true
      })
      rows = [...rows].sort((a, b) => {
        const left = text((a as unknown as Record<string, unknown>)[sort])
        const right = text((b as unknown as Record<string, unknown>)[sort])
        return left.localeCompare(right) * direction
      })
      const result = paginate(rows, numberParam(params.page, 1), numberParam(params.size, 10))
      return ok({ ...result, list: result.list.map(roleDto) })
    }

    if (method === 'POST') {
      const payload = bodyOf(config)
      const id = trim(payload.id)
      const name = trim(payload.name)
      if (!/^[A-Za-z0-9_-]{2,32}$/.test(id)) {
        return failure(40002, '角色编码无效 / Invalid role id', 400, {
          id: '角色编码需为2–32位字母、数字、下划线或连字符 / Invalid role id',
        })
      }
      if (name.length < 2) {
        return failure(40002, '角色名称过短 / Role name too short', 400, {
          name: '角色名称至少2个字符 / Role name needs 2+ characters',
        })
      }
      if (state.roles.some((role) => role.id === id)) {
        return failure(40901, '角色编码已存在 / Role id already exists', 409, {
          id: '角色编码已存在 / Role id already exists',
        })
      }
      const permissions = Array.isArray(payload.permissions) ? (payload.permissions as string[]) : []
      state.roles.push({
        id,
        name,
        status: '1',
        permissions,
        createTime: new Date().toISOString(),
      })
      return ok(id)
    }

    if (method === 'DELETE') {
      const ids = trim(paramsOf(config).ids).split(',').filter(Boolean)
      const referenced = ids.find((id) => state.users.some((user) => user.roleIds.includes(id)))
      if (referenced) {
        return failure(40901, '角色仍被用户引用，不能删除 / Role is referenced by a user', 409)
      }
      state.roles = state.roles.filter((role) => !ids.includes(role.id))
      return ok('ok')
    }
  }

  const match = path.match(/^\/system\/roles\/([^/]+)$/)
  if (match) {
    const role = state.roles.find((item) => item.id === match[1])
    if (!role) return failure(40401, '角色不存在 / Role not found', 404)
    if (method === 'GET') return ok(roleDto(role))
    if (method === 'PATCH') {
      const payload = bodyOf(config)
      if (payload.name !== undefined) {
        const name = trim(payload.name)
        if (name.length < 2) {
          return failure(40002, '角色名称过短 / Role name too short', 400, {
            name: '角色名称至少2个字符 / Role name needs 2+ characters',
          })
        }
        role.name = name
      }
      if (payload.status !== undefined) role.status = trim(payload.status) || role.status
      if (Array.isArray(payload.permissions)) role.permissions = payload.permissions as string[]
      role.updateTime = new Date().toISOString()
      return ok('ok')
    }
    if (method === 'DELETE') {
      if (state.users.some((user) => user.roleIds.includes(role.id))) {
        return failure(40901, '角色仍被用户引用，不能删除 / Role is referenced by a user', 409)
      }
      state.roles = state.roles.filter((item) => item.id !== role.id)
      return ok('ok')
    }
  }

  return null
}

function withAncestors<T extends { id: string; parentId?: string | null }>(
  rows: T[],
  matched: T[],
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const ids = new Set(matched.map((row) => row.id))
  for (const row of matched) {
    let parentId = row.parentId
    while (parentId) {
      ids.add(parentId)
      parentId = byId.get(parentId)?.parentId ?? null
    }
  }
  return rows.filter((row) => ids.has(row.id))
}

function descendantIds(rows: Array<{ id: string; parentId?: string | null }>, rootId: string): string[] {
  const ids = [rootId]
  let frontier = [rootId]
  while (frontier.length > 0) {
    const next = rows
      .filter((row) => row.parentId && frontier.includes(row.parentId))
      .map((row) => row.id)
    ids.push(...next)
    frontier = next
  }
  return ids
}

function handleGroups(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
): Reply | null {
  if (path === '/system/groups') {
    if (method === 'GET') {
      const params = paramsOf(config)
      const code = trim(params.id)
      const name = trim(params.name)
      const status = text(params.status)
      const textFilter = Boolean(code || name)
      let matched = state.groups.filter((group) => {
        if (code && !group.id.includes(code)) return false
        if (name && !group.name.includes(name)) return false
        if (status && status !== 'all' && group.status !== status) return false
        return true
      })
      if (textFilter) matched = withAncestors(state.groups, matched)
      const rows = [...matched].sort((a, b) => a.id.localeCompare(b.id))
      return ok(rows.map(groupDto))
    }

    if (method === 'DELETE') {
      const ids = trim(paramsOf(config).ids).split(',').filter(Boolean)
      const all = ids.flatMap((id) => descendantIds(state.groups, id))
      if (state.users.some((user) => all.includes(user.groupId))) {
        return failure(40901, '组织（或其子组织）下仍有用户 / Group still has users', 409)
      }
      state.groups = state.groups.filter((group) => !all.includes(group.id))
      return ok('ok')
    }
  }

  if (path === '/system/groups/children' && method === 'POST') {
    const payload = bodyOf(config)
    const id = trim(payload.id)
    const name = trim(payload.name)
    const parentId = trim(payload.parentId) || null
    const issue = codeIssue('group', id, parentId)
    if (issue) return failure(40002, issue, 400, { id: issue })
    if (name.length < 2) {
      return failure(40002, '组织名称过短 / Group name too short', 400, {
        name: '组织名称至少2个字符 / Group name needs 2+ characters',
      })
    }
    if (parentId && !state.groups.some((group) => group.id === parentId)) {
      return failure(40002, '上级组织不存在 / Parent group not found', 400, {
        parentId: '上级组织不存在 / Parent group not found',
      })
    }
    if (state.groups.some((group) => group.id === id)) {
      return failure(40901, '组织编码已存在 / Group code already exists', 409, {
        id: '组织编码已存在 / Group code already exists',
      })
    }
    state.groups.push({
      id,
      name,
      status: '1',
      parentId,
      createTime: new Date().toISOString(),
    })
    return ok('ok')
  }

  const statusMatch = path.match(/^\/system\/groups\/([^/]+)\/status$/)
  if (statusMatch && method === 'PATCH') {
    const group = state.groups.find((item) => item.id === statusMatch[1])
    if (!group) return failure(40401, '组织不存在 / Group not found', 404)
    const status = trim(bodyOf(config).status)
    if (status === '0') {
      const descendants = descendantIds(state.groups, group.id).filter((id) => id !== group.id)
      if (state.groups.some((item) => descendants.includes(item.id) && item.status === '1')) {
        return failure(40901, '请先停用全部子组织 / Disable descendants first', 409)
      }
    }
    group.status = status === '1' ? '1' : '0'
    return ok('ok')
  }

  const match = path.match(/^\/system\/groups\/([^/]+)$/)
  if (match) {
    const group = state.groups.find((item) => item.id === match[1])
    if (!group) return failure(40401, '组织不存在 / Group not found', 404)
    if (method === 'GET') return ok(groupDto(group))
    if (method === 'PATCH') {
      const payload = bodyOf(config)
      const name = trim(payload.name)
      if (name.length < 2) {
        return failure(40002, '组织名称过短 / Group name too short', 400, {
          name: '组织名称至少2个字符 / Group name needs 2+ characters',
        })
      }
      group.name = name
      const status = trim(payload.status)
      if (status) {
        if (status === '0') {
          const descendants = descendantIds(state.groups, group.id).filter((id) => id !== group.id)
          if (state.groups.some((item) => descendants.includes(item.id) && item.status === '1')) {
            return failure(40901, '请先停用全部子组织 / Disable descendants first', 409)
          }
        }
        group.status = status
      }
      group.updateTime = new Date().toISOString()
      return ok('ok')
    }
    if (method === 'DELETE') {
      const all = descendantIds(state.groups, group.id)
      if (state.users.some((user) => all.includes(user.groupId))) {
        return failure(40901, '组织（或其子组织）下仍有用户 / Group still has users', 409)
      }
      state.groups = state.groups.filter((item) => !all.includes(item.id))
      return ok('ok')
    }
  }

  return null
}

function referencedPermission(permission: MockPermission): boolean {
  return (
    state.roles.some((role) => (role.permissions ?? []).includes(permission.id)) ||
    state.users.some((user) => user.permissionIds.includes(permission.id))
  )
}

function handlePermissions(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
): Reply | null {
  const locale = localeOf(config)

  if (path === '/system/permissions') {
    if (method === 'GET') {
      const params = paramsOf(config)
      const code = trim(params.id)
      const name = trim(params.name)
      const routePath = trim(params.path)
      const status = text(params.status)
      const type = text(params.type)
      const textFilter = Boolean(code || name || routePath)
      let matched = state.permissions.filter((permission) => {
        if (code && !permission.id.includes(code)) return false
        if (name && !localeName(permission, locale).includes(name)) return false
        if (routePath && !permission.path.includes(routePath)) return false
        if (status && status !== 'all' && permission.status !== status) return false
        if (type && type !== 'all' && permission.type !== type) return false
        return true
      })
      if (textFilter) matched = withAncestors(state.permissions, matched)
      const rows = [...matched].sort((a, b) => a.id.localeCompare(b.id))
      return ok(rows.map((permission) => permissionDto(permission, locale)))
    }

    if (method === 'DELETE') {
      const ids = trim(paramsOf(config).ids).split(',').filter(Boolean)
      const all = ids.flatMap((id) => descendantIds(state.permissions, id))
      const referenced = state.permissions.find(
        (permission) => all.includes(permission.id) && referencedPermission(permission),
      )
      if (referenced) {
        return failure(40901, '权限（或其子权限）仍被角色或用户引用 / Permission is referenced', 409)
      }
      state.permissions = state.permissions.filter((permission) => !all.includes(permission.id))
      return ok('ok')
    }
  }

  if (path === '/system/permissions/children' && method === 'POST') {
    const payload = bodyOf(config)
    const id = trim(payload.id)
    const parentId = trim(payload.parentId) || null
    const issue = codeIssue('permission', id, parentId)
    if (issue) return failure(40002, issue, 400, { id: issue })
    if (state.permissions.some((permission) => permission.id === id)) {
      return failure(40901, '权限编码已存在 / Permission code already exists', 409, {
        id: '权限编码已存在 / Permission code already exists',
      })
    }
    if (parentId) {
      const parent = state.permissions.find((permission) => permission.id === parentId)
      if (!parent) {
        return failure(40002, '上级权限不存在 / Parent permission not found', 400, {
          parentId: '上级权限不存在 / Parent permission not found',
        })
      }
      if (parent.type === 'action') {
        return failure(40901, '操作类型不能有子权限 / Action cannot have children', 409)
      }
    }
    const entry = {
      id,
      name: trim(payload.name),
      path: trim(payload.path),
      action: trim(payload.action) || null,
      type: trim(payload.type) as 'menu' | 'action' | 'directory',
      status: '1',
      parentId,
      createTime: new Date().toISOString(),
    }
    if (entry.name.length < 2) {
      return failure(40002, '名称过短 / Name too short', 400, {
        name: '名称至少2个字符 / Name needs 2+ characters',
      })
    }
    const invalid = validatePermission(entry, entry.id)
    if (invalid) return invalid
    state.permissions.push(entry)
    return ok(permissionDto(entry, locale))
  }

  const match = path.match(/^\/system\/permissions\/([^/]+)$/)
  if (match) {
    const permission = state.permissions.find((item) => item.id === match[1])
    if (!permission) return failure(40401, '权限不存在 / Permission not found', 404)
    if (method === 'GET') return ok(permissionDto(permission, locale))
    if (method === 'PATCH') {
      const payload = bodyOf(config)
      const next = {
        ...permission,
        name: payload.name !== undefined ? trim(payload.name) : permission.name,
        path: payload.path !== undefined ? trim(payload.path) : permission.path,
        action: payload.action !== undefined ? trim(payload.action) || null : permission.action,
        type:
          payload.type !== undefined
            ? (trim(payload.type) as 'menu' | 'action' | 'directory')
            : permission.type,
        status: payload.status !== undefined ? trim(payload.status) : permission.status,
      }
      if (next.name.length < 2) {
        return failure(40002, '名称过短 / Name too short', 400, {
          name: '名称至少2个字符 / Name needs 2+ characters',
        })
      }
      const invalid = validatePermission(
        {
          ...next,
          action: next.action ?? '',
          type: next.type,
        },
        permission.id,
      )
      if (invalid) return invalid
      if (next.status === '0') {
        const descendants = descendantIds(state.permissions, permission.id).filter(
          (id) => id !== permission.id,
        )
        if (
          state.permissions.some(
            (item) => descendants.includes(item.id) && item.status === '1',
          )
        ) {
          return failure(40901, '请先停用全部子权限 / Disable descendants first', 409)
        }
      }
      if (next.type === 'action' && state.permissions.some((item) => item.parentId === permission.id)) {
        return failure(40901, '操作类型不能有子权限 / Action cannot have children', 409)
      }
      Object.assign(permission, next, { updateTime: new Date().toISOString() })
      return ok('ok')
    }
    if (method === 'DELETE') {
      const all = descendantIds(state.permissions, permission.id)
      if (
        state.permissions.some(
          (item) => all.includes(item.id) && referencedPermission(item),
        )
      ) {
        return failure(40901, '权限（或其子权限）仍被角色或用户引用 / Permission is referenced', 409)
      }
      state.permissions = state.permissions.filter((item) => !all.includes(item.id))
      return ok('ok')
    }
  }

  return null
}

function handleLogs(
  method: string,
  path: string,
  config: InternalAxiosRequestConfig,
): Reply | null {
  if (method !== 'GET' || path !== '/system/operation-logs') return null
  const params = paramsOf(config)
  const username = trim(params.username)
  const routePath = trim(params.path)
  const status = trim(params.status)
  const from = trim(params.from)
  const to = trim(params.to)

  const rows = state.logs.filter((log) => {
    if (username && !log.username.includes(username)) return false
    if (routePath && !log.path.includes(routePath)) return false
    if (status && String(log.status) !== status) return false
    if (from && new Date(log.createTime).getTime() < new Date(from).getTime()) return false
    if (to && new Date(log.createTime).getTime() > new Date(to).getTime()) return false
    return true
  })

  return ok(paginate(rows, numberParam(params.page, 1), numberParam(params.size, 10)))
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const started = Date.now()
  const method = (config.method ?? 'get').toUpperCase()
  const rawPath = (config.url ?? '').replace(/^https?:\/\/[^/]+/, '')
  const path = rawPath.replace(/^\/api\/v1/, '').split('?')[0]
  const actor = currentUsername()
  const isPublic = method === 'POST' && /^\/auth\/(login|refresh)$/.test(path)

  let reply: Reply
  if (!isPublic && !header(config, 'Authorization')) {
    reply = failure(40101, '未登录 / Not authenticated', 401)
  } else {
    reply =
      handleAuth(method, path, config) ??
      handleUsers(method, path, config, actor) ??
      handleRoles(method, path, config) ??
      handleGroups(method, path, config) ??
      handlePermissions(method, path, config) ??
      handleLogs(method, path, config) ??
      failure(40401, `Mock route not found: ${method} ${path}`, 404)
  }

  recordLog(config, reply.status, actor, Date.now() - started)

  const response: AxiosResponse = {
    data: reply.body,
    status: reply.status,
    statusText: reply.status === 200 ? 'OK' : 'Error',
    headers: {},
    config,
  }

  if (reply.status >= 400) {
    throw new AxiosError(
      reply.body.message,
      String(reply.status),
      config,
      undefined,
      response,
    )
  }

  return response
}

export function installMock() {
  state = resetState()
  http.defaults.adapter = mockAdapter
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    localStorage.setItem(CURRENT_USER_KEY, 'super')
  }
}
