import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { banks, employees } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: banks,
  idColumn: banks.id,
  permissions: { view: 'banks.view', create: 'banks.manage', update: 'banks.manage', delete: 'banks.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional() }),
  sortWhitelist: { name: banks.name, createdAt: banks.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.bankId, id))

    if (Number(employeeCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Bank is still used by ${employeeCount} employee(s)` })
    }
  },
})
