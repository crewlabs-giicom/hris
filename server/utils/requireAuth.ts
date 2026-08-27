import type { H3Event } from 'h3'
import { getHeader, createError, getCookie } from 'h3'
import { verifyAccessToken, type AccessTokenPayload } from './jwt'

/**
 * Use inside any /server/api handler that requires a logged-in user.
 * Reads the Bearer token from the Authorization header, or falls back to
 * the 'baseque_access_token' cookie.
 *
 * Usage: const user = requireAuth(event)
 */
export function requireAuth(event: H3Event): AccessTokenPayload {
  let token: string | undefined

  const header = getHeader(event, 'authorization')
  if (header?.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length)
  } else {
    token = getCookie(event, 'baseque_access_token')
  }

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing access token' })
  }

  try {
    return verifyAccessToken(token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired access token' })
  }
}

/**
 * Use after requireAuth() to restrict an endpoint to specific roles.
 * Usage: const user = requireAuth(event); requireRole(user, ['hr_admin', 'super_admin'])
 */
export function requireRole(user: AccessTokenPayload, allowed: string[]) {
  if (!allowed.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient role for this action' })
  }
}
