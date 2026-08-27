import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeLevelHistories } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const createLevelHistorySchema = z.object({
  levelId: z.coerce.number().int(),
  effectiveDate: z.string().min(1),
  note: z.string().max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, createLevelHistorySchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(idFilter, isNull(employees.deletedAt)))
    .limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const [res] = await db.insert(employeeLevelHistories).values({
    employeeId: employee.id,
    levelId: body.levelId,
    effectiveDate: body.effectiveDate,
    note: body.note ?? null,
  })

  const [created] = await db.select().from(employeeLevelHistories).where(eq(employeeLevelHistories.id, res.insertId)).limit(1)
  return { data: created }
})
