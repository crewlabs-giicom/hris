import { getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeDocuments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const rows = await db
    .select({
      id: employeeDocuments.id,
      documentType: employeeDocuments.documentType,
      fileName: employeeDocuments.fileName,
      mimeType: employeeDocuments.mimeType,
      fileSize: employeeDocuments.fileSize,
      uploadedAt: employeeDocuments.uploadedAt,
    })
    .from(employeeDocuments)
    .where(eq(employeeDocuments.employeeId, employeeId))

  return { data: rows }
})
