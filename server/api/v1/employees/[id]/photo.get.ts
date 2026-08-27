import { getRouterParam, createError, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

const MIME_BY_EXT: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }

// Any authenticated user can view a profile photo (unlike documents, which are
// restricted to hr_admin/super_admin) — it's a display avatar, not sensitive paperwork.
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1)
  if (!employee?.photoPath) {
    throw createError({ statusCode: 404, statusMessage: 'Photo not found' })
  }

  const buffer = await readFile(employee.photoPath).catch(() => {
    throw createError({ statusCode: 404, statusMessage: 'File missing on disk' })
  })

  setHeader(event, 'Content-Type', MIME_BY_EXT[extname(employee.photoPath)] ?? 'application/octet-stream')
  return buffer
})
