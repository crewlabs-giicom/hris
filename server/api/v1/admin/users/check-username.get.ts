import { getQuery } from 'h3'
import { and, eq, ne } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission } from '~~/server/utils/rbac'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.view')

  const query = getQuery(event)
  const username = typeof query.username === 'string' ? query.username.trim() : ''
  const excludeUserId = typeof query.excludeUserId === 'string' ? query.excludeUserId : undefined

  if (username.length < 3) {
    return { available: false }
  }

  const where = excludeUserId
    ? and(eq(users.username, username), ne(users.id, excludeUserId))
    : eq(users.username, username)

  const [existing] = await db.select().from(users).where(where).limit(1)
  return { available: !existing }
})
