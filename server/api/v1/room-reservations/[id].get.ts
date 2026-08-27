import { useDb } from '~~/server/db'
import { roomReservations } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()
  const [row] = await db
    .select()
    .from(roomReservations)
    .where(and(eq(roomReservations.id, id), isNull(roomReservations.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation not found' })
  }

  return { data: row }
})
