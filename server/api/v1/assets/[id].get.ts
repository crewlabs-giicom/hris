import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, companies, manufacturers, rooms, divisions, assetImages, assetHasEmployees, employees, assetDepreciationLogs } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  const [asset] = await db
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
    })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(manufacturers, eq(assets.manufactureId, manufacturers.id))
    .innerJoin(rooms, eq(assets.roomId, rooms.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
    .limit(1)

  if (!asset) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
  }

  // Fetch images
  const images = await db
    .select({
      id: assetImages.id,
      attachment: assetImages.attachment,
    })
    .from(assetImages)
    .where(eq(assetImages.assetId, id))

  // Fetch responsible employees
  const assignedEmployees = await db
    .select({
      id: employees.id,
      fullName: employees.fullName,
      employeeCode: employees.employeeCode,
    })
    .from(assetHasEmployees)
    .innerJoin(employees, eq(assetHasEmployees.employeeId, employees.id))
    .where(eq(assetHasEmployees.assetId, id))

  // Fetch depreciation logs
  const logs = await db
    .select({
      id: assetDepreciationLogs.id,
      amount: assetDepreciationLogs.amount,
      periodDate: assetDepreciationLogs.periodDate,
    })
    .from(assetDepreciationLogs)
    .where(eq(assetDepreciationLogs.assetId, id))

  const loggedCount = logs.length
  const totalDepreciated = logs.reduce((sum, l) => sum + Number(l.amount), 0)

  const sisaMasaManfaat = Math.max(0, asset.economicAge - loggedCount)
  const nilaiSisaManfaat = Math.max(0, Number(asset.price) - totalDepreciated)

  return {
    data: {
      ...asset,
      images,
      employees: assignedEmployees,
      sisaMasaManfaat,
      nilaiSisaManfaat,
      kaliDisusutkan: `${loggedCount} / ${asset.economicAge}`,
    },
  }
})
