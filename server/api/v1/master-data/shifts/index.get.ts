import { z } from 'zod'
import { shifts } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: shifts,
  idColumn: shifts.id,
  autoIncrement: true,
  permissions: { view: 'shifts.view', create: 'shifts.manage', update: 'shifts.manage', delete: 'shifts.manage' },
  createSchema: z.object({
    code: z.string().min(1).max(32),
    name: z.string().min(1).max(255),
    shiftIn: z.string().min(5).max(8),
    shiftOut: z.string().min(5).max(8),
  }),
  updateSchema: z.object({
    code: z.string().min(1).max(32).optional(),
    name: z.string().min(1).max(255).optional(),
    shiftIn: z.string().min(5).max(8).optional(),
    shiftOut: z.string().min(5).max(8).optional(),
  }),
  searchColumn: shifts.name,
  sortWhitelist: { name: shifts.name, code: shifts.code, createdAt: shifts.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
