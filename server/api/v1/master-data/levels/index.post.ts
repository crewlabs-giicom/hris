import { z } from 'zod'
import { levels } from '~~/server/db/schema'
import { createCreateHandler } from '~~/server/utils/crud'

const decimalString = z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric string')

export default createCreateHandler({
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
  uniqueColumn: levels.name,
  uniqueMessage: 'Level name already exists',
  sortWhitelist: { name: levels.name, baseSalary: levels.baseSalary, createdAt: levels.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
