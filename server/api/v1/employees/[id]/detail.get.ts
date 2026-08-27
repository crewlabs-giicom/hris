import { getRouterParam, createError } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

// JWT-authenticated single-employee lookup for the admin UI (the wizard's edit-mode
// hydration, and stale-draft detection in create mode). Deliberately separate from
// `[id].get.ts`, which is a server-to-server lookup gated by an API key (x-api-key) for
// external consumers like Backbone — that route never accepts a browser session's Bearer
// token, so the admin UI must not call it.
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin', 'approver'])

  const id = getRouterParam(event, 'id') as string
  const db = useDb()

  const isNumberId = /^\d+$/.test(id)
  const idFilter = isNumberId ? eq(employees.id, Number(id)) : eq(employees.uniqueId, id)

  const row = await db.query.employees.findFirst({
    where: and(idFilter, isNull(employees.deletedAt)),
    with: {
      user: {
        with: {
          teamHasUsers: {
            with: {
              team: true,
            }
          }
        }
      },
      department: true,
      position: true,
      division: true,
      company: true,
      bank: true,
      levelHistories: {
        with: {
          level: true
        }
      },
      education: true,
      emergencyContacts: true,
      family: true,
      familyTree: true,
      organization: true,
      workExperiences: true,
      hobbies: true,
      languages: true,
      documents: true,
    }
  })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  // Map the team object to maintain backward compatibility
  const teamObject = row.user?.teamHasUsers?.[0]?.team || null
  const { user: userRecord, ...employeeData } = row
  const responseData = {
    ...employeeData,
    team: teamObject,
  }

  return { data: responseData }
})
