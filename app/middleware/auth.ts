export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  // Only force the login redirect when there's truly no session left (both tokens
  // gone). A missing/expired accessToken with a live refreshToken is not a logout —
  // useApi's retry-on-401 will silently mint a fresh access token on first request.
  if (!auth.accessToken && !auth.refreshToken && to.path !== '/login') {
    return navigateTo('/login')
  }
})
