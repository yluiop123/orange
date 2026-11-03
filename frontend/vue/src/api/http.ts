import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { currentLocale } from '@/i18n'
import { useUiStore } from '@/stores/ui'
import { forcedPasswordChange } from '@/auth/forced'
import { emitSessionExpired } from '@/auth/events'
import { sessionHint } from '@/auth/session'
import { authToken } from '@/auth/token'
import type { Envelope } from './types'

function normalizeBase(value: string | undefined): string {
  const base = value?.trim() || '/api/v1/'
  return base.endsWith('/') ? base : `${base}/`
}

export const API_BASE = normalizeBase(import.meta.env.VITE_API_BASE)

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  // The refresh token is an HttpOnly cookie scoped to /api/v1/auth.
  withCredentials: true,
})

function isAuthEndpoint(url?: string) {
  return !!url && /(?:^|\/)auth\/(login|refresh|logout)(?:\?|$)/.test(url)
}

let refreshing: Promise<string | null> | null = null

/** Coalesce concurrent 401s into a single refresh round-trip. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = instance
      .post('/auth/refresh', undefined, { _skipAuthRefresh: true } as RetryConfig)
      .then((response) => {
        const data = (response.data as Envelope<{ token?: string; expiresIn?: number }>)?.data
        const token = data?.token ?? null
        authToken.set(token, data?.expiresIn)
        if (!token) sessionHint.clear()
        return token
      })
      .catch(() => {
        authToken.clear()
        sessionHint.clear()
        return null
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

instance.interceptors.request.use(
  async (config) => {
    if (authToken.isExpiring() && !isAuthEndpoint(config.url)) {
      const token = await refreshAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }

    const token = authToken.get()
    if (token) config.headers.Authorization = `Bearer ${token}`
    config.headers.Locale = currentLocale()
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

instance.interceptors.response.use(
  (response) => {
    const body = response.data as Envelope<unknown> | undefined
    if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
      const message = body.message || 'Request failed'
      useUiStore().notify(message, 'error')
      return Promise.reject(body)
    }
    return response
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const original = error.config as RetryConfig | undefined
    const url = original?.url
    const body = error.response?.data as
      | (Envelope<unknown> & { data?: Record<string, string> })
      | undefined

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint(url)) {
      original._retry = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return instance(original)
      }
      useUiStore().notify('登录已过期，请重新登录 / Session expired', 'error')
      authToken.clear()
      sessionHint.clear()
      emitSessionExpired()
      return Promise.reject(error)
    }

    if (isAuthEndpoint(url)) {
      return Promise.reject(error)
    }

    if (error.response?.status === 403) {
      if (body?.code === 40302) {
        forcedPasswordChange.value = true
      } else {
        useUiStore().showForbidden(url ?? '', body?.message || '没有执行该操作的权限 / Forbidden')
      }
      return Promise.reject(error)
    }

    useUiStore().notify(
      body?.message || error.message || '网络异常 / Network error',
      'error',
    )
    return Promise.reject(error)
  },
)

export default instance
