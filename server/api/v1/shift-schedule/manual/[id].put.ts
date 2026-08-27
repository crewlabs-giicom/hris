import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { manualAttendances, manualAttendanceAttachments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const {
    employeeId,
    manualAttendanceType,
    startDate,
    endDate,
    clockIn,
    clockOut,
    isLate,
    freeAttendances,
    description,
    status,
    attachments
  } = body

  if (!employeeId || !manualAttendanceType || !startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, manualAttendanceType, startDate, endDate',
    })
  }

  const db = useDb()

  const [existing] = await db
    .select()
    .from(manualAttendances)
    .where(and(eq(manualAttendances.id, id), isNull(manualAttendances.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Manual attendance request not found' })
  }

  // Business logic rules
  let finalClockIn = clockIn ? String(clockIn).trim() : null
  let finalClockOut = clockOut ? String(clockOut).trim() : null
  const isFree = String(freeAttendances || 'No').toLowerCase() === 'yes'

  if (manualAttendanceType === 'Manual Absen' && isFree) {
    finalClockIn = '08:30'
    finalClockOut = '17:00'
  }

  await db.transaction(async (tx) => {
    // Update main record
    await tx
      .update(manualAttendances)
      .set({
        employeeId: Number(employeeId),
        manualAttendanceType: String(manualAttendanceType).trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        clockIn: finalClockIn,
        clockOut: finalClockOut,
        isLate: isLate ? 1 : 0,
        freeAttendances: isFree ? 'Yes' : 'No',
        description: description ? String(description).trim() : null,
        status: status || existing.status,
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(manualAttendances.id, id))

    // Sync attachments: delete all and re-add
    await tx.delete(manualAttendanceAttachments).where(eq(manualAttendanceAttachments.manualAttendanceId, id))
    const fileList = Array.isArray(attachments) ? attachments.filter(Boolean) : []
    for (const filePath of fileList) {
      await tx.insert(manualAttendanceAttachments).values({
        manualAttendanceId: id,
        attachment: String(filePath).trim(),
      })
    }
  })

  return {
    data: {
      success: true,
    },
  }
})
