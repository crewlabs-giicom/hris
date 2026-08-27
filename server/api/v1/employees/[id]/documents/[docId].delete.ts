import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeDocuments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { deleteUploadedFile } from '~~/server/utils/upload'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const docId = getRouterParam(event, 'docId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeDocuments)
    .where(and(eq(employeeDocuments.id, docId), eq(employeeDocuments.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }

  await deleteUploadedFile(row.filePath)
  await db.delete(employeeDocuments).where(eq(employeeDocuments.id, docId))

  return { data: { id: docId } }
})
