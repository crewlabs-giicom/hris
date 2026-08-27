import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { roomReservations, rooms, employees, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(roomReservations.deletedAt)]

  // Filter by Team (multiple selection, mapped via teamHasUsers)
  if (query.teamId) {
    const teamIds = String(query.teamId).split(',').map(Number).filter(Boolean)
    if (teamIds.length > 0) {
      const teamUserIds = await db
        .select({ userId: teamHasUsers.userId })
        .from(teamHasUsers)
        .where(inArray(teamHasUsers.teamId, teamIds))
      const userIds = teamUserIds.map((t) => t.userId)
      if (userIds.length > 0) {
        conditions.push(inArray(employees.userId, userIds))
      } else {
        conditions.push(eq(employees.id, -1))
      }
    }
  }

  // Filter by Room (multiple selection)
  if (query.roomId) {
    const roomIds = String(query.roomId).split(',').map(Number).filter(Boolean)
    if (roomIds.length > 0) {
      conditions.push(inArray(roomReservations.roomId, roomIds))
    }
  }

  // Filter by Month (single selection, on date)
  if (query.month) {
    conditions.push(sql`MONTH(${roomReservations.date}) = ${Number(query.month)}`)
  }

  // Filter by Year (single selection, on date)
  if (query.year) {
    conditions.push(sql`YEAR(${roomReservations.date}) = ${Number(query.year)}`)
  }

  // Search keyword (matches employee name, room name, or description)
  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(employees.fullName, searchVal),
        like(rooms.name, searchVal),
        like(roomReservations.description, searchVal)
      ) as SQL
    )
  }

  // Get total matching count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomReservations)
    .innerJoin(employees, eq(roomReservations.employeeId, employees.id))
    .innerJoin(rooms, eq(roomReservations.roomId, rooms.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  // Fetch paginated rows with employee, room, and team details
  const rows = await db
    .select({
      id: roomReservations.id,
      employeeId: roomReservations.employeeId,
      roomId: roomReservations.roomId,
      type: roomReservations.type,
      date: roomReservations.date,
      clockStart: roomReservations.clockStart,
      clockEnd: roomReservations.clockEnd,
      description: roomReservations.description,
      createdAt: roomReservations.createdAt,
      employeeFullName: employees.fullName,
      employeeCode: employees.employeeCode,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      roomName: rooms.name,
    })
    .from(roomReservations)
    .innerJoin(employees, eq(roomReservations.employeeId, employees.id))
    .innerJoin(rooms, eq(roomReservations.roomId, rooms.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(...conditions))
    .orderBy(sql`${roomReservations.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const data = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    roomId: r.roomId,
    type: r.type,
    date: r.date,
    clockStart: r.clockStart,
    clockEnd: r.clockEnd,
    description: r.description,
    createdAt: r.createdAt,
    employee: {
      fullName: r.employeeFullName,
      employeeCode: r.employeeCode,
      team: r.teamName ? { name: r.teamName } : null,
    },
    room: {
      name: r.roomName,
    },
  }))

  return {
    data,
    meta: {
      page,
      perPage,
      total,
    },
  }
})
