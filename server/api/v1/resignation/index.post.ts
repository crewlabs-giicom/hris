import { useDb } from '~~/server/db'
import { resignations, resignationTasks, resignationAssets } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const body = await readBody(event)
  const { employeeId, resignationDate, resignationType, resignationReason, tasks, assets } = body

  // Validate required fields
  if (!employeeId || !resignationDate || !resignationType || !resignationReason) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: employeeId, resignationDate, resignationType, resignationReason',
    })
  }

  const db = useDb()

  const resignationId = await db.transaction(async (tx) => {
    // 1. Insert main resignation record
    const [result] = await tx.insert(resignations).values({
      employeeId: Number(employeeId),
      resignationDate: new Date(resignationDate).toISOString().slice(0, 10),
      resignationType: String(resignationType).trim(),
      resignationReason: String(resignationReason).trim(),
      status: 'active', // default status
      createdBy: user.sub,
      updatedBy: user.sub,
    })

    const newId = result.insertId

    // 2. Insert tasks
    const taskList = Array.isArray(tasks) ? tasks : []
    for (const item of taskList) {
      if (item.task && item.type) {
        await tx.insert(resignationTasks).values({
          resignationId: newId,
          task: String(item.task).trim(),
          type: item.type === 'hard copy' ? 'hard copy' : 'soft copy',
        })
      }
    }

    // 3. Insert assets (hidden/commented, but supported if sent)
    const assetList = Array.isArray(assets) ? assets : []
    for (const asset of assetList) {
      if (asset.assetId) {
        await tx.insert(resignationAssets).values({
          resignationId: newId,
          assetId: Number(asset.assetId),
        })
      }
    }

    return newId
  })

  return {
    data: {
      id: resignationId,
      success: true,
    },
  }
})
