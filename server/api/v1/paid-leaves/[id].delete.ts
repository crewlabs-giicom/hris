import { useDb } from '~~/server/db'
import { employeePaidLeaves } from '~~/server/db/schema'
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
    .from(employeePaidLeaves)
    .where(and(eq(employeePaidLeaves.id, id), isNull(employeePaidLeaves.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Paid leave record not found' })
  }

  // Only allow deleting when status is "active"
  if (row.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only paid leave transactions with "active" status can be deleted',
    })
  }

  // Perform soft delete
  await db
    .update(employeePaidLeaves)
    .set({
      deletedBy: user.sub,
      deletedAt: new Date(),
    })
    .where(eq(employeePaidLeaves.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
