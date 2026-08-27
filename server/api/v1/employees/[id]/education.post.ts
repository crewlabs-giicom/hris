import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeEducation } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const createEducationSchema = z.object({
  degree: z.string().max(255).optional(),
  schoolName: z.string().max(255).optional(),
  schoolYear: z.string().max(255).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, createEducationSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const [res] = await db.insert(employeeEducation).values({ employeeId: employee.id, ...body })

  const [created] = await db.select().from(employeeEducation).where(eq(employeeEducation.id, res.insertId)).limit(1)
  return { data: created }
})
