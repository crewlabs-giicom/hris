import { useDb } from '~~/server/db'
import { manualAttendances, manualAttendanceAttachments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

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
    attachments
  } = body

  if (!employeeId || !manualAttendanceType || !startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, manualAttendanceType, startDate, endDate',
    })
  }

  // Business logic rules
  let finalClockIn = clockIn ? String(clockIn).trim() : null
  let finalClockOut = clockOut ? String(clockOut).trim() : null
  const isFree = String(freeAttendances || 'No').toLowerCase() === 'yes'

  if (manualAttendanceType === 'Manual Absen' && isFree) {
    finalClockIn = '08:30'
    finalClockOut = '17:00'
  }

  const db = useDb()

  const manualAttendanceId = await db.transaction(async (tx) => {
    // 1. Insert main record
    const [result] = await tx.insert(manualAttendances).values({
      employeeId: Number(employeeId),
      manualAttendanceType: String(manualAttendanceType).trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      clockIn: finalClockIn,
      clockOut: finalClockOut,
      isLate: isLate ? 1 : 0,
      freeAttendances: isFree ? 'Yes' : 'No',
      description: description ? String(description).trim() : null,
      status: 'active',
      createdBy: user.sub,
      updatedBy: user.sub,
    })

    const newId = result.insertId

    // 2. Insert attachments
    const fileList = Array.isArray(attachments) ? attachments.filter(Boolean) : []
    for (const filePath of fileList) {
      await tx.insert(manualAttendanceAttachments).values({
        manualAttendanceId: newId,
        attachment: String(filePath).trim(),
      })
    }

    return newId
  })

  return {
    data: {
      id: manualAttendanceId,
      success: true,
    },
  }
})
