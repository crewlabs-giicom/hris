import { z } from 'zod'
import { banks } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: banks,
  idColumn: banks.id,
  permissions: { view: 'banks.view', create: 'banks.manage', update: 'banks.manage', delete: 'banks.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional() }),
  searchColumn: banks.name,
  sortWhitelist: { name: banks.name, createdAt: banks.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
