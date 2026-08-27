import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assetRequests } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  const [row] = await db
    .select()
    .from(assetRequests)
    .where(and(eq(assetRequests.id, id), isNull(assetRequests.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Asset Request not found' })
  }

  await db
    .update(assetRequests)
    .set({
      deletedAt: new Date(),
      deletedBy: user.sub,
    })
    .where(eq(assetRequests.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
