import { z } from 'zod'
import { eq, like, sql, type SQL } from 'drizzle-orm'
import { roles, roleHasPermissions } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

const permissionCountSort: Record<string, any> = {
  name: roles.name,
  createdAt: roles.createdAt,
  permissionCount: sql`count(${roleHasPermissions.permissionId})`,
}

export default createListHandler({
  table: roles,
  idColumn: roles.id,
  permissions: { view: 'roles.view', create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), permissionIds: z.array(z.coerce.number().int()).optional().default([]) }),
  updateSchema: z.object({ name: z.string().min(1).max(100).optional(), permissionIds: z.array(z.coerce.number().int()).optional() }),
  searchColumn: roles.name,
  sortWhitelist: permissionCountSort,
  defaultSort: { column: 'name', dir: 'asc' },

  listQuery: async (db, { where, orderBy, limit, offset }) => {
    return db
      .select({
        id: roles.id,
        name: roles.name,
        guardName: roles.guardName,
        createdAt: roles.createdAt,
        permissionCount: sql<number>`count(${roleHasPermissions.permissionId})`,
      })
      .from(roles)
      .leftJoin(roleHasPermissions, eq(roleHasPermissions.roleId, roles.id))
      .where(where ?? (sql`1=1` as SQL))
      .groupBy(roles.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)
  },
  countQuery: async (db, where) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .where(where ?? (sql`1=1` as SQL))
    return Number(count)
  },
})
