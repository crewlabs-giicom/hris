import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeeFamilyTree } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const treeId = getRouterParam(event, 'treeId') as string
  const db = useDb()

  const [row] = await db
    .select()
    .from(employeeFamilyTree)
    .where(and(eq(employeeFamilyTree.id, treeId), eq(employeeFamilyTree.employeeId, employeeId)))
    .limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Family tree entry not found' })
  }

  await db.delete(employeeFamilyTree).where(eq(employeeFamilyTree.id, treeId))
  return { data: { id: treeId } }
})
