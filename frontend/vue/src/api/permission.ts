import http from './http'
import type {
  Envelope,
  Permission,
  PermissionPayload,
  PermissionQuery,
  PermissionTypeValue,
} from './types'

export async function listPermissions(params: PermissionQuery = {}, signal?: AbortSignal) {
  const response = await http.get<Envelope<Permission[]>>('/system/permissions', { params, signal })
  return response.data.data ?? []
}

export async function getPermission(id: string) {
  const response = await http.get<Envelope<Permission>>(`/system/permissions/${id}`)
  return response.data.data
}

export async function updatePermission(id: string, payload: PermissionPayload) {
  await http.patch(`/system/permissions/${id}`, { ...payload, id })
}

export async function addPermissionChild(payload: {
  id: string
  name: string
  translations?: Record<string, string>
  path: string
  type: PermissionTypeValue
  action?: string
  parentId?: string
}) {
  await http.post('/system/permissions/children', payload)
}

export async function deletePermissions(ids: string[]) {
  if (ids.length === 0) return
  await http.delete('/system/permissions', { params: { ids: ids.join(',') } })
}
