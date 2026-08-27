import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeFamily } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeFamily)
    .where(and(eq(employeeFamily.id, itemId), eq(employeeFamily.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Family entry not found' })
  }

  await db.delete(employeeFamily).where(eq(employeeFamily.id, itemId))
  return { data: { id: itemId } }
})
