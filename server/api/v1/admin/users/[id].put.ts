import { z } from 'zod'
import { eq, and, ne, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users, modelHasRoles, roles } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission, getUserRoleNames } from '~~/server/utils/rbac'
import { hashPassword } from '~~/server/utils/password'

const bodySchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.coerce.number().int()).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.update')

  const id = getRouterParam(event, 'id') as string
  const userId = Number(id)
  const body = await readValidatedBody(event, bodySchema.parse)

  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  if (body.email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, body.email), ne(users.id, userId)))
      .limit(1)
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
    }
  }

  if (body.username) {
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, body.username), ne(users.id, userId)))
      .limit(1)
    if (existingUsername) {
      throw createError({ statusCode: 409, statusMessage: 'Username already exists' })
    }
  }

  if (body.roleIds && body.roleIds.length) {
    const found = await db.select({ id: roles.id }).from(roles).where(inArray(roles.id, body.roleIds))
    if (found.length !== body.roleIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'One or more roleIds do not exist' })
    }
  }

  const updates: Record<string, unknown> = {}
  if (body.email) updates.email = body.email
  if (body.username !== undefined) updates.username = body.username
  if (body.isActive !== undefined) updates.isActive = body.isActive
  if (body.password) updates.passwordHash = await hashPassword(body.password)

  if (Object.keys(updates).length) {
    await db.update(users).set(updates).where(eq(users.id, userId))
  }

  if (body.roleIds) {
    await db.delete(modelHasRoles).where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, 'user')))
    if (body.roleIds.length) {
      await db
        .insert(modelHasRoles)
        .values(body.roleIds.map((roleId) => ({ roleId, modelId: userId, modelType: 'user' })))
    }
  }

  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return { data: { ...updated, passwordHash: undefined, roles: await getUserRoleNames(db, userId) } }
})
