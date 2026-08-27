import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { schedules } from '~~/server/db/schema'
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
    .from(schedules)
    .where(and(eq(schedules.id, id), isNull(schedules.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Schedule not found' })
  }

  await db
    .update(schedules)
    .set({
      deletedAt: new Date(),
      deletedBy: user.sub,
    })
    .where(eq(schedules.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
