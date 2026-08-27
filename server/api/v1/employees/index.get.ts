import { and, eq, like, isNull, or, inArray, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, teamHasUsers } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  const statusFilter = query.status !== undefined && query.status !== '' ? Number(query.status) : undefined
  const companyIdFilter = query.companyId !== undefined && query.companyId !== '' ? Number(query.companyId) : undefined
  const teamIdFilter = query.teamId !== undefined && query.teamId !== '' ? Number(query.teamId) : undefined
  const positionIdFilter = query.positionId !== undefined && query.positionId !== '' ? Number(query.positionId) : undefined
  const fullNameFilter = (query.fullName as string) || undefined
  const employeeCodeFilter = (query.employeeCode as string) || undefined
  const searchFilter = (query.search as string) || undefined

  const conditions: SQL[] = [isNull(employees.deletedAt)]

  if (query.ids) {
    const ids = String(query.ids).split(',').map(Number).filter(Boolean)
    if (ids.length > 0) {
      conditions.push(inArray(employees.id, ids))
    }
  }

  if (statusFilter !== undefined) {
    conditions.push(eq(employees.status, statusFilter))
  }
  if (companyIdFilter) {
    conditions.push(eq(employees.companyId, companyIdFilter))
  }
  if (teamIdFilter) {
    const teamUserIds = await db
      .select({ userId: teamHasUsers.userId })
      .from(teamHasUsers)
      .where(eq(teamHasUsers.teamId, teamIdFilter))
    const userIds = teamUserIds.map((t) => t.userId)
    if (userIds.length > 0) {
      conditions.push(inArray(employees.userId, userIds))
    } else {
      conditions.push(eq(employees.id, -1))
    }
  }
  if (positionIdFilter) {
    conditions.push(eq(employees.positionId, positionIdFilter))
  }
  if (fullNameFilter) {
    conditions.push(like(employees.fullName, `%${fullNameFilter}%`))
  }
  if (employeeCodeFilter) {
    conditions.push(like(employees.employeeCode, `%${employeeCodeFilter}%`))
  }
  if (searchFilter) {
    conditions.push(
      or(
        like(employees.fullName, `%${searchFilter}%`),
        like(employees.employeeCode, `%${searchFilter}%`)
      ) as SQL
    )
  }

  const rows = await db.query.employees.findMany({
    where: and(...conditions),
    with: {
      department: true,
      position: true,
      division: true,
      user: {
        with: {
          teamHasUsers: {
            with: {
              team: true,
            }
          }
        }
      },
      company: true,
    },
    limit: 100,
  })

  const data = rows.map((r) => {
    const { user, ...empData } = r
    return {
      ...empData,
      team: user?.teamHasUsers?.[0]?.team || null,
    }
  })

  return { data }
})
