import { defineStore } from 'pinia'

interface AuthUser {
  id: string
  email: string
  role: string
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days — matches JWT_REFRESH_TTL

/**
 * Setup-store backed by useCookie (same pattern as useSidebar) instead of plain
 * in-memory state — SSR-safe and survives reload/tab-close. The cookie is the
 * real session lifetime; nothing here force-logs-out on its own except an
 * explicit logout() call or a failed refresh (see useApi's retry-on-401).
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = useCookie<string | null>('baseque_access_token', {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  const refreshToken = useCookie<string | null>('baseque_refresh_token', {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  const user = useCookie<AuthUser | null>('baseque_user', {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  async function login(email: string, password: string) {
    const res = await $fetch<{ data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
      '/api/v1/auth/login',
      { method: 'POST', body: { email, password } }
    )
    accessToken.value = res.data.accessToken
    refreshToken.value = res.data.refreshToken
    user.value = res.data.user
  }

  async function logout() {
    if (refreshToken.value) {
      await $fetch('/api/v1/auth/logout', { method: 'POST', body: { refreshToken: refreshToken.value } }).catch(
        () => {}
      )
    }
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  async function refresh() {
    if (!refreshToken.value) return
    const res = await $fetch<{ data: { accessToken: string } }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refreshToken.value },
    })
    accessToken.value = res.data.accessToken
  }

  return { accessToken, refreshToken, user, login, logout, refresh }
})
