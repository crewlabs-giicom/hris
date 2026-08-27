import { eq, and, isNull, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import {
  assetRequests,
  assetRequestDetails,
  assetRequestImages,
  assetRequestDetailImages,
  employees,
  divisions,
  assets,
  assetImages,
  assetHasEmployees,
} from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const {
    category,
    ptId,
    marketplace,
    bank,
    rekening,
    paymentTo,
    financeId,
    requestDate,
    paymentDate,
    description,
    status, // 'pending', 'approved', 'rejected', 'completed'
    images, // Array of strings (master attachments)
    items, // Array of objects
  } = body

  // Validate inputs
  if (
    !category ||
    !ptId ||
    !marketplace ||
    !bank ||
    !rekening ||
    !paymentTo ||
    !financeId ||
    !requestDate ||
    !status ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semua kolom wajib pengajuan aset harus diisi dan minimal terdapat 1 item detail.',
    })
  }

  const db = useDb()

  const [row] = await db
    .select()
    .from(assetRequests)
    .where(and(eq(assetRequests.id, id), isNull(assetRequests.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Asset Request not found' })
  }

  // Calculate prices
  let totalPriceAccumulator = 0
  const processedItems = items.map((item: any) => {
    const itemPrice = Number(item.price) || 0
    const itemQty = Math.max(1, Number(item.quantity) || 1)
    const itemTotal = itemPrice * itemQty
    totalPriceAccumulator += itemTotal

    return {
      id: item.id || null, // exists or not
      arfNumber: item.arfNumber || '',
      name: item.name || '',
      price: String(itemPrice),
      quantity: itemQty,
      totalPrice: String(itemTotal),
      economicAge: Number(item.economicAge) || 1,
      condition: item.condition || 'new',
      manufacturerId: Number(item.manufacturerId),
      roomId: Number(item.roomId),
      images: Array.isArray(item.images) ? item.images : [],
    }
  })

  // Detect state transition to approved/completed
  const oldStatus = row.status
  const isStatusTransitionToApproved =
    (status === 'approved' || status === 'completed') &&
    (oldStatus !== 'approved' && oldStatus !== 'completed')

  await db.transaction(async (tx) => {
    // 1. Update main asset requests table
    await tx
      .update(assetRequests)
      .set({
        category,
        ptId: Number(ptId),
        marketplace,
        bank,
        rekening,
        paymentTo,
        financeId: Number(financeId),
        requestDate,
        paymentDate: paymentDate || null,
        price: String(totalPriceAccumulator),
        description: description ? String(description).trim() : null,
        status,
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(assetRequests.id, id))

    // 2. Sync master images
    await tx.delete(assetRequestImages).where(eq(assetRequestImages.assetRequestId, id))
    if (Array.isArray(images) && images.length > 0) {
      for (const imgPath of images) {
        if (imgPath) {
          await tx.insert(assetRequestImages).values({
            assetRequestId: id,
            attachment: imgPath,
          })
        }
      }
    }

    // 3. Sync details list (soft delete old ones, write new ones)
    const existingDetails = await tx
      .select({ id: assetRequestDetails.id })
      .from(assetRequestDetails)
      .where(and(eq(assetRequestDetails.assetRequestId, id), isNull(assetRequestDetails.deletedAt)))
    const existingIds = existingDetails.map((ed) => ed.id)

    const keepIds: number[] = []

    for (const item of processedItems) {
      if (item.id && existingIds.includes(item.id)) {
        // Update existing item
        await tx
          .update(assetRequestDetails)
          .set({
            arfNumber: item.arfNumber,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            economicAge: item.economicAge,
            condition: item.condition,
            manufacturerId: item.manufacturerId,
            roomId: item.roomId,
            updatedAt: new Date(),
          })
          .where(eq(assetRequestDetails.id, item.id))
        
        keepIds.push(item.id)

        // Sync item detail images
        await tx.delete(assetRequestDetailImages).where(eq(assetRequestDetailImages.assetRequestDetailId, item.id))
        if (item.images.length > 0) {
          for (const detailImgPath of item.images) {
            await tx.insert(assetRequestDetailImages).values({
              assetRequestDetailId: item.id,
              attachment: detailImgPath,
            })
          }
        }
      } else {
        // Insert new item
        const [insertRes] = await tx.insert(assetRequestDetails).values({
          assetRequestId: id,
          arfNumber: item.arfNumber,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          economicAge: item.economicAge,
          condition: item.condition,
          manufacturerId: item.manufacturerId,
          roomId: item.roomId,
        })
        const newItemId = insertRes.insertId

        // Insert new item detail images
        if (item.images.length > 0) {
          for (const detailImgPath of item.images) {
            await tx.insert(assetRequestDetailImages).values({
              assetRequestDetailId: newItemId,
              attachment: detailImgPath,
            })
          }
        }
      }
    }

    // Soft delete details that were removed
    const deleteIds = existingIds.filter((eid) => !keepIds.includes(eid))
    if (deleteIds.length > 0) {
      await tx
        .update(assetRequestDetails)
        .set({ deletedAt: new Date() })
        .where(inArray(assetRequestDetails.id, deleteIds))
    }

    // 4. Auto-generate master assets upon transition to Approved/Completed
    if (isStatusTransitionToApproved) {
      // A. Fetch requester employee and division
      const [requester] = await tx
        .select({ divisionId: employees.divisionId })
        .from(employees)
        .where(eq(employees.id, row.employeeId))
        .limit(1)

      let divisionId = requester?.divisionId
      if (!divisionId) {
        const [firstDiv] = await tx.select({ id: divisions.id }).from(divisions).limit(1)
        divisionId = firstDiv?.id || 1
      }

      // B. Fetch active details for this request
      const activeDetails = await tx
        .select()
        .from(assetRequestDetails)
        .where(and(eq(assetRequestDetails.assetRequestId, id), isNull(assetRequestDetails.deletedAt)))

      for (const item of activeDetails) {
        // Fetch detail images
        const detailImages = await tx
          .select({ attachment: assetRequestDetailImages.attachment })
          .from(assetRequestDetailImages)
          .where(eq(assetRequestDetailImages.assetRequestDetailId, item.id))

        const qty = Math.max(1, item.quantity)
        for (let i = 1; i <= qty; i++) {
          const assetCode = qty === 1 ? item.arfNumber : `${item.arfNumber}-${i}`

          // Insert into main master assets table
          const [assetRes] = await tx.insert(assets).values({
            code: assetCode,
            name: item.name,
            purchaseFromDate: requestDate,
            purchaseToDate: paymentDate || row.paymentDate || requestDate,
            manufactureId: item.manufacturerId,
            economicAge: item.economicAge,
            condition: item.condition === 'new' ? 'good' : item.condition,
            price: item.price,
            description: description || row.description || '',
            status: 'active',
            category: 'asset',
            ptId: Number(ptId),
            location: 'TBD',
            roomId: item.roomId,
            divisi: divisionId,
            createdBy: user.sub,
          })
          const newAssetId = assetRes.insertId

          // Copy attachments
          for (const img of detailImages) {
            await tx.insert(assetImages).values({
              assetId: newAssetId,
              attachment: img.attachment,
            })
          }

          // Copy penanggung jawab (asset_has_employees)
          await tx.insert(assetHasEmployees).values({
            assetId: newAssetId,
            employeeId: row.employeeId,
          })
        }
      }
    }
  })

  return {
    data: {
      id,
      success: true,
    },
  }
})
