import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { authToken } from '@/auth/token'
import { sessionHint } from '@/auth/session'
import { forcedPasswordChange } from '@/auth/forced'
import { ALL_ROLES, computePermissions } from '@/lib/access'
import type { PermissionInfo, UserInfo, UserRole } from '@/api/types'
import { useMenuStore } from './menu'

const ROLE_STORAGE_PREFIX = 'orange.currentRole.'
const STALE_PERMISSION_IDS = 'orange.stalePermissionIds'

type NormalizedUser = UserInfo & {
  roles: UserRole[]
  rolePermissions: PermissionInfo[]
  userPermissions: PermissionInfo[]
  currentRole: string
}

function readStoredRole(username?: string): string | null {
  if (!username) return null
  return localStorage.getItem(ROLE_STORAGE_PREFIX + username)
}

function writeStoredRole(username: string | undefined, role: string) {
  if (!username) return
  localStorage.setItem(ROLE_STORAGE_PREFIX + username, role)
}

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref<NormalizedUser | null>(null)
  const loading = ref(false)

  const currentPermissions = computed<PermissionInfo[]>(() => {
    if (!userInfo.value) return []
    return computePermissions({
      currentRole: userInfo.value.currentRole,
      userPermissions: userInfo.value.userPermissions,
      rolePermissions: userInfo.value.rolePermissions,
    })
  })

  const roles = computed<UserRole[]>(() => userInfo.value?.roles ?? [])

  const mustChangePassword = computed(
    () => Boolean(userInfo.value?.mustChangePassword) || forcedPasswordChange.value,
  )

  function login(token: string, expiresIn?: number) {
    authToken.set(token, expiresIn)
    sessionHint.set()
  }

  async function fetchUser(): Promise<NormalizedUser | null> {
    if (!authToken.get()) return null
    loading.value = true
    try {
      const data = await authApi.fetchUserInfo()
      if (!data) throw new Error('empty user-info')
      const storedRole = readStoredRole(data.username)
      const currentRole =
        storedRole && data.roles?.some((role) => role.id === storedRole) ? storedRole : ALL_ROLES
      const normalized: NormalizedUser = {
        ...data,
        roles: data.roles ?? [],
        rolePermissions: data.rolePermissions ?? [],
        userPermissions: data.userPermissions ?? [],
        currentRole,
      }
      userInfo.value = normalized
      // Backend grants are authoritative; only UI filtering changes with the role switch.
      localStorage.removeItem(STALE_PERMISSION_IDS)
      return normalized
    } catch {
      clearSession()
      return null
    } finally {
      loading.value = false
    }
  }

  function setRole(role: string) {
    if (!userInfo.value) return
    userInfo.value = { ...userInfo.value, currentRole: role }
    writeStoredRole(userInfo.value.username, role)
  }

  function clearSession() {
    authToken.clear()
    sessionHint.clear()
    forcedPasswordChange.value = false
    userInfo.value = null
    useMenuStore().clearMenus()
  }

  function logout() {
    const token = authToken.get()
    clearSession()
    // Best effort: revoke the access token and clear the refresh cookie.
    authApi.logout(token ?? undefined).catch(() => undefined)
  }

  return {
    userInfo,
    loading,
    roles,
    currentPermissions,
    mustChangePassword,
    login,
    fetchUser,
    setRole,
    clearSession,
    logout,
  }
})
