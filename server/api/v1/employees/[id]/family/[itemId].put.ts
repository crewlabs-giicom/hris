import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeFamily } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateFamilySchema = z.object({
  name: z.string().max(255).optional(),
  birthDate: z.string().optional(),
  familyRelation: z.string().max(25).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const body = await readValidatedBody(event, updateFamilySchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeFamily)
    .where(and(eq(employeeFamily.id, itemId), eq(employeeFamily.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Family entry not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeFamily).set(updates).where(eq(employeeFamily.id, itemId))
  }

  const [updated] = await db.select().from(employeeFamily).where(eq(employeeFamily.id, itemId)).limit(1)
  return { data: updated }
})
