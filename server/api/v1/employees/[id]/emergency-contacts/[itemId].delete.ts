import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeEmergencyContacts } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeEmergencyContacts)
    .where(and(eq(employeeEmergencyContacts.id, itemId), eq(employeeEmergencyContacts.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Emergency contact not found' })
  }

  await db.delete(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.id, itemId))
  return { data: { id: itemId } }
})
