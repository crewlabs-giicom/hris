import { useDb } from '~~/server/db'
import { employeePermissions, permissionAttachments, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { deleteUploadedFile, STORAGE_ROOT } from '~~/server/utils/upload'
import { createError, readBody } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const user = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const { employeeId, permissionsTypeId, validFrom, validTo, description, status, attachments } = body

  const db = useDb()

  // 1. Fetch existing permission request
  const [row] = await db
    .select()
    .from(employeePermissions)
    .where(and(eq(employeePermissions.id, id), isNull(employeePermissions.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Permission not found' })
  }

  // Action block: only allow modifying when status is "active"
  if (row.status !== 'active') {
    throw createError({ statusCode: 400, statusMessage: 'Only permission transactions with "active" status can be modified' })
  }

  // Validate mandatory fields
  if (!permissionsTypeId || !validFrom || !validTo || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Required fields: permissionsTypeId, validFrom, validTo, description' })
  }

  const categoryId = Number(permissionsTypeId)
  const isNoSkd = categoryId === 4

  const attachmentList = Array.isArray(attachments) ? attachments.filter(Boolean) : []

  // Validate attachment constraints
  if (!isNoSkd && attachmentList.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one attachment is required for this permission category' })
  }

  const finalAttachments = isNoSkd ? [] : attachmentList

  // Always resolve employeeId from the logged-in user
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, user.sub), isNull(employees.deletedAt)))
    .limit(1)

  if (!emp) {
    throw createError({ statusCode: 400, statusMessage: 'Current user has no associated employee record.' })
  }
  const finalEmployeeId = emp.id

  // 2. Perform database transaction to sync records and storage
  await db.transaction(async (tx) => {
    // Update main record
    await tx
      .update(employeePermissions)
      .set({
        employeeId: finalEmployeeId,
        permissionsTypeId: categoryId,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        description: String(description).trim(),
        status: status || row.status,
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(employeePermissions.id, id))

    // Fetch existing attachment records for this transaction
    const existing = await tx
      .select()
      .from(permissionAttachments)
      .where(eq(permissionAttachments.permissionId, id))

    const existingPaths = existing.map((e) => e.attachment)

    // Remove attachments no longer present in the updated list
    const toRemove = existing.filter((e) => !finalAttachments.includes(e.attachment))
    for (const item of toRemove) {
      // Delete from DB
      await tx.delete(permissionAttachments).where(eq(permissionAttachments.id, item.id))
      // Delete file from disk
      const filePath = join(STORAGE_ROOT, item.attachment)
      await deleteUploadedFile(filePath)
    }

    // Add new attachments
    const toAdd = finalAttachments.filter((p) => !existingPaths.includes(p))
    for (const filePath of toAdd) {
      await tx.insert(permissionAttachments).values({
        permissionId: id,
        attachment: filePath,
      })
    }
  })

  return {
    data: {
      success: true,
    },
  }
})
