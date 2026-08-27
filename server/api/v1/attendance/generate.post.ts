import { and, eq, sql, inArray, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import {
  employees,
  employeeAttendances,
  employeeAttendanceDetails,
  attendanceConsolidations,
  attendanceConsolidationDays,
  employeeLevelHistories,
  levels,
  deductions
} from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

// Helper to format minutes as hours and minutes string (e.g., 90 -> "1h 30m")
function formatMinutes(minutes: number): string {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const db = useDb()
  const body = await readBody(event)

  const { month, year, employeeId } = body

  if (!month || !year) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Month and Year are required.'
    })
  }

  // 1. Delete existing consolidations for this period (this will cascade delete consolidation days in MySQL)
  const deleteCond = [
    eq(attendanceConsolidations.month, Number(month)),
    eq(attendanceConsolidations.year, Number(year))
  ]
  if (employeeId) {
    deleteCond.push(eq(attendanceConsolidations.employeeId, Number(employeeId)))
  }
  await db.delete(attendanceConsolidations).where(and(...deleteCond))

  // 2. Fetch target employees
  const employeeCond = [isNull(employees.deletedAt)]
  if (employeeId) {
    employeeCond.push(eq(employees.id, Number(employeeId)))
  }
  const targetEmployees = await db
    .select()
    .from(employees)
    .where(and(...employeeCond))

  if (targetEmployees.length === 0) {
    return { success: true, message: 'No employees found to generate attendance for.' }
  }

  // 3. Prepare dates range in the month (e.g. 1 to 28/29/30/31)
  const daysInMonth = new Date(year, month, 0).getDate()
  const datesList: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0')
    const monthStr = String(month).padStart(2, '0')
    datesList.push(`${year}-${monthStr}-${dayStr}`)
  }

  // Fetch all employee_attendances and details in one go for the selected month to optimize performance
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const allAttendances = await db
    .select()
    .from(employeeAttendances)
    .where(
      and(
        isNull(employeeAttendances.deletedAt),
        sql`${employeeAttendances.date} >= ${monthStart}`,
        sql`${employeeAttendances.date} <= ${monthEnd}`
      )
    )

  const attendanceIds = allAttendances.map((a) => a.id)
  const allDetails = attendanceIds.length > 0
    ? await db
        .select()
        .from(employeeAttendanceDetails)
        .where(inArray(employeeAttendanceDetails.attendanceId, attendanceIds))
    : []

  // Group attendances and details by employee and date for O(1) lookups
  const attendanceMap: Record<string, typeof employeeAttendances.$inferSelect> = {}
  allAttendances.forEach((a) => {
    attendanceMap[`${a.employeeId}_${a.date}`] = a
  })

  const detailsMap: Record<number, (typeof employeeAttendanceDetails.$inferSelect)[]> = {}
  allDetails.forEach((d) => {
    if (!detailsMap[d.attendanceId]) {
      detailsMap[d.attendanceId] = []
    }
    detailsMap[d.attendanceId].push(d)
  })

  // Fetch Level History to compute standard basic rates
  const allLevelHistories = await db
    .select({
      employeeId: employeeLevelHistories.employeeId,
      baseSalary: levels.baseSalary,
      otherAllowance: levels.otherAllowance
    })
    .from(employeeLevelHistories)
    .innerJoin(levels, eq(employeeLevelHistories.levelId, levels.id))

  const levelMap: Record<number, { baseSalary: string; otherAllowance: string }> = {}
  allLevelHistories.forEach((lh) => {
    levelMap[lh.employeeId] = {
      baseSalary: lh.baseSalary,
      otherAllowance: lh.otherAllowance
    }
  })

  // Fetch monthly deduction values from deductions table
  const allDeductions = await db
    .select()
    .from(deductions)
    .where(
      and(
        eq(deductions.month, Number(month)),
        eq(deductions.year, Number(year)),
        eq(deductions.status, 'active')
      )
    )

  const deductionMap: Record<number, number> = {}
  allDeductions.forEach((d) => {
    const amt = Number(d.amount || 0)
    deductionMap[d.employeeId] = (deductionMap[d.employeeId] || 0) + amt
  })

  // 4. Generate records for each employee
  for (const emp of targetEmployees) {
    // Determine pot_day (standard daily rate)
    let pot_day = 120000 // default fallback
    const lvInfo = levelMap[emp.id]
    if (lvInfo) {
      pot_day = (Number(lvInfo.baseSalary) + Number(lhInfoAllowance(lvInfo.otherAllowance))) / 25
    } else if (emp.basicSalary || emp.allowance) {
      pot_day = (Number(emp.basicSalary || 0) + Number(emp.allowance || 0)) / 25
    }
    if (pot_day <= 0) pot_day = 120000 // absolute minimum safety check

    // Summary accumulators
    let sakit = 0
    let izin = 0
    let cuti = 0
    let cutiKhusus = 0
    let telat = 0
    let potDa = deductionMap[emp.id] || 0
    let potJamTotal = 0 // in minutes
    let potJamRpTotal = 0

    let punishmentTelat = 0
    let punishmentForm = 0
    let punishmentAlpha = 0
    let punishmentNoFinger = 0
    let punishmentFormLate = 0
    let punishmentLateAttendance = 0

    const dailyInserts: (typeof attendanceConsolidationDays.$inferInsert & { temp_pot_jam?: number })[] = []

    // Helper to safely parse other allowance
    function lhInfoAllowance(allow: string) {
      return allow || '0'
    }

    for (const dStr of datesList) {
      const joinDate = emp.joinDate
      const resignDate = emp.resignDate

      // Check Join/Resign periods
      if (joinDate && dStr < joinDate) {
        dailyInserts.push({
          consolidationId: 0, // temporary placeholder
          date: dStr,
          isOff: false,
          titleIn: 'BELUM',
          titleOut: 'JOIN',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        continue
      }

      if (resignDate && dStr > resignDate) {
        dailyInserts.push({
          consolidationId: 0,
          date: dStr,
          isOff: false,
          titleIn: 'SUDAH',
          titleOut: 'RESIGN',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        continue
      }

      const att = attendanceMap[`${emp.id}_${dStr}`]

      if (!att) {
        // No Shift / Alpha log on scheduled work day
        dailyInserts.push({
          consolidationId: 0,
          date: dStr,
          isOff: false,
          titleIn: 'Alpha',
          titleOut: 'Alpha',
          titlePunishment: 'Alpha',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        punishmentTelat += 2
        punishmentAlpha += 2
        punishmentFormLate += 1
        punishmentForm += 1
        continue
      }

      // Check OFF Days
      if (att.isOff === 1) {
        dailyInserts.push({
          consolidationId: 0,
          date: dStr,
          isOff: true,
          titleIn: 'OFF',
          titleOut: '',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        continue
      }

      if (att.isOff === 2) {
        // OFF but GUDANG (punishment form applied)
        dailyInserts.push({
          consolidationId: 0,
          date: dStr,
          isOff: true,
          titleIn: 'OFF',
          titleOut: 'GUDANG',
          titlePunishment: 'Potongan 80.000',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        punishmentForm += 1
        continue
      }

      if (att.isOff === 3) {
        dailyInserts.push({
          consolidationId: 0,
          date: dStr,
          isOff: true,
          titleIn: 'CUTI',
          titleOut: 'BERSAMA',
          workHour: '0.00',
          potJam: 0,
          potRp: '0.00',
        })
        continue
      }

      // Scheduled Work Day (isOff === 0)
      const details = detailsMap[att.id] || []
      const detailIn = details.find((det) => det.permissionTypeId === 1)
      const detailOut = details.find((det) => det.permissionTypeId === 2)

      // Other permissions/leaves
      const detailPermission = details.find((det) => det.permissionTypeId && det.permissionTypeId > 2)

      // Determine Scheduled work hour
      let schedIn = att.shiftIn || '08:00:00'
      let schedOut = att.shiftOut || '17:00:00'
      
      const inTime = parseTimeToMins(schedIn)
      const outTime = parseTimeToMins(schedOut)
      let workHourVal = (outTime - inTime) / 60
      if (workHourVal <= 0) workHourVal = 8.5

      let titleIn = ''
      let titleOut = ''
      let titlePunishmentList: string[] = []
      let dailyPotJam = 0 // in minutes

      // Parse punches
      if (detailIn) {
        const inMin = parseTimeToMins(detailIn.clock)
        const schedInMin = parseTimeToMins(schedIn)
        const lateMins = inMin - schedInMin

        if (lateMins > 0) {
          // Late Clock In
          const checkIKH = details.some((det) => det.permissionTypeId === 9) // IKH
          if (checkIKH && lateMins < 30) {
            titleIn = `IKH - ${formatMinutes(lateMins)}`
          } else {
            // Apply MS (Masuk Siang) or T (Telat) rules
            // HOME/BOX employees have 15 mins grace, others 30 mins
            const isHomeBox = emp.bpjsType === 'HOME' || emp.bpjsType === 'BOX'
            const gracePeriod = isHomeBox ? 15 : 30

            if (lateMins > gracePeriod || details.some((det) => det.permissionTypeId === 6)) {
              // MS - Meninggalkan Shift
              titleIn = `MS - ${formatMinutes(lateMins)}`
              
              const hasForm = details.some((det) => det.permissionTypeId === 6 || det.permissionTypeId === 10)
              if (!hasForm) {
                dailyPotJam += lateMins
                punishmentForm += 1
                punishmentFormLate += 1
                titlePunishmentList.push(`Telat Form MS`)
              }
            } else {
              // Standard Telat (T)
              titleIn = `T - ${String(Math.floor(lateMins / 60)).padStart(2, '0')}:${String(lateMins % 60).padStart(2, '0')}`
              punishmentTelat += 1
              punishmentLateAttendance += 1
              titlePunishmentList.push('Punishment Telat')
              telat += 1
            }
          }
        } else {
          titleIn = detailIn.clock.slice(0, 5)
        }
      }

      if (detailOut) {
        const outMin = parseTimeToMins(detailOut.clock)
        const schedOutMin = parseTimeToMins(schedOut)
        const earlyMins = schedOutMin - outMin

        if (earlyMins > 0 && outMin > 60) { // after 01:00 AM
          // PC - Pulang Cepat
          titleOut = `PC - ${formatMinutes(earlyMins)}`
          
          const hasForm = details.some((det) => det.permissionTypeId === 5 || det.permissionTypeId === 10)
          if (!hasForm) {
            dailyPotJam += earlyMins
            punishmentForm += 1
            punishmentFormLate += 1
            titlePunishmentList.push(`Telat Form PC`)
          }
        } else {
          titleOut = detailOut.clock.slice(0, 5)
        }
      }

      // If no punch in/out but permission exists
      if (!detailIn && !detailOut) {
        if (detailPermission) {
          const ptId = detailPermission.permissionTypeId
          if (ptId === 3) {
            titleOut = 'CUTI'
            cuti += 1
          } else if (ptId === 11) {
            titleOut = 'CUTI KHUSUS'
            cutiKhusus += 1
          } else if (ptId === 10) {
            titleOut = 'SAKIT'
            sakit += 1
          } else if (ptId === 4) {
            titleOut = 'IZIN'
            izin += 1
          }
        } else {
          // No punches, no permission -> Alpha
          titleIn = 'Alpha'
          titleOut = 'Alpha'
          titlePunishmentList.push('Alpha')
          punishmentTelat += 2
          punishmentAlpha += 2
          punishmentFormLate += 1
          punishmentForm += 1
        }
      } else {
        // Punches forgot check (forgetting to clock out or clock in)
        if (detailIn && !detailOut) {
          titlePunishmentList.push('TF OUT')
          punishmentTelat += 1
          punishmentNoFinger += 1
        } else if (detailOut && !detailIn) {
          titlePunishmentList.push('TF IN')
          punishmentTelat += 1
          punishmentNoFinger += 1
        }
      }

      // If Izin Keluar Kantor (IK = 12)
      const detailIK = details.find((det) => det.permissionTypeId === 12)
      if (detailIK) {
        const startIK = parseTimeToMins(detailIK.clock)
        const endIK = parseTimeToMins(detailIK.description || detailIK.clock) // fallback or duration
        const duration = Math.max(0, endIK - startIK)
        dailyPotJam += duration
        titleIn = (titleIn ? `${titleIn} | ` : '') + `IK - ${formatMinutes(duration)}`
      }

      // Compute daily hourly deduction RP if any
      let dailyPotRp = 0
      if (dailyPotJam > 0) {
        const potMinutesRate = pot_day / workHourVal / 60
        dailyPotRp = potMinutesRate * dailyPotJam
        potJamTotal += dailyPotJam
        potJamRpTotal += dailyPotRp
      }

      dailyInserts.push({
        consolidationId: 0,
        date: dStr,
        isOff: false,
        titleIn: titleIn || 'IN',
        titleOut: titleOut || 'OUT',
        titlePunishment: titlePunishmentList.join(', ') || null,
        workHour: workHourVal.toFixed(2),
        potJam: dailyPotJam,
        potRp: dailyPotRp.toFixed(2),
      })
    }

    // Compute monthly cumulative values
    const potDayRp = izin * pot_day
    const potDaRp = potDa * pot_day

    // Punishment calculations
    const punishmentAlphaRp = (pot_day * 0.5) * punishmentAlpha
    const punishmentNoFingerRp = (pot_day * 0.5) * punishmentNoFinger
    const punishmentFormLateRp = (pot_day * 0.5) * punishmentFormLate
    const punishmentLateAttendanceRp = (pot_day * 0.5) * punishmentLateAttendance
    const punishmentRp = (pot_day * 0.5) * (punishmentTelat + punishmentForm)

    const totalPotongan = potJamRpTotal + potDayRp + potDaRp + punishmentRp

    // Insert to main Consolidation Table
    const [insertedCons] = await db.insert(attendanceConsolidations).values({
      employeeId: emp.id,
      month: Number(month),
      year: Number(year),
      sakit,
      izin,
      cuti,
      cutiKhusus,
      telat,
      potDa,
      potJam: potJamTotal,
      potJamRp: potJamRpTotal.toFixed(2),
      potDayRp: potDayRp.toFixed(2),
      potDaRp: potDaRp.toFixed(2),
      punishmentTelat,
      punishmentForm,
      punishmentAlpha,
      punishmentNoFinger,
      punishmentFormLate,
      punishmentLateAttendance,
      punishmentAlphaRp: punishmentAlphaRp.toFixed(2),
      punishmentNoFingerRp: punishmentNoFingerRp.toFixed(2),
      punishmentFormLateRp: punishmentFormLateRp.toFixed(2),
      punishmentLateAttendanceRp: punishmentLateAttendanceRp.toFixed(2),
      punishmentRp: punishmentRp.toFixed(2),
      totalPotongan: totalPotongan.toFixed(2),
    })

    const newConsId = insertedCons.insertId

    // Insert daily details
    const finalizedDailies = dailyInserts.map((day) => ({
      ...day,
      consolidationId: newConsId,
    }))

    if (finalizedDailies.length > 0) {
      await db.insert(attendanceConsolidationDays).values(finalizedDailies)
    }
  }

  return {
    success: true,
    message: `Attendance consolidation generated successfully for ${targetEmployees.length} employees.`
  }
})

// Helper to parse time string HH:MM:SS to minutes since midnight
function parseTimeToMins(timeStr: string): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  return h * 60 + m
}
