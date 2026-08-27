import { eq, and, like, isNull, sql } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assetRequests, assetRequestDetails, assetRequestImages, assetRequestDetailImages, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const db = useDb()

  // 1. Resolve logged-in employee ID
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, user.sub))
    .limit(1)

  if (!employee) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Pengguna yang login tidak terhubung dengan NIK Karyawan manapun.',
    })
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
    description,
    images, // Array of strings (master attachments)
    items, // Array of objects (name, arfNumber, roomId, condition, price, quantity, manufacturerId, economicAge, images)
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
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semua kolom wajib pengajuan aset harus diisi dan minimal terdapat 1 item detail.',
    })
  }

  // 2. Generate unique RF Number (code)
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const [lastRow] = await db
    .select({ code: assetRequests.code })
    .from(assetRequests)
    .where(like(assetRequests.code, `REQ-ASSET-${todayStr}-%`))
    .orderBy(sql`${assetRequests.code} DESC`)
    .limit(1)

  let sequence = 1
  if (lastRow) {
    const parts = lastRow.code.split('-')
    const lastSeq = Number(parts[parts.length - 1])
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1
    }
  }
  const generatedCode = `REQ-ASSET-${todayStr}-${String(sequence).padStart(4, '0')}`

  // Calculate prices
  let totalPriceAccumulator = 0
  const processedItems = items.map((item: any) => {
    const itemPrice = Number(item.price) || 0
    const itemQty = Math.max(1, Number(item.quantity) || 1)
    const itemTotal = itemPrice * itemQty
    totalPriceAccumulator += itemTotal

    return {
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

  // 3. Save inside database transaction
  const insertId = await db.transaction(async (tx) => {
    // A. Insert main request
    const [reqRes] = await tx.insert(assetRequests).values({
      code: generatedCode,
      employeeId: employee.id,
      category,
      ptId: Number(ptId),
      marketplace,
      bank,
      rekening,
      paymentTo,
      financeId: Number(financeId),
      requestDate,
      price: String(totalPriceAccumulator),
      description: description ? String(description).trim() : null,
      status: 'pending',
      createdBy: user.sub,
    })
    const requestId = reqRes.insertId

    // B. Insert master attachments
    if (Array.isArray(images) && images.length > 0) {
      for (const imgPath of images) {
        if (imgPath) {
          await tx.insert(assetRequestImages).values({
            assetRequestId: requestId,
            attachment: imgPath,
          })
        }
      }
    }

    // C. Insert items and their attachments
    for (const item of processedItems) {
      const [itemRes] = await tx.insert(assetRequestDetails).values({
        assetRequestId: requestId,
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
      const itemDetailId = itemRes.insertId

      // Insert item images
      if (item.images.length > 0) {
        for (const detailImgPath of item.images) {
          if (detailImgPath) {
            await tx.insert(assetRequestDetailImages).values({
              assetRequestDetailId: itemDetailId,
              attachment: detailImgPath,
            })
          }
        }
      }
    }

    return requestId
  })

  return {
    data: {
      id: insertId,
      code: generatedCode,
      success: true,
    },
  }
})
