import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { divisions, employees } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: divisions,
  idColumn: divisions.id,
  permissions: { view: 'divisions.view', create: 'divisions.manage', update: 'divisions.manage', delete: 'divisions.manage' },
  createSchema: z.object({ name: z.string().min(1).max(255), code: z.string().min(1).max(32) }),
  updateSchema: z.object({ name: z.string().min(1).max(255).optional(), code: z.string().min(1).max(32).optional() }),
  sortWhitelist: { name: divisions.name, code: divisions.code, createdAt: divisions.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.divisionId, id))

    if (Number(employeeCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Division is still used by ${employeeCount} employee(s)` })
    }
  },
})
