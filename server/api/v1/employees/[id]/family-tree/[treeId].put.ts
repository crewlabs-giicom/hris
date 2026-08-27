import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeFamilyTree } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateFamilyTreeSchema = z.object({
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
  const treeId = getRouterParam(event, 'treeId') as string
  const body = await readValidatedBody(event, updateFamilyTreeSchema.parse)
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeFamilyTree)
    .where(and(eq(employeeFamilyTree.id, treeId), eq(employeeFamilyTree.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Family tree entry not found' })
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employeeFamilyTree).set(updates).where(eq(employeeFamilyTree.id, treeId))
  }

  const [updated] = await db.select().from(employeeFamilyTree).where(eq(employeeFamilyTree.id, treeId)).limit(1)
  return { data: updated }
})
