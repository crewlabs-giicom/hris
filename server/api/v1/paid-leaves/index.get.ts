import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { useDb } from '~~/server/db'
import { employeePaidLeaves, employees, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  // Ensure authenticated user
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(employeePaidLeaves.deletedAt)]

  // Filter by Status (multiple selection)
  if (query.status) {
    const statuses = String(query.status).split(',').filter(Boolean)
    if (statuses.length > 0) {
      conditions.push(inArray(employeePaidLeaves.status, statuses))
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
    conditions.push(sql`MONTH(${employeePaidLeaves.validFrom}) = ${Number(query.month)}`)
  }

  // Filter by Year (single selection, on validFrom)
  if (query.year) {
    conditions.push(sql`YEAR(${employeePaidLeaves.validFrom}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, employee code, or description)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal),
        like(employeePaidLeaves.description, searchVal)
      ) as SQL
    )
  }

  // Get total matching count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(employeePaidLeaves)
    .innerJoin(employees, eq(employeePaidLeaves.employeeId, employees.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Alias employees table for personResponsible lookup
  const employeeResponsible = alias(employees, 'employeeResponsible')

  // Fetch paginated rows with employee, personResponsible, and team details
  const rows = await db
    .select({
      id: employeePaidLeaves.id,
      employeeId: employeePaidLeaves.employeeId,
      paidLeaveType: employeePaidLeaves.paidLeaveType,
      status: employeePaidLeaves.status,
      validFrom: employeePaidLeaves.validFrom,
      validTo: employeePaidLeaves.validTo,
      paidLeaveCount: employeePaidLeaves.paidLeaveCount,
      dayOffCount: employeePaidLeaves.dayOffCount,
      description: employeePaidLeaves.description,
      personResponsibleId: employeePaidLeaves.personResponsibleId,
      personResponsibleName: employeeResponsible.fullName,
      task: employeePaidLeaves.task,
      address: employeePaidLeaves.address,
      createdAt: employeePaidLeaves.createdAt,
      employeeIdVal: employees.id,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
    })
    .from(employeePaidLeaves)
    .innerJoin(employees, eq(employeePaidLeaves.employeeId, employees.id))
    .leftJoin(employeeResponsible, eq(employeePaidLeaves.personResponsibleId, employeeResponsible.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(sql`${employeePaidLeaves.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    paidLeaveType: r.paidLeaveType,
    status: r.status,
    validFrom: r.validFrom,
    validTo: r.validTo,
    paidLeaveCount: r.paidLeaveCount,
    dayOffCount: r.dayOffCount,
    description: r.description,
    personResponsibleId: r.personResponsibleId,
    personResponsibleName: r.personResponsibleName,
    task: r.task,
    address: r.address,
    createdAt: r.createdAt,
    employee: {
      id: r.employeeIdVal,
      employeeCode: r.employeeCode,
      fullName: r.employeeFullName,
      teamId: r.employeeTeamId,
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
