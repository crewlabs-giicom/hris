import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { manualAttendances } from '~~/server/db/schema'
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

  const row = await db.query.manualAttendances.findFirst({
    where: and(eq(manualAttendances.id, id), isNull(manualAttendances.deletedAt)),
    with: {
      employee: {
        with: {
          department: true,
          position: true,
          division: true,
          user: {
            with: {
              teamHasUsers: {
                with: {
                  team: true,
                },
              },
            },
          },
        },
      },
      attachments: true,
    },
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Manual attendance request not found' })
  }

  // Flatten the employee team structure for backward compatibility
  const teamObject = row.employee?.user?.teamHasUsers?.[0]?.team || null
  const employeeWithTeam = row.employee
    ? {
        ...row.employee,
        team: teamObject,
      }
    : null

  const responseData = {
    ...row,
    employee: employeeWithTeam,
  }

  return { data: responseData }
})
