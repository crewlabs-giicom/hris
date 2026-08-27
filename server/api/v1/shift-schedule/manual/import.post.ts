import { useDb } from '~~/server/db'
import { manualAttendances, employees } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { isNull } from 'drizzle-orm'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const body = await readBody(event)
  const rows = Array.isArray(body.rows) ? body.rows : []

  if (rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No data rows provided' })
  }

  const db = useDb()

  // Fetch employees list
  const emps = await db
    .select({ id: employees.id, nik: employees.nik, code: employees.employeeCode })
    .from(employees)
    .where(isNull(employees.deletedAt))

  const employeeMap = new Map<string, number>()
  for (const emp of emps) {
    if (emp.nik) employeeMap.set(emp.nik.trim(), emp.id)
    if (emp.code) employeeMap.set(emp.code.trim(), emp.id)
  }

  const inserted = await db.transaction(async (tx) => {
    let count = 0
    for (const r of rows) {
      const nikClean = String(r.nik || '').trim()
      const empId = employeeMap.get(nikClean)

      if (empId && r.manualAttendanceType && r.startDate && r.endDate) {
        const isFree = String(r.freeAttendances || '').toLowerCase() === 'yes'
        let clockIn = r.clockIn ? String(r.clockIn).trim() : null
        let clockOut = r.clockOut ? String(r.clockOut).trim() : null

        if (String(r.manualAttendanceType).trim() === 'Manual Absen' && isFree) {
          clockIn = '08:30'
          clockOut = '17:00'
        }

        await tx.insert(manualAttendances).values({
          employeeId: empId,
          manualAttendanceType: String(r.manualAttendanceType).trim(),
          startDate: new Date(r.startDate),
          endDate: new Date(r.endDate),
          clockIn,
          clockOut,
          isLate: String(r.isLate || '').toLowerCase() === 'yes' ? 1 : 0,
          freeAttendances: isFree ? 'Yes' : 'No',
          description: r.description ? String(r.description).trim() : null,
          status: 'active',
          createdBy: user.sub,
          updatedBy: user.sub,
        })
        count++
      }
    }
    return count
  })

  return {
    data: {
      success: true,
      importedCount: inserted,
    },
  }
})
