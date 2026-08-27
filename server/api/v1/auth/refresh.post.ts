import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users, refreshTokens } from '~~/server/db/schema'
import { verifyRefreshToken, signAccessToken } from '~~/server/utils/jwt'
import { verifyTokenHash } from '~~/server/utils/password'

const bodySchema = z.object({
  refreshToken: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()

  let payload
  try {
    payload = verifyRefreshToken(body.refreshToken)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired refresh token' })
  }

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.uniqueId, payload.jti), isNull(refreshTokens.revokedAt)))
    .limit(1)

  if (!stored || stored.expiresAt < new Date()) {
    throw createError({ statusCode: 401, statusMessage: 'Refresh token revoked or expired' })
  }

  const matches = await verifyTokenHash(body.refreshToken, stored.tokenHash)
  if (!matches) {
    throw createError({ statusCode: 401, statusMessage: 'Refresh token mismatch' })
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)
  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'User no longer active' })
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })

  return { data: { accessToken } }
})
