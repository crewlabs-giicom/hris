import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduleAdjustments } from '~~/server/db/schema'
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
    .from(scheduleAdjustments)
    .where(and(eq(scheduleAdjustments.id, id), isNull(scheduleAdjustments.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Schedule adjustment not found' })
  }

  await db
    .update(scheduleAdjustments)
    .set({
      deletedAt: new Date(),
      deletedBy: user.sub,
    })
    .where(eq(scheduleAdjustments.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
