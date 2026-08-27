import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { positions, employees } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: positions,
  idColumn: positions.id,
  permissions: { view: 'positions.view', create: 'positions.manage', update: 'positions.manage', delete: 'positions.manage' },
  createSchema: z.object({ title: z.string().min(1).max(255), code: z.string().min(1).max(32), departmentId: z.coerce.number().int().optional() }),
  updateSchema: z.object({
    title: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(32).optional(),
    departmentId: z.coerce.number().int().optional().nullable(),
  }),
  sortWhitelist: { title: positions.title, code: positions.code, createdAt: positions.createdAt },
  defaultSort: { column: 'title', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.positionId, Number(id)))

    if (Number(employeeCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Position is still used by ${employeeCount} employee(s)` })
    }
  },
})
