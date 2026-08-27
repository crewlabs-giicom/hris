import { z } from 'zod'
import { teams } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: teams,
  idColumn: teams.id,
  permissions: { view: 'teams.view', create: 'teams.manage', update: 'teams.manage', delete: 'teams.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), leaderId: z.coerce.number().int().optional(), picId: z.coerce.number().int().optional() }),
  updateSchema: z.object({
    name: z.string().min(1).max(100).optional(),
    leaderId: z.coerce.number().int().optional().nullable(),
    picId: z.coerce.number().int().optional().nullable(),
  }),
  sortWhitelist: { name: teams.name, createdAt: teams.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
