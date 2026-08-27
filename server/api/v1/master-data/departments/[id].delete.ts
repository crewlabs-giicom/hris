import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { departments, positions, employees } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: departments,
  idColumn: departments.id,
  permissions: { view: 'departments.view', create: 'departments.manage', update: 'departments.manage', delete: 'departments.manage' },
  createSchema: z.object({ name: z.string().min(1).max(255), code: z.string().min(1).max(32) }),
  updateSchema: z.object({ name: z.string().min(1).max(255).optional(), code: z.string().min(1).max(32).optional() }),
  sortWhitelist: { name: departments.name, code: departments.code, createdAt: departments.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ positionCount }] = await db
      .select({ positionCount: sql<number>`count(*)` })
      .from(positions)
      .where(eq(positions.departmentId, id))
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.departmentId, id))

    if (Number(positionCount) > 0 || Number(employeeCount) > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Department is still used by ${positionCount} position(s) and ${employeeCount} employee(s)`,
      })
    }
  },
})
