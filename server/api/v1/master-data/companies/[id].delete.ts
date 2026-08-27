import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { companies, employees } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: companies,
  idColumn: companies.id,
  permissions: { view: 'companies.view', create: 'companies.manage', update: 'companies.manage', delete: 'companies.manage' },
  createSchema: z.object({ code: z.string().min(1).max(20), name: z.string().min(1).max(255) }),
  updateSchema: z.object({ code: z.string().min(1).max(20).optional(), name: z.string().min(1).max(255).optional() }),
  sortWhitelist: { name: companies.name, code: companies.code, createdAt: companies.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.companyId, id))

    if (Number(employeeCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Company is still used by ${employeeCount} employee(s)` })
    }
  },
})
