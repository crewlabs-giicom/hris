import { and, eq, inArray, like, isNull, sql, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, companies, manufacturers, rooms, divisions, assetHasEmployees, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const offset = (page - 1) * perPage

  const conditions: SQL[] = [isNull(assets.deletedAt)]

  // Special filter: Asset Code (Multiple select). If this is present, ignore other filters!
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

    if (query.category) {
      conditions.push(eq(assets.category, String(query.category)))
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

  // Get total matching count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(manufacturers, eq(assets.manufactureId, manufacturers.id))
    .innerJoin(rooms, eq(assets.roomId, rooms.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .where(and(...conditions))

  const total = Number(countRes[0]?.count || 0)

  if (total === 0) {
    return { data: [], meta: { page, perPage, total } }
  }

  // Fetch paginated asset IDs first to avoid pagination corruption on left-joining multiple employees
  const paginatedAssets = await db
    .select({ id: assets.id })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(manufacturers, eq(assets.manufactureId, manufacturers.id))
    .innerJoin(rooms, eq(assets.roomId, rooms.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .where(and(...conditions))
    .orderBy(sql`${assets.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  const assetIds = paginatedAssets.map((a) => a.id)

  // Fetch complete rows for these IDs
  const rows = await db
    .select({
      id: assets.id,
      code: assets.code,
      name: assets.name,
      purchaseFromDate: assets.purchaseFromDate,
      purchaseToDate: assets.purchaseToDate,
      manufactureId: assets.manufactureId,
      economicAge: assets.economicAge,
      condition: assets.condition,
      price: assets.price,
      description: assets.description,
      status: assets.status,
      category: assets.category,
      ptId: assets.ptId,
      location: assets.location,
      roomId: assets.roomId,
      divisi: assets.divisi,
      createdAt: assets.createdAt,
      ptCode: companies.code,
      ptName: companies.name,
      manufactureName: manufacturers.name,
      roomName: rooms.name,
      divisionName: divisions.name,
      employeeId: employees.id,
      employeeFullName: employees.fullName,
    })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(manufacturers, eq(assets.manufactureId, manufacturers.id))
    .innerJoin(rooms, eq(assets.roomId, rooms.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .leftJoin(assetHasEmployees, eq(assets.id, assetHasEmployees.assetId))
    .leftJoin(employees, eq(assetHasEmployees.employeeId, employees.id))
    .where(inArray(assets.id, assetIds))
    .orderBy(sql`${assets.createdAt} DESC`)

  // Aggregate responsible employees in memory
  const assetsMap = new Map<number, any>()
  for (const r of rows) {
    if (!assetsMap.has(r.id)) {
      assetsMap.set(r.id, {
        id: r.id,
        code: r.code,
        name: r.name,
        purchaseFromDate: r.purchaseFromDate,
        purchaseToDate: r.purchaseToDate,
        manufactureId: r.manufactureId,
        economicAge: r.economicAge,
        condition: r.condition,
        price: r.price,
        description: r.description,
        status: r.status,
        category: r.category,
        ptId: r.ptId,
        location: r.location,
        roomId: r.roomId,
        divisi: r.divisi,
        createdAt: r.createdAt,
        pt: {
          code: r.ptCode,
          name: r.ptName,
        },
        manufacture: {
          name: r.manufactureName,
        },
        room: {
          name: r.roomName,
        },
        division: {
          name: r.divisionName,
        },
        employees: [],
      })
    }

    if (r.employeeId) {
      assetsMap.get(r.id).employees.push({
        id: r.employeeId,
        fullName: r.employeeFullName,
      })
    }
  }

  // Convert to flat list with computed comma-separated names
  const data = Array.from(assetsMap.values()).map((asset) => {
    return {
      ...asset,
      personResponsible: asset.employees.map((e: any) => e.fullName).join(', ') || '-',
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
