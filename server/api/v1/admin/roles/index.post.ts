import { z } from 'zod'
import { inArray, eq } from 'drizzle-orm'
import { roles, roleHasPermissions, permissions } from '~~/server/db/schema'
import { createCreateHandler } from '~~/server/utils/crud'
import { createError } from 'h3'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  permissionIds: z.array(z.coerce.number().int()).optional().default([]),
})

export default createCreateHandler({
  table: roles,
  idColumn: roles.id,
  permissions: { view: 'roles.view', create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  createSchema,
  updateSchema: z.object({ name: z.string().min(1).max(100).optional(), permissionIds: z.array(z.coerce.number().int()).optional() }),
  uniqueColumn: roles.name,
  uniqueMessage: 'Role name already exists',
  columnFields: ['name'],
  sortWhitelist: { name: roles.name, createdAt: roles.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },

  afterCreate: async (db, id, body) => {
    // id here will be a number because roles is auto-increment
    const roleId = Number(id)
    if (!body.permissionIds.length) return
    const found = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.id, body.permissionIds))
    if (found.length !== body.permissionIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'One or more permissionIds do not exist' })
    }
    await db.insert(roleHasPermissions).values(body.permissionIds.map((permissionId) => ({ roleId, permissionId })))
  },

  serialize: async (db, row) => {
    const permissionRows = await db
      .select({ id: roleHasPermissions.permissionId })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, row.id))
    return { ...row, permissionCount: permissionRows.length }
  },
})
