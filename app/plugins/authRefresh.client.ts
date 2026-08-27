/**
 * Proactively refreshes the access token every 10 minutes (well under the 15-minute
 * access token TTL) so a tab left open and idle doesn't hit a 401 on its next request.
 * useApi's retry-on-401 already self-heals that case, but this avoids the extra
 * round-trip/flash for the common "came back after a coffee break" scenario.
 */
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()

  setInterval(
    () => {
      if (auth.refreshToken) {
        auth.refresh().catch(() => {
          // a real failure here (revoked/expired refresh token) will surface on the
          // next actual API call via useApi's retry-on-401, which does the logout.
        })
      }
    },
    10 * 60 * 1000
  )
})
