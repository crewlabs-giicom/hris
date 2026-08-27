import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { schedules } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  const row = await db.query.schedules.findFirst({
    where: and(eq(schedules.id, id), isNull(schedules.deletedAt)),
    with: {
      employee: {
        with: {
          department: true,
          position: true,
          division: true,
        },
      },
      shift: true,
    },
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Schedule not found' })
  }

  return { data: row }
})
