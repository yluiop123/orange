import http from './http'
import type { Envelope, PageResult, Role, RolePayload, RoleQuery } from './types'

export async function listRoles(params: RoleQuery, signal?: AbortSignal) {
  const response = await http.get<Envelope<PageResult<Role>>>('/system/roles', { params, signal })
  return response.data.data
}

export async function getRole(id: string) {
  const response = await http.get<Envelope<Role>>(`/system/roles/${id}`)
  return response.data.data
}

export async function createRole(payload: RolePayload) {
  const response = await http.post<Envelope<string>>('/system/roles', payload)
  return response.data.data
}

export async function updateRole(id: string, payload: RolePayload) {
  await http.patch(`/system/roles/${id}`, { ...payload, id })
}

export async function deleteRoles(ids: string[]) {
  if (ids.length === 0) return
  await http.delete('/system/roles', { params: { ids: ids.join(',') } })
}
