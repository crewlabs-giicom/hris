import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeOrganization } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateOrganizationSchema = z.object({
  name: z.string().max(50).optional(),
  position: z.string().max(50).optional(),
  organizationLength: z.string().max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const body = await readValidatedBody(event, updateOrganizationSchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeOrganization)
    .where(and(eq(employeeOrganization.id, itemId), eq(employeeOrganization.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Organization entry not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeOrganization).set(updates).where(eq(employeeOrganization.id, itemId))
  }

  const [updated] = await db.select().from(employeeOrganization).where(eq(employeeOrganization.id, itemId)).limit(1)
  return { data: updated }
})
