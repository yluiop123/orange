export type Envelope<T> = {
  code: number
  message: string
  data: T
  timestamp?: number
  traceId?: string
}

export type PageResult<T> = {
  total: number
  list: T[]
  page?: number
  size?: number
  totalPages?: number
}

export type UserRole = { id: string; name: string }

export type PermissionInfo = {
  path: string
  role?: string
  type: string
  action?: string | null
  name?: string
}

export type UserInfo = {
  id?: string
  name?: string
  username?: string
  email?: string
  groupId?: string
  groupName?: string
  phone?: string
  status?: string
  mustChangePassword?: boolean
  roles?: UserRole[]
  rolePermissions?: PermissionInfo[]
  userPermissions?: PermissionInfo[]
}

export type MenuInfo = {
  id: string
  path: string
  type: 'menu' | 'directory'
  name: string
  children?: MenuInfo[]
}

export type LoginResult = {
  token: string
  expiresIn?: number
  refreshExpiresIn?: number
  status?: 'ok' | 'error'
  field?: string
  msg?: string
}

export type User = {
  id: string
  name: string
  username: string
  email: string
  groupId: string
  groupName: string
  phone: string
  status: string
  createTime: string
  updateTime?: string
  roles?: UserRole[]
  permissions?: string[]
}

export type UserPayload = {
  name?: string
  username?: string
  email?: string
  groupId?: string
  phone?: string
  status?: string
  roles?: string[]
  permissions?: string[]
}

export type UserQuery = {
  keyword?: string
  status?: string
  groupId?: string
  sort?: string
  direction?: 'asc' | 'desc' | ''
  page: number
  size: number
}

export type Role = {
  id: string
  name: string
  status: string
  permissions?: string[]
  createTime?: string
  updateTime?: string
}

export type RoleQuery = {
  id?: string
  name?: string
  status?: string
  sort?: string
  direction?: 'asc' | 'desc' | ''
  page: number
  size: number
}

export type RolePayload = {
  id?: string
  name?: string
  status?: string
  permissions?: string[]
}

export type Group = {
  id: string
  name: string
  status?: string
  parentId?: string | null
  createTime?: string
  updateTime?: string
}

export type GroupQuery = {
  id?: string
  name?: string
  status?: string
}

export type GroupPayload = {
  id?: string
  name?: string
  status?: string
  parentId?: string | null
}

export type PermissionTypeValue = 'menu' | 'directory' | 'action'

export type Permission = {
  id: string
  name: string
  translations?: Record<string, string>
  path: string
  action?: string | null
  type?: PermissionTypeValue
  status?: string
  parentId?: string | null
  createTime?: string
  updateTime?: string
}

export type PermissionQuery = {
  id?: string
  name?: string
  path?: string
  status?: string
  type?: string
}

export type PermissionPayload = {
  id?: string
  name?: string
  translations?: Record<string, string>
  path?: string
  action?: string
  type?: PermissionTypeValue
  status?: string
  parentId?: string | null
}

export type OperationLog = {
  id: number
  traceId: string
  username: string
  method: string
  path: string
  queryString?: string
  requestBody?: string
  status: number
  durationMs: number
  ip: string
  createTime: string
}

export type OperationLogQuery = {
  username?: string
  path?: string
  status?: string
  from?: string
  to?: string
  page: number
  size: number
}
