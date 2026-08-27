import { useDb } from '~~/server/db'
import { schedules } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const body = await readBody(event)
  const { employeeId, shiftId, isFix, isOff, validFrom, validTo } = body

  if (!employeeId || !shiftId || !validFrom || !validTo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, shiftId, validFrom, validTo',
    })
  }

  const db = useDb()

  const [result] = await db.insert(schedules).values({
    employeeId: Number(employeeId),
    shiftId: Number(shiftId),
    isFix: isFix ? 1 : 0,
    isOff: isOff ? 1 : 0,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
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
