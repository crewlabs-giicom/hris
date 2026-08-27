import { z } from 'zod'
import { holidays } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: holidays,
  idColumn: holidays.id,
  autoIncrement: true,
  permissions: { view: 'holidays.view', create: 'holidays.manage', update: 'holidays.manage', delete: 'holidays.manage' },
  createSchema: z.object({
    name: z.string().min(1).max(255),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  updateSchema: z.object({
    name: z.string().min(1).max(255).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  sortWhitelist: { name: holidays.name, date: holidays.date, createdAt: holidays.createdAt },
  defaultSort: { column: 'date', dir: 'asc' },
})
