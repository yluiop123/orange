/** Shared API types. Mirrors `docs/API.md` and `contracts/openapi.json`. */

export type PermissionType = 'menu' | 'directory' | 'action';

export interface Permission {
  role?: string;
  type: PermissionType;
  path: string;
  action?: string | null;
}

export interface RoleRef {
  id: string;
  name: string;
}

export interface UserInfo {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  groupId?: string;
  groupName?: string;
  phone?: string;
  status?: string;
  mustChangePassword?: boolean;
  roles?: RoleRef[];
  userPermissions?: Permission[];
  rolePermissions?: Permission[];
}

export interface MenuNode {
  id: string;
  name: string;
  path: string;
  type: PermissionType | string;
  parentId?: string | null;
  action?: string | null;
  status?: string;
  children: MenuNode[];
}

export interface Envelope<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
  traceId?: string;
}

export interface PageResult<T> {
  total: number;
  list: T[];
  page?: number;
  size?: number;
  totalPages?: number;
}

export type Status = '0' | '1';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  groupId: string;
  groupName: string;
  status: Status;
  roles?: RoleRef[];
  permissions?: string[];
  createTime?: string;
  updateTime?: string;
}

export interface Group {
  id: string;
  name: string;
  parentId?: string | null;
  status?: Status;
  createTime?: string;
  children?: Group[];
}

export interface PermissionRow {
  id: string;
  name: string;
  path: string;
  type: PermissionType;
  action?: string | null;
  parentId?: string | null;
  status?: Status;
  children?: PermissionRow[];
  createTime?: string;
}

export interface Role {
  id: string;
  name: string;
  status: Status;
  permissions?: string[];
  createTime?: string;
}

export interface OperationLog {
  id: number;
  username?: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip?: string;
  traceId?: string;
  queryString?: string;
  requestBody?: string;
  createTime: string;
}

export interface TokenResponse {
  token: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
}

export interface ListParams {
  page: number;
  size: number;
  [key: string]: string | number | undefined;
}
