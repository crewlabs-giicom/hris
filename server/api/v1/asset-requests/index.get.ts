import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assetRequests, companies, employees, teamHasUsers, teams, assetRequestDetails, rooms } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(assetRequests.deletedAt)]

  if (query.status) {
    conditions.push(eq(assetRequests.status, String(query.status)))
  }

  if (query.ptId) {
    const ptIds = String(query.ptId).split(',').map(Number).filter(Boolean)
    if (ptIds.length > 0) {
      conditions.push(inArray(assetRequests.ptId, ptIds))
    }
  }

  if (query.teamId) {
    const teamIds = String(query.teamId).split(',').map(Number).filter(Boolean)
    if (teamIds.length > 0) {
      conditions.push(inArray(teams.id, teamIds))
    }
  }

  if (query.arfNumber) {
    const val = `%${String(query.arfNumber).trim()}%`
    conditions.push(
      or(
        like(assetRequests.code, val),
        sql`EXISTS (
          SELECT 1 FROM asset_request_details 
          WHERE asset_request_details.asset_request_id = ${assetRequests.id} 
            AND asset_request_details.deleted_at IS NULL 
            AND asset_request_details.arf_number LIKE ${val}
        )`
      ) as SQL
    )
  }

  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(assetRequests.code, searchVal),
        like(assetRequests.description, searchVal),
        like(employees.fullName, searchVal),
        like(employees.nik, searchVal)
      ) as SQL
    )
  }

  // Get total count
  const countRes = await db
    .select({ count: sql<number>`count(distinct ${assetRequests.id})` })
    .from(assetRequests)
    .innerJoin(employees, eq(assetRequests.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .innerJoin(companies, eq(assetRequests.ptId, companies.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  if (total === 0) {
    return { data: [], meta: { page, perPage, total } }
  }

  // Get paginated asset request IDs
  const paginatedRequests = await db
    .select({ id: assetRequests.id })
    .from(assetRequests)
    .innerJoin(employees, eq(assetRequests.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .innerJoin(companies, eq(assetRequests.ptId, companies.id))
    .where(and(...conditions))
    .orderBy(sql`${assetRequests.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const requestIds = paginatedRequests.map((r) => r.id)

  // Fetch full details of matching requests
  const rows = await db
    .select({
      id: assetRequests.id,
      code: assetRequests.code,
      category: assetRequests.category,
      marketplace: assetRequests.marketplace,
      bank: assetRequests.bank,
      rekening: assetRequests.rekening,
      paymentTo: assetRequests.paymentTo,
      financeId: assetRequests.financeId,
      requestDate: assetRequests.requestDate,
      paymentDate: assetRequests.paymentDate,
      price: assetRequests.price,
      description: assetRequests.description,
      status: assetRequests.status,
      createdAt: assetRequests.createdAt,
      ptCode: companies.code,
      ptName: companies.name,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      teamName: teams.name,
    })
    .from(assetRequests)
    .innerJoin(employees, eq(assetRequests.employeeId, employees.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .innerJoin(companies, eq(assetRequests.ptId, companies.id))
    .where(inArray(assetRequests.id, requestIds))
    .orderBy(sql`${assetRequests.createdAt} DESC`)

  // Fetch details (items & rooms) for unique list of rooms per request
  const detailsRows = await db
    .select({
      assetRequestId: assetRequestDetails.assetRequestId,
      roomName: rooms.name,
    })
    .from(assetRequestDetails)
    .innerJoin(rooms, eq(assetRequestDetails.roomId, rooms.id))
    .where(and(inArray(assetRequestDetails.assetRequestId, requestIds), isNull(assetRequestDetails.deletedAt)))

  // Group room names by request ID
  const roomsMap = new Map<number, Set<string>>()
  for (const dr of detailsRows) {
    if (!roomsMap.has(dr.assetRequestId)) {
      roomsMap.set(dr.assetRequestId, new Set())
    }
    roomsMap.get(dr.assetRequestId)!.add(dr.roomName)
  }

  // Combine rows and grouped room lists
  const data = rows.map((r) => {
    const roomSet = roomsMap.get(r.id)
    const roomList = roomSet ? Array.from(roomSet).join(', ') : '-'
    return {
      ...r,
      roomName: roomList,
    }
  })

  return {
    data,
    meta: {
      page,
      perPage,
      total,
    },
  }
})
