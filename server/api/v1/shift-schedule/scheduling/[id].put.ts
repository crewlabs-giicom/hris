import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { schedules } from '~~/server/db/schema'
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
  const { employeeId, shiftId, isFix, isOff, validFrom, validTo } = body

  if (!employeeId || !shiftId || !validFrom || !validTo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, shiftId, validFrom, validTo',
    })
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
      employeeId: Number(employeeId),
      shiftId: Number(shiftId),
      isFix: isFix ? 1 : 0,
      isOff: isOff ? 1 : 0,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      updatedBy: user.sub,
      updatedAt: new Date(),
    })
    .where(eq(schedules.id, id))

  return {
    data: {
      success: true,
    },
  }
})
