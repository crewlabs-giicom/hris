import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeWorkExperiences } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const createWorkExperienceSchema = z.object({
  companyName: z.string().max(255).optional(),
  workPosition: z.string().max(255).optional(),
  workLength: z.string().max(255).optional(),
  salaryPerMonth: z.string().max(100).optional(),
  reasonForLeaving: z.string().max(255).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, createWorkExperienceSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const [res] = await db.insert(employeeWorkExperiences).values({ employeeId: employee.id, ...body })

  const [created] = await db.select().from(employeeWorkExperiences).where(eq(employeeWorkExperiences.id, res.insertId)).limit(1)
  return { data: created }
})
