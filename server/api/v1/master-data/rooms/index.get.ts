import { z } from 'zod'
import { rooms } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: rooms,
  idColumn: rooms.id,
  permissions: { view: 'rooms.view', create: 'rooms.manage', update: 'rooms.manage', delete: 'rooms.manage' },
  createSchema: z.object({
    name: z.string().min(1).max(255),
    ruko: z.string().min(1).max(255),
    floor: z.number().int(),
  }),
  updateSchema: z.object({
    name: z.string().min(1).max(255).optional(),
    ruko: z.string().min(1).max(255).optional(),
    floor: z.number().int().optional(),
  }),
  searchColumn: rooms.name,
  sortWhitelist: { name: rooms.name, ruko: rooms.ruko, floor: rooms.floor, createdAt: rooms.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
