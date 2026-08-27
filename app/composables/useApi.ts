/**
 * Thin $fetch wrapper attaching the current access token. Use for all authenticated
 * calls from admin pages instead of raw $fetch.
 *
 * On a 401, transparently refreshes the access token and retries once — this is what
 * keeps a long-idle tab from getting bounced to /login just because the short-lived
 * access token expired. Logout only happens if the refresh itself fails, meaning the
 * refresh token is genuinely invalid/expired/revoked (i.e. a real forced-logout case).
 */
export async function useApi<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  const auth = useAuthStore()

  function doFetch(token: string | null) {
    return $fetch<T>(url, {
      ...opts,
      headers: {
        ...(opts?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  const isAuthEndpoint = url.startsWith('/api/v1/auth/')

  try {
    return await doFetch(auth.accessToken)
  } catch (err: any) {
    const status = err?.statusCode ?? err?.response?.status
    if (status === 401 && !isAuthEndpoint && auth.refreshToken) {
      try {
        await auth.refresh()
        return await doFetch(auth.accessToken)
      } catch {
        await auth.logout()
        await navigateTo('/login')
      }
    }
    throw err
  }
}
