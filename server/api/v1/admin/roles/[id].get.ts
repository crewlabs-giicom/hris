import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { roles, roleHasPermissions } from '~~/server/db/schema'
import { createDetailHandler } from '~~/server/utils/crud'

export default createDetailHandler({
  table: roles,
  idColumn: roles.id,
  permissions: { view: 'roles.view', create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), permissionIds: z.array(z.coerce.number().int()).optional().default([]) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional(), permissionIds: z.array(z.coerce.number().int()).optional() }),
  sortWhitelist: { name: roles.name, createdAt: roles.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },

  serialize: async (db, row) => {
    const permissionRows = await db
      .select({ id: roleHasPermissions.permissionId })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, row.id))
    return { ...row, permissionIds: permissionRows.map((r) => r.id) }
  },
})
