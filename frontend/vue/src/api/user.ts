import http from './http'
import type { Envelope, PageResult, User, UserPayload, UserQuery } from './types'

export async function listUsers(params: UserQuery, signal?: AbortSignal) {
  const response = await http.get<Envelope<PageResult<User>>>('/system/users', { params, signal })
  return response.data.data
}

export async function getUser(id: string) {
  const response = await http.get<Envelope<User>>(`/system/users/${id}`)
  return response.data.data
}

export async function createUser(payload: UserPayload) {
  const response = await http.post<Envelope<string>>('/system/users', payload)
  return response.data.data
}

export async function updateUser(id: string, payload: UserPayload) {
  await http.patch(`/system/users/${id}`, { ...payload, id })
}

export async function updateUserStatus(id: string, status: string) {
  await http.patch(`/system/users/${id}/status`, { status })
}

export async function resetUserPassword(id: string) {
  const response = await http.post<Envelope<string>>(`/system/users/${id}/reset-password`)
  return response.data.data
}

export async function deleteUsers(ids: string[]) {
  if (ids.length === 0) return
  await http.delete('/system/users', { params: { ids: ids.join(',') } })
}
