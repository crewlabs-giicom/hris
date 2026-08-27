import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeWorkExperiences } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeWorkExperiences)
    .where(and(eq(employeeWorkExperiences.id, itemId), eq(employeeWorkExperiences.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Work experience not found' })
  }

  await db.delete(employeeWorkExperiences).where(eq(employeeWorkExperiences.id, itemId))
  return { data: { id: itemId } }
})
