import { useDb } from '~~/server/db'
import { scheduleAdjustments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const body = await readBody(event)
  const { employeeId, shiftId, isOff, adjustmentDate } = body

  if (!employeeId || !shiftId || !adjustmentDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, shiftId, adjustmentDate',
    })
  }

  const db = useDb()

  const [result] = await db.insert(scheduleAdjustments).values({
    employeeId: Number(employeeId),
    shiftId: Number(shiftId),
    isOff: isOff ? 1 : 0,
    adjustmentDate: new Date(adjustmentDate),
    status: 'active',
    createdBy: user.sub,
    updatedBy: user.sub,
  })

  return {
    data: {
      id: result.insertId,
      success: true,
    },
  }
})
