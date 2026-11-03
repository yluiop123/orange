import http from './http'
import type { Envelope, LoginResult, MenuInfo, UserInfo } from './types'

export async function login(payload: { username: string; password: string }) {
  const response = await http.post<Envelope<LoginResult>>('/auth/login', payload)
  return response.data.data
}

export async function refresh() {
  const response = await http.post<Envelope<LoginResult>>('/auth/refresh')
  return response.data.data
}

export async function logout(token?: string) {
  await http.post('/auth/logout', undefined, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function fetchUserInfo() {
  const response = await http.get<Envelope<UserInfo>>('/auth/user-info')
  return response.data.data
}

export async function fetchMenus() {
  const response = await http.get<Envelope<MenuInfo[]>>('/auth/menus')
  return response.data.data ?? []
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const response = await http.post<Envelope<string>>('/auth/change-password', {
    oldPassword,
    newPassword,
  })
  return response.data
}
