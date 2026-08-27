import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { activationTokens, users } from '~~/server/db/schema'
import { hashPassword, verifyTokenHash } from '~~/server/utils/password'

const bodySchema = z.object({
  token: z.string().min(1), // raw activation token from the invite link
  password: z.string().min(8),
})

/**
 * Called when an employee sets their own password after signing their contract.
 * The activation token is generated and emailed out-of-band (e.g. by HR admin
 * action on the employees API) when the employee's status moves to
 * "pending_activation" — that trigger isn't implemented here yet.
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()

  const candidates = await db
    .select()
    .from(activationTokens)
    .where(isNull(activationTokens.usedAt))

  const match = await Promise.any(
    candidates.map(async (c) => ((await verifyTokenHash(body.token, c.tokenHash)) ? c : Promise.reject()))
  ).catch(() => undefined)

  if (!match || match.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired activation link' })
  }

  const passwordHash = await hashPassword(body.password)

  await db.update(users).set({ passwordHash }).where(eq(users.id, match.userId))
  await db.update(activationTokens).set({ usedAt: new Date() }).where(eq(activationTokens.id, match.id))

  // TODO: also flip the linked employees.employment_status from
  // "pending_activation" to "active" here.

  return { data: { activated: true } }
})
