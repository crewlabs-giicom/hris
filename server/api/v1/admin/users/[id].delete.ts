import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users, refreshTokens } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission } from '~~/server/utils/rbac'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.delete')

  const id = getRouterParam(event, 'id') as string

  if (user.sub === id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot deactivate your own account' })
  }

  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await db.update(users).set({ isActive: false }).where(eq(users.id, id))

  // Deactivating is the "forced logout" mechanism: revoke every still-live refresh
  // token so the user's session actually dies (next silent-refresh attempt gets a
  // 401) instead of quietly working until the 30-day token expires naturally.
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, id), isNull(refreshTokens.revokedAt)))

  return { data: { id, isActive: false } }
})
