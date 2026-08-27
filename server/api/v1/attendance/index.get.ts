import { and, eq, sql, inArray, like, isNull, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import {
  employees,
  attendanceConsolidations,
  attendanceConsolidationDays,
  teamHasUsers,
  teams,
  schedules
} from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  // Default to current month and year
  const now = new Date()
  const month = Number(query.month) || (now.getMonth() + 1)
  const year = Number(query.year) || now.getFullYear()

  const conditions: SQL[] = [
    eq(attendanceConsolidations.month, month),
    eq(attendanceConsolidations.year, year)
  ]

  // Filter: Search Name/NIK
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(employees.employeeCode, searchVal)
      ) as SQL
    )
  }

  // Filter: Team
  if (query.teamId) {
    const teamIds = Array.isArray(query.teamId)
      ? query.teamId.map(Number)
      : [Number(query.teamId)]
    if (teamIds.length > 0 && !teamIds.includes(0)) {
      conditions.push(inArray(teamHasUsers.teamId, teamIds))
    }
  }

  // Filter: Employee Status
  if (query.status && query.status !== 'all') {
    conditions.push(eq(employees.employmentStatus, query.status as any))
  }

  // Filter: Shift Type (Fixed vs Non-Fixed)
  if (query.shift && query.shift !== 'all') {
    const isFixVal = query.shift === 'fixed' ? 1 : 0
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM schedule 
        WHERE schedule.employee_id = ${employees.id} 
          AND schedule.is_fix = ${isFixVal} 
          AND schedule.deleted_at IS NULL
        LIMIT 1
      )`
    )
  }

  // Fetch count
  const countRes = await db
    .select({ count: sql<number>`count(distinct ${attendanceConsolidations.id})` })
    .from(attendanceConsolidations)
    .innerJoin(employees, eq(attendanceConsolidations.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated consolidations
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20))
  const offset = (page - 1) * perPage

  const rows = await db
    .select({
      id: attendanceConsolidations.id,
      employeeId: attendanceConsolidations.employeeId,
      fullName: employees.fullName,
      employeeCode: employees.employeeCode,
      photoPath: employees.photoPath,
      employmentStatus: employees.employmentStatus,
      teamName: teams.name,
      sakit: attendanceConsolidations.sakit,
      izin: attendanceConsolidations.izin,
      cuti: attendanceConsolidations.cuti,
      cutiKhusus: attendanceConsolidations.cutiKhusus,
      telat: attendanceConsolidations.telat,
      potDa: attendanceConsolidations.potDa,
      potJam: attendanceConsolidations.potJam,
      potJamRp: attendanceConsolidations.potJamRp,
      potDayRp: attendanceConsolidations.potDayRp,
      potDaRp: attendanceConsolidations.potDaRp,
      punishmentTelat: attendanceConsolidations.punishmentTelat,
      punishmentForm: attendanceConsolidations.punishmentForm,
      punishmentAlpha: attendanceConsolidations.punishmentAlpha,
      punishmentNoFinger: attendanceConsolidations.punishmentNoFinger,
      punishmentFormLate: attendanceConsolidations.punishmentFormLate,
      punishmentLateAttendance: attendanceConsolidations.punishmentLateAttendance,
      punishmentAlphaRp: attendanceConsolidations.punishmentAlphaRp,
      punishmentNoFingerRp: attendanceConsolidations.punishmentNoFingerRp,
      punishmentFormLateRp: attendanceConsolidations.punishmentFormLateRp,
      punishmentLateAttendanceRp: attendanceConsolidations.punishmentLateAttendanceRp,
      punishmentRp: attendanceConsolidations.punishmentRp,
      totalPotongan: attendanceConsolidations.totalPotongan
    })
    .from(attendanceConsolidations)
    .innerJoin(employees, eq(attendanceConsolidations.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(employees.fullName)
    .limit(perPage)
    .offset(offset)

  if (rows.length === 0) {
    return {
      data: [],
      meta: { page, perPage, total }
    }
  }

  // Fetch daily details for the fetched consolidations
  const consIds = rows.map((r) => r.id)
  const allDays = await db
    .select()
    .from(attendanceConsolidationDays)
    .where(inArray(attendanceConsolidationDays.consolidationId, consIds))
    .orderBy(attendanceConsolidationDays.date)

  // Map daily details to consolidation records
  const daysMap: Record<number, typeof allDays> = {}
  allDays.forEach((d) => {
    if (!daysMap[d.consolidationId]) {
      daysMap[d.consolidationId] = []
    }
    daysMap[d.consolidationId].push(d)
  })

  const data = rows.map((r) => ({
    ...r,
    days: daysMap[r.id] || []
  }))

  return {
    data,
    meta: {
      page,
      perPage,
      total
    }
  }
})
