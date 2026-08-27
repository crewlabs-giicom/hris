import { getRouterParam } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const rows = await db.query.employeeLevelHistories.findMany({
    where: (h, { eq }) => eq(h.employeeId, employeeId),
    with: { level: true },
    orderBy: (h) => [desc(h.effectiveDate)],
  })

  return { data: rows }
})
