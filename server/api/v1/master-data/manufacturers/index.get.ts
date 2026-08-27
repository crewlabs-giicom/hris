import { z } from 'zod'
import { manufacturers } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: manufacturers,
  idColumn: manufacturers.id,
  permissions: { view: 'assets.view', create: 'assets.manage', update: 'assets.manage', delete: 'assets.manage' },
  createSchema: z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
  }),
  updateSchema: z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
  }),
  searchColumn: manufacturers.name,
  sortWhitelist: { name: manufacturers.name, code: manufacturers.code, createdAt: manufacturers.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
