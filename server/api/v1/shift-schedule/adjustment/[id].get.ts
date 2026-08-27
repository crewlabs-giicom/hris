import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { scheduleAdjustments } from '~~/server/db/schema'
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

  const row = await db.query.scheduleAdjustments.findFirst({
    where: and(eq(scheduleAdjustments.id, id), isNull(scheduleAdjustments.deletedAt)),
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
    throw createError({ statusCode: 404, statusMessage: 'Schedule adjustment not found' })
  }

  return { data: row }
})
