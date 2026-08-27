import { and, eq, isNull, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()

  // 1. Get the current user's team ID
  const [currentEmp] = await db
    .select({ teamId: teamHasUsers.teamId })
    .from(teamHasUsers)
    .where(eq(teamHasUsers.userId, user.sub))
    .limit(1)

  if (!currentEmp || !currentEmp.teamId) {
    return { data: [] }
  }

  // 2. Fetch all user IDs in the same team
  const teamUserIds = await db
    .select({ userId: teamHasUsers.userId })
    .from(teamHasUsers)
    .where(eq(teamHasUsers.teamId, currentEmp.teamId))

  const userIds = teamUserIds.map((t) => t.userId)
  if (userIds.length === 0) {
    return { data: [] }
  }

  // 3. Fetch active employees mapping to those user IDs
  const rows = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      employeeCode: employees.employeeCode,
    })
    .from(employees)
    .where(
      and(
        inArray(employees.userId, userIds),
        isNull(employees.deletedAt),
        eq(employees.status, 1) // active status
      )
    )
    .orderBy(employees.fullName)
    .limit(100)

  return { data: rows }
})
