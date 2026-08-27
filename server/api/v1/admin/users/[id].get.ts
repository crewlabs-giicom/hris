import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission, getUserRoleNames } from '~~/server/utils/rbac'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.view')

  const id = getRouterParam(event, 'id') as string
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return { data: { ...row, passwordHash: undefined, roles: await getUserRoleNames(db, id) } }
})
