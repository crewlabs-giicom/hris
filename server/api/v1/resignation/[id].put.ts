import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { resignations, resignationTasks, resignationAssets } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const { employeeId, resignationDate, resignationType, resignationReason, status, tasks, assets } = body

  if (!employeeId || !resignationDate || !resignationType || !resignationReason) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, resignationDate, resignationType, resignationReason',
    })
  }

  const db = useDb()

  // 1. Verify existence
  const [existing] = await db
    .select()
    .from(resignations)
    .where(and(eq(resignations.id, id), isNull(resignations.deletedAt)))
    .limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Resignation not found' })
  }

  // 2. Perform transaction update
  await db.transaction(async (tx) => {
    // Update main record
    await tx
      .update(resignations)
      .set({
        employeeId: Number(employeeId),
        resignationDate: new Date(resignationDate).toISOString().slice(0, 10),
        resignationType: String(resignationType).trim(),
        resignationReason: String(resignationReason).trim(),
        status: status || existing.status,
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(resignations.id, id))

    // Sync tasks: delete all current and insert updated list
    await tx.delete(resignationTasks).where(eq(resignationTasks.resignationId, id))
    const taskList = Array.isArray(tasks) ? tasks : []
    for (const item of taskList) {
      if (item.task && item.type) {
        await tx.insert(resignationTasks).values({
          resignationId: id,
          task: String(item.task).trim(),
          type: item.type === 'hard copy' ? 'hard copy' : 'soft copy',
        })
      }
    }

    // Sync assets: delete all current and insert updated list
    await tx.delete(resignationAssets).where(eq(resignationAssets.resignationId, id))
    const assetList = Array.isArray(assets) ? assets : []
    for (const asset of assetList) {
      if (asset.assetId) {
        await tx.insert(resignationAssets).values({
          resignationId: id,
          assetId: Number(asset.assetId),
        })
      }
    }
  })

  return {
    data: {
      success: true,
    },
  }
})
