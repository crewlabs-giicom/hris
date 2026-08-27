import { z } from 'zod'
import { companies } from '~~/server/db/schema'
import { createUpdateHandler } from '~~/server/utils/crud'

export default createUpdateHandler({
  table: companies,
  idColumn: companies.id,
  permissions: { view: 'companies.view', create: 'companies.manage', update: 'companies.manage', delete: 'companies.manage' },
  createSchema: z.object({ code: z.string().min(1).max(20), name: z.string().min(1).max(255) }),
  updateSchema: z.object({ code: z.string().min(1).max(20).optional(), name: z.string().min(1).max(255).optional() }),
  uniqueColumn: companies.code,
  uniqueMessage: 'Company code already exists',
  sortWhitelist: { name: companies.name, code: companies.code, createdAt: companies.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
