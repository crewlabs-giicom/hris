import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeLanguages } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const replaceLanguagesSchema = z.object({
  languages: z.array(
    z.object({
      language: z.string().min(1).max(50),
      proficiency: z.string().min(1).max(20),
    })
  ),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, replaceLanguagesSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  await db.transaction(async (tx) => {
    await tx.delete(employeeLanguages).where(eq(employeeLanguages.employeeId, employee.id))
    if (body.languages.length) {
      await tx.insert(employeeLanguages).values(
        body.languages.map((l) => ({ employeeId: employee.id, language: l.language, proficiency: l.proficiency }))
      )
    }
  })

  const rows = await db.select().from(employeeLanguages).where(eq(employeeLanguages.employeeId, employee.id))
  return { data: rows }
})
