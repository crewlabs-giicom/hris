import { z } from 'zod'
import { permissionsType } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

export default createListHandler({
  table: permissionsType,
  idColumn: permissionsType.id,
  autoIncrement: true,
  permissions: { view: 'permissions_type.view', create: 'permissions_type.manage', update: 'permissions_type.manage', delete: 'permissions_type.manage' },
  createSchema: z.object({
    code: z.string().min(1).max(32),
    name: z.string().min(1).max(255),
  }),
  updateSchema: z.object({
    code: z.string().min(1).max(32).optional(),
    name: z.string().min(1).max(255).optional(),
  }),
  searchColumn: permissionsType.name,
  sortWhitelist: { name: permissionsType.name, code: permissionsType.code, createdAt: permissionsType.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
})
