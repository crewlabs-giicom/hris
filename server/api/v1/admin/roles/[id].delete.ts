import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { roles, roleHasPermissions, modelHasRoles } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'
import { createError } from 'h3'

const SYSTEM_ROLE_NAMES = ['super_admin', 'hr_admin', 'approver', 'employee']

export default createDeleteHandler({
  table: roles,
  idColumn: roles.id,
  permissions: { view: 'roles.view', create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), permissionIds: z.array(z.coerce.number().int()).optional().default([]) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional(), permissionIds: z.array(z.coerce.number().int()).optional() }),
  sortWhitelist: { name: roles.name, createdAt: roles.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },

  beforeDelete: async (db, id, row) => {
    const roleId = Number(id)
    if (SYSTEM_ROLE_NAMES.includes(row.name)) {
      throw createError({ statusCode: 400, statusMessage: `"${row.name}" is a system role and cannot be deleted` })
    }

    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)` })
      .from(modelHasRoles)
      .where(eq(modelHasRoles.roleId, roleId))
    if (Number(userCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Role is still assigned to ${userCount} user(s)` })
    }

    await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId))
  },
})
