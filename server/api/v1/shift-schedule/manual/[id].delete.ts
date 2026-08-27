import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { manualAttendances } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  const [existing] = await db
    .select()
    .from(manualAttendances)
    .where(and(eq(manualAttendances.id, id), isNull(manualAttendances.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Manual attendance request not found' })
  }

  await db
    .update(manualAttendances)
    .set({
      deletedAt: new Date(),
      deletedBy: user.sub,
    })
    .where(eq(manualAttendances.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
