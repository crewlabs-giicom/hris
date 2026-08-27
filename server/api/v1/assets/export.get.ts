import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, companies, manufacturers, rooms, divisions, assetHasEmployees, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const conditions: SQL[] = [isNull(assets.deletedAt)]

  // Asset Code filter
  if (query.codes) {
    const codes = String(query.codes).split(',').map(c => c.trim()).filter(Boolean)
    if (codes.length > 0) {
      conditions.push(inArray(assets.code, codes))
    }
  } else {
    // Normal filters
    if (query.roomId) {
      const roomIds = String(query.roomId).split(',').map(Number).filter(Boolean)
      if (roomIds.length > 0) {
        conditions.push(inArray(assets.roomId, roomIds))
      }
    }

    if (query.ptId) {
      const ptIds = String(query.ptId).split(',').map(Number).filter(Boolean)
      if (ptIds.length > 0) {
        conditions.push(inArray(assets.ptId, ptIds))
      }
    }

    if (query.manufactureId) {
      const mfgIds = String(query.manufactureId).split(',').map(Number).filter(Boolean)
      if (mfgIds.length > 0) {
        conditions.push(inArray(assets.manufactureId, mfgIds))
      }
    }

    if (query.location) {
      conditions.push(like(assets.location, `%${String(query.location).trim()}%`))
    }

    if (query.month) {
      conditions.push(sql`MONTH(${assets.createdAt}) = ${Number(query.month)}`)
    }

    if (query.year) {
      conditions.push(sql`YEAR(${assets.createdAt}) = ${Number(query.year)}`)
    }

    if (query.search) {
      const searchVal = `%${String(query.search).trim()}%`
      conditions.push(
        or(
          like(assets.name, searchVal),
          like(assets.code, searchVal),
          like(assets.description, searchVal)
        ) as SQL
      )
    }
  }

  // Fetch all rows matching filters without limit
  const rows = await db
    .select({
      id: assets.id,
      code: assets.code,
      name: assets.name,
      purchaseFromDate: assets.purchaseFromDate,
      purchaseToDate: assets.purchaseToDate,
      economicAge: assets.economicAge,
      condition: assets.condition,
      price: assets.price,
      description: assets.description,
      status: assets.status,
      category: assets.category,
      location: assets.location,
      createdAt: assets.createdAt,
      ptCode: companies.code,
      ptName: companies.name,
      manufactureName: manufacturers.name,
      roomName: rooms.name,
      divisionName: divisions.name,
      employeeFullName: employees.fullName,
    })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(manufacturers, eq(assets.manufactureId, manufacturers.id))
    .innerJoin(rooms, eq(assets.roomId, rooms.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .leftJoin(assetHasEmployees, eq(assets.id, assetHasEmployees.assetId))
    .leftJoin(employees, eq(assetHasEmployees.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(sql`${assets.createdAt} DESC`)

  // Aggregate in memory
  const assetsMap = new Map<number, any>()
  for (const r of rows) {
    if (!assetsMap.has(r.id)) {
      assetsMap.set(r.id, {
        id: r.id,
        code: r.code,
        name: r.name,
        purchaseFromDate: r.purchaseFromDate,
        purchaseToDate: r.purchaseToDate,
        economicAge: r.economicAge,
        condition: r.condition,
        price: r.price,
        description: r.description,
        status: r.status,
        category: r.category,
        location: r.location,
        createdAt: r.createdAt,
        ptCode: r.ptCode,
        ptName: r.ptName,
        manufactureName: r.manufactureName,
        roomName: r.roomName,
        divisionName: r.divisionName,
        employees: [],
      })
    }

    if (r.employeeFullName) {
      assetsMap.get(r.id).employees.push(r.employeeFullName)
    }
  }

  const data = Array.from(assetsMap.values()).map((asset) => {
    return {
      ...asset,
      personResponsible: asset.employees.join(', ') || '-',
    }
  })

  return { data }
})
