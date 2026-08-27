import { z } from 'zod'
import { companies } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: companies,
  idColumn: companies.id,
  permissions: { view: 'companies.view', create: 'companies.manage', update: 'companies.manage', delete: 'companies.manage' },
  createSchema: z.object({ code: z.string().min(1).max(20), name: z.string().min(1).max(255) }),
  updateSchema: z.object({ code: z.string().min(1).max(20).optional(), name: z.string().min(1).max(255).optional() }),
  sortWhitelist: { name: companies.name, code: companies.code, createdAt: companies.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
