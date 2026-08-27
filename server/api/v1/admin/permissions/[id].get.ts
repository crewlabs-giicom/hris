import { z } from 'zod'
import { permissions } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: permissions,
  idColumn: permissions.id,
  permissions: { view: 'permissions.view', create: 'permissions.manage', update: 'permissions.manage', delete: 'permissions.manage' },
  createSchema: z.object({ name: z.string().min(1).max(150) }),
  updateSchema: z.object({ name: z.string().min(1).max(150).optional() }),
  sortWhitelist: { name: permissions.name, guardName: permissions.guardName, createdAt: permissions.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
