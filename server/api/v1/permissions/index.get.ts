import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeePermissions, employees, permissionsType, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  // Ensure authenticated user
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(employeePermissions.deletedAt)]

  // Filter by Status (multiple selection)
  if (query.status) {
    const statuses = String(query.status).split(',').filter(Boolean)
    if (statuses.length > 0) {
      conditions.push(inArray(employeePermissions.status, statuses))
    }
  }

  // Filter by Category (multiple selection)
  if (query.permissionsTypeId) {
    const categoryIds = String(query.permissionsTypeId).split(',').map(Number).filter(Boolean)
    if (categoryIds.length > 0) {
      conditions.push(inArray(employeePermissions.permissionsTypeId, categoryIds))
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

  // Filter by Month (single selection, on validFrom)
  if (query.month) {
    conditions.push(sql`MONTH(${employeePermissions.validFrom}) = ${Number(query.month)}`)
  }

  // Filter by Year (single selection, on validFrom)
  if (query.year) {
    conditions.push(sql`YEAR(${employeePermissions.validFrom}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, employee code, or description)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal),
        like(employeePermissions.description, searchVal)
      ) as SQL
    )
  }

  // Get total matching count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(employeePermissions)
    .innerJoin(employees, eq(employeePermissions.employeeId, employees.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated rows with employee and permission category details
  const rows = await db
    .select({
      id: employeePermissions.id,
      employeeId: employeePermissions.employeeId,
      permissionsTypeId: employeePermissions.permissionsTypeId,
      status: employeePermissions.status,
      validFrom: employeePermissions.validFrom,
      validTo: employeePermissions.validTo,
      description: employeePermissions.description,
      createdAt: employeePermissions.createdAt,
      employeeIdVal: employees.id,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      permissionTypeName: permissionsType.name,
    })
    .from(employeePermissions)
    .innerJoin(employees, eq(employeePermissions.employeeId, employees.id))
    .innerJoin(permissionsType, eq(employeePermissions.permissionsTypeId, permissionsType.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(sql`${employeePermissions.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    permissionsTypeId: r.permissionsTypeId,
    status: r.status,
    validFrom: r.validFrom,
    validTo: r.validTo,
    description: r.description,
    createdAt: r.createdAt,
    employee: {
      id: r.employeeIdVal,
      employeeCode: r.employeeCode,
      fullName: r.employeeFullName,
      teamId: r.employeeTeamId,
      team: r.teamName ? { name: r.teamName } : null,
    },
    permissionType: {
      id: r.permissionsTypeId,
      name: r.permissionTypeName,
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
