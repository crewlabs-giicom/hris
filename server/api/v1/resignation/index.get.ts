import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { resignations, employees, teams, teamHasUsers, users } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(resignations.deletedAt)]

  // Filter by Status (multiple selection)
  if (query.status) {
    const statuses = String(query.status).split(',').filter(Boolean)
    if (statuses.length > 0) {
      conditions.push(inArray(resignations.status, statuses))
    }
  }

  // Filter by Team (multiple selection, mapped via teamHasUsers)
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

  // Filter by Month (on resignationDate)
  if (query.month) {
    conditions.push(sql`MONTH(${resignations.resignationDate}) = ${Number(query.month)}`)
  }

  // Filter by Year (on resignationDate)
  if (query.year) {
    conditions.push(sql`YEAR(${resignations.resignationDate}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, employee code, or reason)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal),
        like(resignations.resignationReason, searchVal)
      ) as SQL
    )
  }

  // Get total matching count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(resignations)
    .innerJoin(employees, eq(resignations.employeeId, employees.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Alias the employees table to get the creator's employee profile
  const creatorEmployees = sql`creator_employees`

  // Fetch paginated rows with employee and creator user details
  const rows = await db
    .select({
      id: resignations.id,
      employeeId: resignations.employeeId,
      resignationDate: resignations.resignationDate,
      resignationType: resignations.resignationType,
      resignationReason: resignations.resignationReason,
      status: resignations.status,
      createdAt: resignations.createdAt,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      creatorEmail: users.email,
      creatorFullName: sql<string>`(SELECT full_name FROM employees WHERE user_id = ${resignations.createdBy} LIMIT 1)`
    })
    .from(resignations)
    .innerJoin(employees, eq(resignations.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .leftJoin(users, eq(resignations.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(sql`${resignations.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    resignationDate: r.resignationDate,
    resignationType: r.resignationType,
    resignationReason: r.resignationReason,
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
