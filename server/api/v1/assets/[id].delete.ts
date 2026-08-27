import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets } from '~~/server/db/schema'
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
    .from(assets)
    .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
  }

  await db
    .update(assets)
    .set({
      deletedAt: new Date(),
      deletedBy: user.sub,
    })
    .where(eq(assets.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
