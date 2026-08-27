import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduleAdjustments, employees, shifts, users, teamHasUsers, teams } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(scheduleAdjustments.deletedAt)]

  // Filter: OFF/non OFF (isOff)
  if (query.isOff !== undefined && query.isOff !== '') {
    conditions.push(eq(scheduleAdjustments.isOff, Number(query.isOff)))
  }

  // Filter: Month (on adjustmentDate)
  if (query.month) {
    conditions.push(sql`MONTH(${scheduleAdjustments.adjustmentDate}) = ${Number(query.month)}`)
  }

  // Filter: Year (on adjustmentDate)
  if (query.year) {
    conditions.push(sql`YEAR(${scheduleAdjustments.adjustmentDate}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, employee code/NIK)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal)
      ) as SQL
    )
  }

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(scheduleAdjustments)
    .innerJoin(employees, eq(scheduleAdjustments.employeeId, employees.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated rows with employee, shift, team details
  const rows = await db
    .select({
      id: scheduleAdjustments.id,
      employeeId: scheduleAdjustments.employeeId,
      shiftId: scheduleAdjustments.shiftId,
      status: scheduleAdjustments.status,
      isOff: scheduleAdjustments.isOff,
      adjustmentDate: scheduleAdjustments.adjustmentDate,
      createdAt: scheduleAdjustments.createdAt,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      shiftCode: shifts.code,
      shiftName: shifts.name,
      shiftIn: shifts.shiftIn,
      shiftOut: shifts.shiftOut,
      creatorEmail: users.email,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${scheduleAdjustments.createdBy} LIMIT 1)`
    })
    .from(scheduleAdjustments)
    .innerJoin(employees, eq(scheduleAdjustments.employeeId, employees.id))
    .innerJoin(shifts, eq(scheduleAdjustments.shiftId, shifts.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .leftJoin(users, eq(scheduleAdjustments.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(sql`${scheduleAdjustments.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    shiftId: r.shiftId,
    status: r.status,
    isOff: r.isOff,
    adjustmentDate: r.adjustmentDate,
    createdAt: r.createdAt,
    createdByVal: r.creatorFullName || r.creatorEmail || 'System',
    employee: {
      id: r.employeeId,
      employeeCode: r.employeeCode,
      fullName: r.employeeFullName,
      team: r.teamName ? { name: r.teamName } : null,
    },
    shift: {
      id: r.shiftId,
      code: r.shiftCode,
      name: r.shiftName,
      shiftIn: r.shiftIn,
      shiftOut: r.shiftOut,
    }
  }))

  return {
    data,
    meta: {
      page,
      perPage,
      total,
    },
  }
})
