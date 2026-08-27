import { useDb } from '~~/server/db'
import { employeePermissions } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const user = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  const [row] = await db
    .select()
    .from(employeePermissions)
    .where(and(eq(employeePermissions.id, id), isNull(employeePermissions.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Permission not found' })
  }

  // Perform soft delete
  await db
    .update(employeePermissions)
    .set({
      deletedBy: user.sub,
      deletedAt: new Date(),
    })
    .where(eq(employeePermissions.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
