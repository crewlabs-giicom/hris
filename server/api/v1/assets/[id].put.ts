import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, assetHasEmployees, assetImages } from '~~/server/db/schema'
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
    name,
    purchaseFromDate,
    purchaseToDate,
    manufactureId,
    economicAge,
    condition,
    price,
    description,
    status,
    category, // 'asuransi', 'asset', 'sewa'
    ptId,
    location,
    roomId,
    divisi,
    employeeIds,
    images,
  } = body

  // Validate required fields
  if (
    !name ||
    !purchaseFromDate ||
    !purchaseToDate ||
    !manufactureId ||
    economicAge === undefined ||
    !condition ||
    !price ||
    !status ||
    !category ||
    !ptId ||
    !location ||
    !roomId ||
    !divisi
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields for asset update.',
    })
  }

  const db = useDb()

  const [row] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), isNull(assets.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
  }

  await db.transaction(async (tx) => {
    // 1. Update main asset fields
    await tx
      .update(assets)
      .set({
        name,
        purchaseFromDate,
        purchaseToDate,
        manufactureId: Number(manufactureId),
        economicAge: Number(economicAge),
        condition,
        price: String(price),
        description: description ? String(description).trim() : null,
        status,
        category,
        ptId: Number(ptId),
        location,
        roomId: Number(roomId),
        divisi: Number(divisi),
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))

    // 2. Pivot: assetHasEmployees
    if (Array.isArray(employeeIds)) {
      // Clear current assignments
      await tx.delete(assetHasEmployees).where(eq(assetHasEmployees.assetId, id))
      // Insert new ones
      for (const empId of employeeIds) {
        if (empId) {
          await tx.insert(assetHasEmployees).values({
            assetId: id,
            employeeId: Number(empId),
          })
        }
      }
    }

    // 3. Pivot: assetImages
    if (Array.isArray(images)) {
      // Clear current images
      await tx.delete(assetImages).where(eq(assetImages.assetId, id))
      // Insert new ones
      for (const path of images) {
        if (path) {
          await tx.insert(assetImages).values({
            assetId: id,
            attachment: path,
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
