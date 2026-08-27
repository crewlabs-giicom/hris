import { z } from 'zod'
import { departments } from '~~/server/db/schema'
import { createUpdateHandler } from '~~/server/utils/crud'

export default createUpdateHandler({
  table: departments,
  idColumn: departments.id,
  permissions: { view: 'departments.view', create: 'departments.manage', update: 'departments.manage', delete: 'departments.manage' },
  createSchema: z.object({ name: z.string().min(1).max(255), code: z.string().min(1).max(32) }),
  updateSchema: z.object({ name: z.string().min(1).max(255).optional(), code: z.string().min(1).max(32).optional() }),
  uniqueColumn: departments.code,
  uniqueMessage: 'Department code already exists',
  sortWhitelist: { name: departments.name, code: departments.code, createdAt: departments.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
