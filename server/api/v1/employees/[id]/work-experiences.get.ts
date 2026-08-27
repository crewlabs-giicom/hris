import { getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeWorkExperiences } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const rows = await db.select().from(employeeWorkExperiences).where(eq(employeeWorkExperiences.employeeId, employeeId))
  return { data: rows }
})
