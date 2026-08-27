import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeFamilyTree } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const createFamilyTreeSchema = z.object({
  name: z.string().max(50).optional(),
  relation: z.string().max(50).optional(),
  gender: z.enum(['L', 'P']).optional(),
  birthDate: z.string().min(1).optional(),
  lastEducation: z.string().max(50).optional(),
  lastWork: z.string().max(50).optional(),
  lastInstitute: z.string().max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, createFamilyTreeSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const [res] = await db.insert(employeeFamilyTree).values({ employeeId: employee.id, ...body })

  const [created] = await db.select().from(employeeFamilyTree).where(eq(employeeFamilyTree.id, res.insertId)).limit(1)
  return { data: created }
})
