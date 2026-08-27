import { getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { saveUploadedFile, deleteUploadedFile } from '~~/server/utils/upload'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const upload = await saveUploadedFile(event, {
    subdir: 'employee-photos',
    allowedMime: ['image/jpeg', 'image/png'],
  })

  if (employee.photoPath) {
    await deleteUploadedFile(employee.photoPath)
  }
  await db.update(employees).set({ photoPath: upload.filePath }).where(eq(employees.id, employeeId))

  return { data: { photoUploaded: true } }
})
