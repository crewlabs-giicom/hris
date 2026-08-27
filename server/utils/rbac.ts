import type { H3Event } from 'h3'
import { createError } from 'h3'
import { eq, and, inArray } from 'drizzle-orm'
import type { useDb } from '~~/server/db'
import { roles, permissions, roleHasPermissions, modelHasRoles, modelHasPermissions } from '~~/server/db/schema'
import type { AccessTokenPayload } from './jwt'

type Db = ReturnType<typeof useDb>

export async function getUserRoleNames(db: Db, userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(modelHasRoles)
    .innerJoin(roles, eq(roles.id, modelHasRoles.roleId))
    .where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, 'user')))

  return rows.map((r) => r.name)
}

export async function getUserPermissionNames(db: Db, userId: number): Promise<string[]> {
  const userRoles = await db
    .select({ roleId: modelHasRoles.roleId })
    .from(modelHasRoles)
    .where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, 'user')))

  const roleIds = userRoles.map((r) => r.roleId)

  const viaRoles = roleIds.length
    ? await db
        .select({ name: permissions.name })
        .from(roleHasPermissions)
        .innerJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId))
        .where(inArray(roleHasPermissions.roleId, roleIds))
    : []

  const direct = await db
    .select({ name: permissions.name })
    .from(modelHasPermissions)
    .innerJoin(permissions, eq(permissions.id, modelHasPermissions.permissionId))
    .where(and(eq(modelHasPermissions.modelId, userId), eq(modelHasPermissions.modelType, 'user')))

  return [...new Set([...viaRoles, ...direct].map((p) => p.name))]
}

export async function userHasPermission(db: Db, userId: number, permission: string): Promise<boolean> {
  const names = await getUserPermissionNames(db, userId)
  return names.includes(permission)
}

/**
 * Use after requireAuth(). Throws 403 if the logged-in user lacks the given permission,
 * checked across both direct grants and role-derived grants.
 */
export async function requirePermission(event: H3Event, user: AccessTokenPayload, db: Db, permission: string) {
  const allowed = await userHasPermission(db, user.sub, permission)
  if (!allowed) {
    throw createError({ statusCode: 403, statusMessage: `Missing permission: ${permission}` })
  }
}
