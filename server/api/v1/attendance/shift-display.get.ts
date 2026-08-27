import { and, eq, sql, inArray, like, isNull, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import {
  employees,
  employeeAttendances,
  employeeAttendanceDetails,
  teamHasUsers,
  teams
} from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const db = useDb()
  const query = getQuery(event)

  const now = new Date()
  const month = Number(query.month) || (now.getMonth() + 1)
  const year = Number(query.year) || now.getFullYear()

  const conditions: SQL[] = [isNull(employees.deletedAt)]

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

  // Filter: Shift Type
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
    .select({ count: sql<number>`count(distinct ${employees.id})` })
    .from(employees)
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated employees
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 20))
  const offset = (page - 1) * perPage

  const empRows = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      employeeCode: employees.employeeCode,
      photoPath: employees.photoPath,
      teamName: teams.name,
      joinDate: employees.joinDate,
      resignDate: employees.resignDate
    })
    .from(employees)
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(employees.fullName)
    .limit(perPage)
    .offset(offset)

  if (empRows.length === 0) {
    return {
      data: [],
      meta: { page, perPage, total }
    }
  }

  // Fetch all employee_attendances for these employees in selected month/year
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
  const empIds = empRows.map((e) => e.id)

  const monthAttendances = await db
    .select()
    .from(employeeAttendances)
    .where(
      and(
        inArray(employeeAttendances.employeeId, empIds),
        sql`${employeeAttendances.date} >= ${monthStart}`,
        sql`${employeeAttendances.date} <= ${monthEnd}`,
        isNull(employeeAttendances.deletedAt)
      )
    )

  // Fetch details (clock in/out logs) for these attendances to know if punches exist
  const attIds = monthAttendances.map((a) => a.id)
  const allDetails = attIds.length > 0
    ? await db
        .select({
          id: employeeAttendanceDetails.id,
          attendanceId: employeeAttendanceDetails.attendanceId
        })
        .from(employeeAttendanceDetails)
        .where(inArray(employeeAttendanceDetails.attendanceId, attIds))
    : []

  const detailsSet = new Set(allDetails.map((d) => d.attendanceId))

  // Map attendances to employees
  const attendancesMap: Record<string, { shiftIn: string | null; shiftOut: string | null; isOff: number; hasLogs: boolean }> = {}
  monthAttendances.forEach((a) => {
    attendancesMap[`${a.employeeId}_${a.date}`] = {
      shiftIn: a.shiftIn,
      shiftOut: a.shiftOut,
      isOff: a.isOff,
      hasLogs: detailsSet.has(a.id)
    }
  })

  // Format response rows
  const data = empRows.map((emp) => {
    const dailyLogs: any[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0')
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${dayStr}`

      const log = attendancesMap[`${emp.id}_${dateStr}`]
      let displayDate = ''
      let ket = ''

      if (emp.joinDate && dateStr < emp.joinDate) {
        displayDate = 'BELUM JOIN'
      } else if (emp.resignDate && dateStr > emp.resignDate) {
        displayDate = 'SUDAH RESIGN'
      } else if (!log) {
        displayDate = 'OFF'
        ket = 'x'
      } else {
        if (log.isOff === 1) {
          displayDate = 'OFF'
        } else if (log.isOff === 2) {
          displayDate = 'OFF'
        } else if (log.isOff === 3) {
          displayDate = 'OFF'
        } else {
          const sin = log.shiftIn ? log.shiftIn.slice(0, 5) : '00:00'
          const sout = log.shiftOut ? log.shiftOut.slice(0, 5) : '00:00'
          displayDate = `${sin}\n${sout}`
        }

        if (!log.hasLogs) {
          ket = 'x'
        }
      }

      dailyLogs.push({
        day: d,
        date: dateStr,
        display: displayDate,
        ket
      })
    }

    return {
      id: emp.id,
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      photoPath: emp.photoPath,
      teamName: emp.teamName,
      days: dailyLogs
    }
  })

  return {
    data,
    meta: {
      page,
      perPage,
      total
    }
  }
})
