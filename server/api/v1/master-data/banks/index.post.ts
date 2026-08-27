import { z } from 'zod'
import { banks } from '~~/server/db/schema'
import { createCreateHandler } from '~~/server/utils/crud'

export default createCreateHandler({
  table: banks,
  idColumn: banks.id,
  permissions: { view: 'banks.view', create: 'banks.manage', update: 'banks.manage', delete: 'banks.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional() }),
  uniqueColumn: banks.name,
  uniqueMessage: 'Bank name already exists',
  sortWhitelist: { name: banks.name, createdAt: banks.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
