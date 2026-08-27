import { z } from 'zod'
import { positions } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: positions,
  idColumn: positions.id,
  permissions: { view: 'positions.view', create: 'positions.manage', update: 'positions.manage', delete: 'positions.manage' },
  createSchema: z.object({ title: z.string().min(1).max(255), code: z.string().min(1).max(32), departmentId: z.coerce.number().int().optional() }),
  updateSchema: z.object({
    title: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(32).optional(),
    departmentId: z.coerce.number().int().optional().nullable(),
  }),
  searchColumn: positions.title,
  sortWhitelist: { title: positions.title, code: positions.code, createdAt: positions.createdAt },
  defaultSort: { column: 'title', dir: 'asc' },
})
