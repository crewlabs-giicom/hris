import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeWorkExperiences } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateWorkExperienceSchema = z.object({
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
  const itemId = getRouterParam(event, 'itemId') as string
  const body = await readValidatedBody(event, updateWorkExperienceSchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeWorkExperiences)
    .where(and(eq(employeeWorkExperiences.id, itemId), eq(employeeWorkExperiences.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Work experience not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeWorkExperiences).set(updates).where(eq(employeeWorkExperiences.id, itemId))
  }

  const [updated] = await db.select().from(employeeWorkExperiences).where(eq(employeeWorkExperiences.id, itemId)).limit(1)
  return { data: updated }
})
