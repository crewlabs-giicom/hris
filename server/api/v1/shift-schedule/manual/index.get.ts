import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { manualAttendances, employees, users, teamHasUsers, teams } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(manualAttendances.deletedAt)]

  // Filter: status (multiple selection)
  if (query.status) {
    const statuses = String(query.status).split(',').filter(Boolean)
    if (statuses.length > 0) {
      conditions.push(inArray(manualAttendances.status, statuses))
    }
  }

  // Filter: team (multiple selection)
  if (query.teamId) {
    const teamIds = String(query.teamId).split(',').map(Number).filter(Boolean)
    if (teamIds.length > 0) {
      const teamUserIds = await db
        .select({ userId: teamHasUsers.userId })
        .from(teamHasUsers)
        .where(inArray(teamHasUsers.teamId, teamIds))
      const userIds = teamUserIds.map((t) => t.userId)
      if (userIds.length > 0) {
        conditions.push(inArray(employees.userId, userIds))
      } else {
        conditions.push(eq(employees.id, -1))
      }
    }
  }

  // Filter: Month (on startDate)
  if (query.month) {
    conditions.push(sql`MONTH(${manualAttendances.startDate}) = ${Number(query.month)}`)
  }

  // Filter: Year (on startDate)
  if (query.year) {
    conditions.push(sql`YEAR(${manualAttendances.startDate}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, NIK, or description)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal),
        like(manualAttendances.description, searchVal)
      ) as SQL
    )
  }

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(manualAttendances)
    .innerJoin(employees, eq(manualAttendances.employeeId, employees.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated rows with employee and team details
  const rows = await db
    .select({
      id: manualAttendances.id,
      employeeId: manualAttendances.employeeId,
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
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      creatorEmail: users.email,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${manualAttendances.createdBy} LIMIT 1)`
    })
    .from(manualAttendances)
    .innerJoin(employees, eq(manualAttendances.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .leftJoin(users, eq(manualAttendances.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(sql`${manualAttendances.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    manualAttendanceType: r.manualAttendanceType,
    startDate: r.startDate,
    endDate: r.endDate,
    clockIn: r.clockIn,
    clockOut: r.clockOut,
    isLate: r.isLate,
    freeAttendances: r.freeAttendances,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    createdByVal: r.creatorFullName || r.creatorEmail || 'System',
    employee: {
      id: r.employeeId,
      employeeCode: r.employeeCode,
      fullName: r.employeeFullName,
      team: r.teamName ? { name: r.teamName } : null,
    },
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
