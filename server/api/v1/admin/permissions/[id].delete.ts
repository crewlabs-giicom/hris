import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { permissions, roleHasPermissions, modelHasPermissions } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'
import { createError } from 'h3'

export default createDeleteHandler({
  table: permissions,
  idColumn: permissions.id,
  permissions: { view: 'permissions.view', create: 'permissions.manage', update: 'permissions.manage', delete: 'permissions.manage' },
  createSchema: z.object({ name: z.string().min(1).max(150) }),
  updateSchema: z.object({ name: z.string().min(1).max(150).optional() }),
  sortWhitelist: { name: permissions.name, guardName: permissions.guardName, createdAt: permissions.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    const [{ roleCount }] = await db
      .select({ roleCount: sql<number>`count(*)` })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.permissionId, id))
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)` })
      .from(modelHasPermissions)
      .where(eq(modelHasPermissions.permissionId, id))

    if (Number(roleCount) > 0 || Number(userCount) > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Permission is still used by ${roleCount} role(s) and ${userCount} user(s)`,
      })
    }
  },
})
