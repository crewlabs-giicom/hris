import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users, modelHasRoles, roles } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission, getUserRoleNames } from '~~/server/utils/rbac'
import { hashPassword } from '~~/server/utils/password'

const bodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(8),
  isActive: z.boolean().optional().default(true),
  roleIds: z.array(z.coerce.number().int()).optional().default([]),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.create')

  const body = await readValidatedBody(event, bodySchema.parse)

  const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
  }

  if (body.username) {
    const [existingUsername] = await db.select().from(users).where(eq(users.username, body.username)).limit(1)
    if (existingUsername) {
      throw createError({ statusCode: 409, statusMessage: 'Username already exists' })
    }
  }

  if (body.roleIds.length) {
    const found = await db.select({ id: roles.id }).from(roles).where(inArray(roles.id, body.roleIds))
    if (found.length !== body.roleIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'One or more roleIds do not exist' })
    }
  }

  const passwordHash = await hashPassword(body.password)
  const [res] = await db.insert(users).values({ email: body.email, username: body.username, passwordHash, isActive: body.isActive })
  const userId = res.insertId

  if (body.roleIds.length) {
    await db.insert(modelHasRoles).values(body.roleIds.map((roleId) => ({ roleId, modelId: userId, modelType: 'user' })))
  }

  const [created] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return { data: { ...created, passwordHash: undefined, roles: await getUserRoleNames(db, userId) } }
})
