import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, assetDepreciationLogs, assetDepreciationRuns } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody(event)
  const { periodDate } = body // e.g. "2026-08-01"

  if (!periodDate) {
    throw createError({ statusCode: 400, statusMessage: 'Tanggal periode wajib diisi.' })
  }

  const db = useDb()

  // 1. Verify period is not already generated
  const [existingRun] = await db
    .select()
    .from(assetDepreciationRuns)
    .where(eq(assetDepreciationRuns.periodDate, periodDate))
    .limit(1)

  if (existingRun) {
    throw createError({
      statusCode: 400,
      statusMessage: `Depresiasi untuk periode ${periodDate.slice(0, 7)} sudah pernah digenerate.`,
    })
  }

  let totalAssetsProcessed = 0
  let totalAmountProcessed = 0

  await db.transaction(async (tx) => {
    // 2. Insert run header
    const [runRes] = await tx.insert(assetDepreciationRuns).values({
      periodDate,
      totalAssets: 0,
      totalAmount: '0.00',
      createdBy: user.sub,
    })
    const runId = runRes.insertId

    // 3. Fetch all active assets
    const activeAssets = await tx
      .select()
      .from(assets)
      .where(isNull(assets.deletedAt))

    for (const asset of activeAssets) {
      // Get all existing logs for this asset
      const assetLogs = await tx
        .select()
        .from(assetDepreciationLogs)
        .where(eq(assetDepreciationLogs.assetId, asset.id))

      const loggedCount = assetLogs.length
      // If this asset still has remaining economic life
      if (loggedCount < asset.economicAge) {
        const remainingAge = asset.economicAge - loggedCount - 1
        const totalDepreciated = assetLogs.reduce((sum, l) => sum + Number(l.amount), 0)
        const priceNum = Number(asset.price)
        const remainingValueBefore = priceNum - totalDepreciated

        let amount = 0
        if (remainingAge === 0) {
          // Final month: depreciate all remaining value down to exactly 0 (resolving rounding perak)
          amount = remainingValueBefore
        } else {
          // Regular month: price / economicAge rounded to 2 decimals
          amount = Number((priceNum / asset.economicAge).toFixed(2))
        }

        const remainingValueAfter = Math.max(0, remainingValueBefore - amount)

        // Insert log row
        await tx.insert(assetDepreciationLogs).values({
          runId,
          assetId: asset.id,
          periodDate,
          amount: String(amount),
          remainingAge,
          remainingValue: String(remainingValueAfter),
        })

        totalAssetsProcessed++
        totalAmountProcessed += amount
      }
    }

    // 4. Update run header summary
    if (totalAssetsProcessed > 0) {
      await tx
        .update(assetDepreciationRuns)
        .set({
          totalAssets: totalAssetsProcessed,
          totalAmount: String(totalAmountProcessed),
        })
        .where(eq(assetDepreciationRuns.id, runId))
    } else {
      // If no assets were processed, clean up the run header or keep it with 0
      await tx
        .update(assetDepreciationRuns)
        .set({
          totalAssets: 0,
          totalAmount: '0.00',
        })
        .where(eq(assetDepreciationRuns.id, runId))
    }
  })

  return {
    data: {
      success: true,
      totalAssets: totalAssetsProcessed,
      totalAmount: totalAmountProcessed,
    },
  }
})
