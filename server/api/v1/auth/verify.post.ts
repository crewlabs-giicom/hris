import { z } from 'zod'
import { requireApiClient } from '~~/server/utils/apiKey'
import { verifyAccessToken } from '~~/server/utils/jwt'

const bodySchema = z.object({
  accessToken: z.string().min(1),
})

/**
 * Called by consumer apps (Backbone, Ticketing) to verify a user's access token.
 * Requires a valid `x-api-key` header identifying the calling app.
 *
 * Per the architecture's downtime-resilience decision, consumers should cache
 * a positive verification result for a short window (e.g. the access token's
 * own TTL) rather than calling this on every single request.
 */
export default defineEventHandler(async (event) => {
  await requireApiClient(event)

  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const payload = verifyAccessToken(body.accessToken)
    return { data: { valid: true, user: payload } }
  } catch {
    return { data: { valid: false } }
  }
})
