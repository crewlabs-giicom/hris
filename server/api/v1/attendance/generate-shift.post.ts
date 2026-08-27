import { and, eq, sql, isNull, or } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import {
  employees,
  schedules,
  shifts,
  holidays,
  employeeAttendances
} from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const db = useDb()
  const body = await readBody(event)

  const { month, year, type } = body

  if (!month || !year || !type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Month, Year, and Type (fixed, non-fixed, new-fixed) are required.'
    })
  }

  // 1. Prepare dates list in selected month/year
  const daysInMonth = new Date(year, month, 0).getDate()
  const datesList: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    datesList.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  // Fetch all holidays in this month
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const monthHolidays = await db
    .select()
    .from(holidays)
    .where(
      and(
        isNull(holidays.deletedAt),
        sql`${holidays.holidayDate} >= ${monthStart}`,
        sql`${holidays.holidayDate} <= ${monthEnd}`
      )
    )

  const holidayDates = new Set(monthHolidays.map((h) => h.holidayDate))

  let processedCount = 0

  // 2. Loop dates and generate shifts
  for (const dStr of datesList) {
    const dt = new Date(dStr)
    const dayOfWeek = dt.getDay() // 0 = Sunday, 6 = Saturday
    const isHoliday = holidayDates.has(dStr)

    // Build conditions to find schedules active on this date
    const scheduleConds = [
      isNull(schedules.deletedAt),
      sql`${schedules.validFrom} <= ${dStr}`,
      sql`${schedules.validTo} >= ${dStr}`
    ]

    if (type === 'fixed' || type === 'new-fixed') {
      scheduleConds.push(eq(schedules.isFix, 1))
    } else if (type === 'non-fixed') {
      scheduleConds.push(eq(schedules.isFix, 0))
    }

    const activeSchedules = await db
      .select({
        scheduleId: schedules.id,
        employeeId: schedules.employeeId,
        isFix: schedules.isFix,
        isOffSchedule: schedules.isOff,
        shiftIn: shifts.shiftIn,
        shiftOut: shifts.shiftOut,
        location: employees.bpjsType, // bpjsType stores location (HOME/BOX)
        teamId: employees.teamId
      })
      .from(schedules)
      .innerJoin(shifts, eq(schedules.shiftId, shifts.id))
      .innerJoin(employees, eq(schedules.employeeId, employees.id))
      .where(and(...scheduleConds))

    for (const sched of activeSchedules) {
      // Check if attendance already exists
      const existing = await db
        .select()
        .from(employeeAttendances)
        .where(
          and(
            eq(employeeAttendances.employeeId, sched.employeeId),
            eq(employeeAttendances.date, dStr),
            isNull(employeeAttendances.deletedAt)
          )
        )
        .limit(1)

      // Determine shift times and OFF status
      let finalShiftIn: string | null = sched.shiftIn
      let finalShiftOut: string | null = sched.shiftOut
      let finalIsOff = sched.isOffSchedule

      if (isHoliday && sched.isFix === 1) {
        finalShiftIn = null
        finalShiftOut = null
        finalIsOff = 1
      } else {
        // Adjust for weekend
        if (sched.isFix === 1) {
          if (dayOfWeek === 0) {
            // Sunday
            finalIsOff = 1
            finalShiftIn = null
            finalShiftOut = null
          } else if (dayOfWeek === 6 && sched.location !== 'BOX') {
            // Saturday non-BOX gets early release at 13:00
            finalShiftOut = '13:00:00'
          }
        }
      }

      // If Sunday, set fields to NULL if off
      if (finalIsOff === 1) {
        finalShiftIn = null
        finalShiftOut = null
      }

      if (existing.length > 0) {
        // Update if existing (except for new-fixed where we only insert missing ones)
        if (type !== 'new-fixed') {
          await db
            .update(employeeAttendances)
            .set({
              shiftIn: finalShiftIn,
              shiftOut: finalShiftOut,
              isOff: finalIsOff,
              updatedAt: new Date()
            })
            .where(eq(employeeAttendances.id, existing[0].id))
          processedCount++
        }
      } else {
        // Insert new
        await db.insert(employeeAttendances).values({
          employeeId: sched.employeeId,
          shiftIn: finalShiftIn,
          shiftOut: finalShiftOut,
          date: dStr,
          isOff: finalIsOff,
          isLock: 0,
        })
        processedCount++
      }
    }
  }

  return {
    success: true,
    message: `Successfully processed ${processedCount} shift records for the month.`
  }
})
