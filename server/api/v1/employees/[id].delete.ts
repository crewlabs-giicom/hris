import { getRouterParam, createError } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const id = getRouterParam(event, 'id') as string
  const db = useDb()

  const isNumberId = /^\d+$/.test(id)
  const idFilter = isNumberId ? eq(employees.id, Number(id)) : eq(employees.uniqueId, id)

  const [row] = await db.select().from(employees).where(and(idFilter, isNull(employees.deletedAt))).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  await db.update(employees).set({ deletedAt: new Date() }).where(eq(employees.id, row.id))

  return { data: { id } }
})
