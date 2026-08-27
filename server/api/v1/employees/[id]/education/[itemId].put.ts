import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeEducation } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateEducationSchema = z.object({
  degree: z.string().max(255).optional(),
  schoolName: z.string().max(255).optional(),
  schoolYear: z.string().max(255).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const body = await readValidatedBody(event, updateEducationSchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeEducation)
    .where(and(eq(employeeEducation.id, itemId), eq(employeeEducation.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Education entry not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeEducation).set(updates).where(eq(employeeEducation.id, itemId))
  }

  const [updated] = await db.select().from(employeeEducation).where(eq(employeeEducation.id, itemId)).limit(1)
  return { data: updated }
})
