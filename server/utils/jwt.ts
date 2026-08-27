import jwt from 'jsonwebtoken'

export interface AccessTokenPayload {
  sub: number // user id
  email: string
  role: string
}

/**
 * Access token: short-lived, sent on every request.
 * Consumer apps (Backbone, Ticketing) verify this via /api/v1/auth/verify,
 * and should cache the result briefly rather than calling it on every single request
 * (see architecture notes on downtime resilience).
 */
export function signAccessToken(payload: AccessTokenPayload) {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.jwtAccessTtl as any })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtAccessSecret) as unknown as AccessTokenPayload
}

/**
 * Refresh token: long-lived, stored (hashed) in the refresh_tokens table so it
 * can be individually revoked — e.g. on resign, all of a user's refresh tokens
 * are marked revoked, killing every active session across every consumer app.
 */
export function signRefreshToken(payload: { sub: number; jti: string }) {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshTtl as any })
}

export function verifyRefreshToken(token: string): { sub: number; jti: string } {
  const config = useRuntimeConfig()
  return jwt.verify(token, config.jwtRefreshSecret) as unknown as { sub: number; jti: string }
}
