import { useDb } from '~~/server/db'
import { roomReservations, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  // Always resolve employeeId from the logged-in user
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, user.sub), isNull(employees.deletedAt)))
    .limit(1)

  if (!emp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current user has no associated employee record.',
    })
  }

  const [row] = await db
    .select()
    .from(roomReservations)
    .where(and(eq(roomReservations.id, id), isNull(roomReservations.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation not found' })
  }

  await db
    .update(roomReservations)
    .set({
      deletedAt: new Date(),
      deletedBy: emp.id,
    })
    .where(eq(roomReservations.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
