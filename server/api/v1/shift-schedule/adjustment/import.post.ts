import { useDb } from '~~/server/db'
import { scheduleAdjustments, employees, shifts } from '~~/server/db/schema'
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

  // Fetch shifts list
  const shs = await db
    .select({ id: shifts.id, code: shifts.code })
    .from(shifts)
    .where(isNull(shifts.deletedAt))

  const shiftMap = new Map<string, number>()
  for (const sh of shs) {
    shiftMap.set(sh.code.trim().toLowerCase(), sh.id)
  }

  const inserted = await db.transaction(async (tx) => {
    let count = 0
    for (const r of rows) {
      const nikClean = String(r.nik || '').trim()
      const shiftClean = String(r.shiftCode || '').trim().toLowerCase()

      const empId = employeeMap.get(nikClean)
      const shId = shiftMap.get(shiftClean)

      if (empId && shId && r.adjustmentDate) {
        await tx.insert(scheduleAdjustments).values({
          employeeId: empId,
          shiftId: shId,
          adjustmentDate: new Date(r.adjustmentDate),
          isOff: String(r.isOff || '').toLowerCase() === 'yes' ? 1 : 0,
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
