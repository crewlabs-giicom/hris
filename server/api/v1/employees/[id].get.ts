import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireApiClient } from '~~/server/utils/apiKey'

/**
 * Server-to-server lookup — e.g. Backbone resolving a Backbone user to their
 * HRIS employee record via employee_id. Authenticated with an API key
 * (x-api-key header), not a user JWT.
 */
export default defineEventHandler(async (event) => {
  await requireApiClient(event)

  const id = getRouterParam(event, 'id')
  const db = useDb()

  const isNumberId = /^\d+$/.test(id!)
  const idFilter = isNumberId ? eq(employees.id, Number(id)) : eq(employees.uniqueId, id!)

  const [row] = await db
    .select()
    .from(employees)
    .where(and(idFilter, isNull(employees.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  return { data: row }
})
