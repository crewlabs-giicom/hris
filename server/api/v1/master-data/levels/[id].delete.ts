import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { levels, employeeLevelHistories } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

const decimalString = z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric string')

export default createDeleteHandler({
  table: levels,
  idColumn: levels.id,
  permissions: { view: 'levels.view', create: 'levels.manage', update: 'levels.manage', delete: 'levels.manage' },
  createSchema: z.object({
    name: z.string().min(1).max(50),
    baseSalary: decimalString,
    mealAllowance: decimalString,
    otherAllowance: decimalString,
  }),
  updateSchema: z.object({
    name: z.string().min(1).max(50).optional(),
    baseSalary: decimalString.optional(),
    mealAllowance: decimalString.optional(),
    otherAllowance: decimalString.optional(),
  }),
  sortWhitelist: { name: levels.name, baseSalary: levels.baseSalary, createdAt: levels.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ historyCount }] = await db
      .select({ historyCount: sql<number>`count(*)` })
      .from(employeeLevelHistories)
      .where(eq(employeeLevelHistories.levelId, id))

    if (Number(historyCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Level is referenced by ${historyCount} level history record(s)` })
    }
  },
})
