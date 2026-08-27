import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeHobbies } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const replaceHobbiesSchema = z.object({
  hobbies: z.array(z.string().min(1).max(100)),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, replaceHobbiesSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  await db.transaction(async (tx) => {
    await tx.delete(employeeHobbies).where(eq(employeeHobbies.employeeId, employee.id))
    if (body.hobbies.length) {
      await tx.insert(employeeHobbies).values(body.hobbies.map((hobby) => ({ employeeId: employee.id, hobby })))
    }
  })

  const rows = await db.select().from(employeeHobbies).where(eq(employeeHobbies.employeeId, employee.id))
  return { data: rows }
})
