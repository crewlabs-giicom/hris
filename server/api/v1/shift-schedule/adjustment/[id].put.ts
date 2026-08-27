import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduleAdjustments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const { employeeId, shiftId, isOff, status, adjustmentDate } = body

  if (!employeeId || !shiftId || !adjustmentDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, shiftId, adjustmentDate',
    })
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
      employeeId: Number(employeeId),
      shiftId: Number(shiftId),
      isOff: isOff ? 1 : 0,
      status: status || existing.status,
      adjustmentDate: new Date(adjustmentDate),
      updatedBy: user.sub,
      updatedAt: new Date(),
    })
    .where(eq(scheduleAdjustments.id, id))

  return {
    data: {
      success: true,
    },
  }
})
