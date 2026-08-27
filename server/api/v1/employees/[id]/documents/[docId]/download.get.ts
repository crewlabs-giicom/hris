import { getRouterParam, createError, setHeader } from 'h3'
import { and, eq } from 'drizzle-orm'
import { readFile } from 'node:fs/promises'
import { useDb } from '~~/server/db'
import { employeeDocuments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

// Protected file serving — never a public/static URL. Only hr_admin/super_admin can
// download employee documents (same gate as the rest of the employee-documents routes).
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

  const buffer = await readFile(row.filePath).catch(() => {
    throw createError({ statusCode: 404, statusMessage: 'File missing on disk' })
  })

  setHeader(event, 'Content-Type', row.mimeType)
  setHeader(event, 'Content-Disposition', `inline; filename="${encodeURIComponent(row.fileName)}"`)
  return buffer
})
