import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { roles, roleHasPermissions, permissions } from '~~/server/db/schema'
import { createUpdateHandler } from '~~/server/utils/crud'
import { createError } from 'h3'

export default createUpdateHandler({
  table: roles,
  idColumn: roles.id,
  permissions: { view: 'roles.view', create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), permissionIds: z.array(z.coerce.number().int()).optional().default([]) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional(), permissionIds: z.array(z.coerce.number().int()).optional() }),
  uniqueColumn: roles.name,
  uniqueMessage: 'Role name already exists',
  columnFields: ['name'],
  sortWhitelist: { name: roles.name, createdAt: roles.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },

  afterUpdate: async (db, id, body) => {
    const roleId = Number(id)
    if (!body.permissionIds) return
    if (body.permissionIds.length) {
      const found = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.id, body.permissionIds))
      if (found.length !== body.permissionIds.length) {
        throw createError({ statusCode: 400, statusMessage: 'One or more permissionIds do not exist' })
      }
    }
    await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId))
    if (body.permissionIds.length) {
      await db.insert(roleHasPermissions).values(body.permissionIds.map((permissionId) => ({ roleId: roleId, permissionId })))
    }
  },

  serialize: async (db, row) => {
    const permissionRows = await db
      .select({ id: roleHasPermissions.permissionId })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, row.id))
    return { ...row, permissionIds: permissionRows.map((r) => r.id) }
  },
})
