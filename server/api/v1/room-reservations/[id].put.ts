import { useDb } from '~~/server/db'
import { roomReservations, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

function getMinutesDiff(start: string, end: string): number {
  const [sH, sM] = start.split(':').map(Number)
  const [eH, eM] = end.split(':').map(Number)
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0
  const startMin = sH * 60 + sM
  const endMin = eH * 60 + eM
  return endMin - startMin
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const { roomId, type, date, clockStart, clockEnd, description } = body

  // Check mandatory fields
  if (!roomId || type === undefined || !date || !clockStart || !clockEnd) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: roomId, type, date, clockStart, clockEnd',
    })
  }

  // Validate clocks
  const durationMinutes = getMinutesDiff(clockStart, clockEnd)
  if (durationMinutes <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Clock end must be after clock start',
    })
  }

  // If type is Standard (false), maximum booking time is 3 hours (180 minutes)
  const isTypeBoolean = typeof type === 'boolean' ? type : type === 'true' || type === 1 || type === '1'
  if (!isTypeBoolean && durationMinutes > 180) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Standard reservation cannot exceed 3 hours.',
    })
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
      roomId: Number(roomId),
      type: isTypeBoolean,
      date,
      clockStart,
      clockEnd,
      description: description ? String(description).trim() : null,
      updatedBy: emp.id,
      updatedAt: new Date(),
    })
    .where(eq(roomReservations.id, id))

  return {
    data: {
      id,
      success: true,
    },
  }
})
