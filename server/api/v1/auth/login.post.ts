import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users, refreshTokens } from '~~/server/db/schema'
import { verifyPassword, hashToken } from '~~/server/utils/password'
import { signAccessToken, signRefreshToken } from '~~/server/utils/jwt'
import { writeAuditLog } from '~~/server/utils/transaction'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()

  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)

  if (!user || !user.passwordHash || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const valid = await verifyPassword(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })

  // Refresh token: generate a random jti, store its hash so it can be revoked later
  const jti = crypto.randomUUID()
  const refreshToken = signRefreshToken({ sub: user.id, jti })
  const tokenHash = await hashToken(refreshToken)

  const config = useRuntimeConfig()
  const expiresAt = new Date(Date.now() + parseTtlMs(config.jwtRefreshTtl))

  await db.insert(refreshTokens).values({
    uniqueId: jti,
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  await writeAuditLog(db, { actorUserId: user.id, action: 'auth.login', targetType: 'user', targetId: user.id })

  return {
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  }
})

function parseTtlMs(ttl: string) {
  // supports formats like "30d", "15m", "1h"
  const match = ttl.match(/^(\d+)([smhd])$/)
  if (!match) return 30 * 24 * 60 * 60 * 1000
  const [, num, unit] = match
  const n = Number(num)
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd']
  return n * unitMs
}
