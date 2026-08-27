import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { refreshTokens } from '~~/server/db/schema'
import { verifyRefreshToken } from '~~/server/utils/jwt'

const bodySchema = z.object({
  refreshToken: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()

  try {
    const payload = verifyRefreshToken(body.refreshToken)
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.uniqueId, payload.jti))
  } catch {
    // token already invalid — logout is idempotent either way
  }

  return { data: { loggedOut: true } }
})
