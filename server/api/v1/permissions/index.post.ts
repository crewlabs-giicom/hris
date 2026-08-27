import { useDb } from '~~/server/db'
import { employeePermissions, permissionAttachments, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require logged-in user
  const user = requireAuth(event)

  const body = await readBody(event)
  const { permissionsTypeId, validFrom, validTo, description, attachments } = body

  // Check mandatory fields
  if (!permissionsTypeId || !validFrom || !validTo || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Required fields: permissionsTypeId, validFrom, validTo, description' })
  }

  const categoryId = Number(permissionsTypeId)
  const isNoSkd = categoryId === 4 // 'Tidak Masuk / Sakit tidak ada SKD' is permission category ID 4

  const attachmentList = Array.isArray(attachments) ? attachments.filter(Boolean) : []

  // Check attachment constraint
  if (!isNoSkd && attachmentList.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one attachment is required for this permission category' })
  }

  // Under 'Tidak Masuk / Sakit tidak ada SKD', clear all attachments if provided
  const finalAttachments = isNoSkd ? [] : attachmentList

  const db = useDb()

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

  // Use database transaction for atomicity
  const permissionId = await db.transaction(async (tx) => {
    // 1. Insert parent record
    const [result] = await tx.insert(employeePermissions).values({
      employeeId: finalEmployeeId,
      permissionsTypeId: categoryId,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      description: String(description).trim(),
      status: 'active', // default status
      createdBy: user.sub,
      updatedBy: user.sub,
    })

    const newId = result.insertId

    // 2. Insert child attachments
    for (const filePath of finalAttachments) {
      await tx.insert(permissionAttachments).values({
        permissionId: newId,
        attachment: filePath,
      })
    }

    return newId
  })

  return {
    data: {
      id: permissionId,
      success: true,
    },
  }
})
