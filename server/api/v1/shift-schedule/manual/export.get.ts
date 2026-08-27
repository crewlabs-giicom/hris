import { useDb } from '~~/server/db'
import { manualAttendances, employees, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { isNull, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()

  const rows = await db
    .select({
      id: manualAttendances.id,
      nik: employees.nik,
      employeeCode: employees.employeeCode,
      fullName: employees.fullName,
      teamName: teams.name,
      manualAttendanceType: manualAttendances.manualAttendanceType,
      startDate: manualAttendances.startDate,
      endDate: manualAttendances.endDate,
      clockIn: manualAttendances.clockIn,
      clockOut: manualAttendances.clockOut,
      isLate: manualAttendances.isLate,
      freeAttendances: manualAttendances.freeAttendances,
      description: manualAttendances.description,
      status: manualAttendances.status,
      createdAt: manualAttendances.createdAt,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${manualAttendances.createdBy} LIMIT 1)`
    })
    .from(manualAttendances)
    .innerJoin(employees, eq(manualAttendances.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(isNull(manualAttendances.deletedAt))
    .orderBy(manualAttendances.createdAt)

  return { data: rows }
})
