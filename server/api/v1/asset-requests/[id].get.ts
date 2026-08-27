import { eq, and, isNull, inArray, sql } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assetRequests, companies, employees, assetRequestImages, assetRequestDetails, assetRequestDetailImages, manufacturers, rooms } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  // 1. Fetch main request details
  const [request] = await db
    .select({
      id: assetRequests.id,
      code: assetRequests.code,
      employeeId: assetRequests.employeeId,
      category: assetRequests.category,
      ptId: assetRequests.ptId,
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
      ptName: companies.name,
      ptCode: companies.code,
      requesterName: employees.fullName,
      requesterEmployeeCode: employees.employeeCode,
      financeName: sql<string>`(SELECT full_name FROM employees WHERE id = ${assetRequests.financeId} LIMIT 1)`
    })
    .from(assetRequests)
    .innerJoin(companies, eq(assetRequests.ptId, companies.id))
    .innerJoin(employees, eq(assetRequests.employeeId, employees.id))
    .where(and(eq(assetRequests.id, id), isNull(assetRequests.deletedAt)))
    .limit(1)

  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Asset Request not found' })
  }

  // 2. Fetch master attachments
  const masterImages = await db
    .select({
      id: assetRequestImages.id,
      attachment: assetRequestImages.attachment,
    })
    .from(assetRequestImages)
    .where(eq(assetRequestImages.assetRequestId, id))

  // 3. Fetch details list
  const details = await db
    .select({
      id: assetRequestDetails.id,
      arfNumber: assetRequestDetails.arfNumber,
      name: assetRequestDetails.name,
      price: assetRequestDetails.price,
      quantity: assetRequestDetails.quantity,
      totalPrice: assetRequestDetails.totalPrice,
      economicAge: assetRequestDetails.economicAge,
      condition: assetRequestDetails.condition,
      manufacturerId: assetRequestDetails.manufacturerId,
      roomId: assetRequestDetails.roomId,
      mfgName: manufacturers.name,
      roomName: rooms.name,
    })
    .from(assetRequestDetails)
    .innerJoin(manufacturers, eq(assetRequestDetails.manufacturerId, manufacturers.id))
    .innerJoin(rooms, eq(assetRequestDetails.roomId, rooms.id))
    .where(and(eq(assetRequestDetails.assetRequestId, id), isNull(assetRequestDetails.deletedAt)))

  // 4. Fetch detail images for each item
  const detailIds = details.map((d) => d.id)
  const detailImages = detailIds.length > 0
    ? await db
        .select({
          id: assetRequestDetailImages.id,
          assetRequestDetailId: assetRequestDetailImages.assetRequestDetailId,
          attachment: assetRequestDetailImages.attachment,
        })
        .from(assetRequestDetailImages)
        .where(inArray(assetRequestDetailImages.assetRequestDetailId, detailIds))
    : []

  // Group detail images by detail ID
  const detailImagesMap = new Map<number, string[]>()
  for (const di of detailImages) {
    if (!detailImagesMap.has(di.assetRequestDetailId)) {
      detailImagesMap.set(di.assetRequestDetailId, [])
    }
    detailImagesMap.get(di.assetRequestDetailId)!.push(di.attachment)
  }

  const items = details.map((item) => {
    return {
      ...item,
      images: detailImagesMap.get(item.id) || [],
    }
  })

  return {
    data: {
      ...request,
      images: masterImages.map((m) => m.attachment),
      items,
    },
  }
})
