import { useDb } from '~~/server/db'
import { schedules, employees, shifts, users } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { and, isNull, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()

  const rows = await db
    .select({
      id: schedules.id,
      nik: employees.nik,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      shiftCode: shifts.code,
      shiftName: shifts.name,
      shiftIn: shifts.shiftIn,
      shiftOut: shifts.shiftOut,
      isFix: schedules.isFix,
      isOff: schedules.isOff,
      validFrom: schedules.validFrom,
      validTo: schedules.validTo,
      createdAt: schedules.createdAt,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${schedules.createdBy} LIMIT 1)`
    })
    .from(schedules)
    .innerJoin(employees, eq(schedules.employeeId, employees.id))
    .innerJoin(shifts, eq(schedules.shiftId, shifts.id))
    .where(isNull(schedules.deletedAt))
    .orderBy(schedules.createdAt)

  return { data: rows }
})
