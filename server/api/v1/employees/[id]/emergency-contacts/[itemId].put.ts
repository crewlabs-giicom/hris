import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeEmergencyContacts } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateEmergencyContactSchema = z.object({
  name: z.string().max(255).optional(),
  relation: z.string().max(255).optional(),
  phone: z.string().max(255).optional(),
  address: z.string().max(255).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const itemId = getRouterParam(event, 'itemId') as string
  const body = await readValidatedBody(event, updateEmergencyContactSchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeEmergencyContacts)
    .where(and(eq(employeeEmergencyContacts.id, itemId), eq(employeeEmergencyContacts.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Emergency contact not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeEmergencyContacts).set(updates).where(eq(employeeEmergencyContacts.id, itemId))
  }

  const [updated] = await db.select().from(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.id, itemId)).limit(1)
  return { data: updated }
})
