import { z } from 'zod'
import { divisions } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: divisions,
  idColumn: divisions.id,
  permissions: { view: 'divisions.view', create: 'divisions.manage', update: 'divisions.manage', delete: 'divisions.manage' },
  createSchema: z.object({ name: z.string().min(1).max(255), code: z.string().min(1).max(32) }),
  updateSchema: z.object({ name: z.string().min(1).max(255).optional(), code: z.string().min(1).max(32).optional() }),
  sortWhitelist: { name: divisions.name, code: divisions.code, createdAt: divisions.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
