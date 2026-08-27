import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeEducation } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeEducation)
    .where(and(eq(employeeEducation.id, itemId), eq(employeeEducation.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Education entry not found' })
  }

  await db.delete(employeeEducation).where(eq(employeeEducation.id, itemId))
  return { data: { id: itemId } }
})
