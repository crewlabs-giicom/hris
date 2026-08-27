import { useDb } from '~~/server/db'
import { scheduleAdjustments, employees, shifts } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { isNull, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()

  const rows = await db
    .select({
      id: scheduleAdjustments.id,
      nik: employees.nik,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      shiftCode: shifts.code,
      shiftName: shifts.name,
      shiftIn: shifts.shiftIn,
      shiftOut: shifts.shiftOut,
      isOff: scheduleAdjustments.isOff,
      adjustmentDate: scheduleAdjustments.adjustmentDate,
      status: scheduleAdjustments.status,
      createdAt: scheduleAdjustments.createdAt,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${scheduleAdjustments.createdBy} LIMIT 1)`
    })
    .from(scheduleAdjustments)
    .innerJoin(employees, eq(scheduleAdjustments.employeeId, employees.id))
    .innerJoin(shifts, eq(scheduleAdjustments.shiftId, shifts.id))
    .where(isNull(scheduleAdjustments.deletedAt))
    .orderBy(scheduleAdjustments.createdAt)

  return { data: rows }
})
