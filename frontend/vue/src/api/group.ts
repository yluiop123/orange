import http from './http'
import type { Envelope, Group, GroupPayload, GroupQuery } from './types'

export async function listGroups(params: GroupQuery = {}, signal?: AbortSignal) {
  const response = await http.get<Envelope<Group[]>>('/system/groups', { params, signal })
  return response.data.data ?? []
}

export async function getGroup(id: string) {
  const response = await http.get<Envelope<Group>>(`/system/groups/${id}`)
  return response.data.data
}

export async function updateGroup(id: string, payload: GroupPayload) {
  await http.patch(`/system/groups/${id}`, { ...payload, id })
}

export async function updateGroupStatus(id: string, status: string) {
  await http.patch(`/system/groups/${id}/status`, { status })
}

export async function addGroupChild(payload: { id: string; name: string; parentId?: string }) {
  await http.post('/system/groups/children', payload)
}

export async function deleteGroups(ids: string[]) {
  if (ids.length === 0) return
  await http.delete('/system/groups', { params: { ids: ids.join(',') } })
}
