import { getQuery } from 'h3'
import { like, or, sql, asc, desc } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { requirePermission, getUserRoleNames } from '~~/server/utils/rbac'

const SORT_WHITELIST = {
  email: users.email,
  createdAt: users.createdAt,
  isActive: users.isActive,
} as const

/**
 * Paginated + searchable + sortable user list for the admin Users page.
 * ?search=  matches email
 * ?page=1&perPage=10
 * ?sortBy=email|createdAt|isActive&sortDir=asc|desc
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  await requirePermission(event, user, db, 'users.view')

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  const search = typeof query.search === 'string' ? query.search.trim() : ''

  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'createdAt'
  const sortColumn = SORT_WHITELIST[sortBy as keyof typeof SORT_WHITELIST]
  if (!sortColumn) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sortBy: ${sortBy}` })
  }
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc'
  const orderBy = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const where = search ? or(like(users.email, `%${search}%`)) : undefined

  const rows = await db.query.users.findMany({
    where,
    limit: perPage,
    offset: (page - 1) * perPage,
    orderBy: () => [orderBy],
  })

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where ?? sql`1=1`)

  const rowsWithRoles = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      passwordHash: undefined,
      roles: await getUserRoleNames(db, row.id),
    }))
  )

  return {
    data: rowsWithRoles,
    meta: { page, perPage, total: Number(count) },
  }
})
