import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employeePermissions, employees, permissionsType, permissionAttachments, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  // Ensure the user is authenticated
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  // Retrieve permission details with joins
  const [row] = await db
    .select({
      id: employeePermissions.id,
      employeeId: employeePermissions.employeeId,
      permissionsTypeId: employeePermissions.permissionsTypeId,
      status: employeePermissions.status,
      validFrom: employeePermissions.validFrom,
      validTo: employeePermissions.validTo,
      description: employeePermissions.description,
      createdAt: employeePermissions.createdAt,
      employeeIdVal: employees.id,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
      permissionTypeName: permissionsType.name,
    })
    .from(employeePermissions)
    .innerJoin(employees, eq(employeePermissions.employeeId, employees.id))
    .innerJoin(permissionsType, eq(employeePermissions.permissionsTypeId, permissionsType.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(eq(employeePermissions.id, id), isNull(employeePermissions.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Permission not found' })
  }

  // Retrieve linked attachments
  const attachments = await db
    .select({
      id: permissionAttachments.id,
      attachment: permissionAttachments.attachment,
    })
    .from(permissionAttachments)
    .where(eq(permissionAttachments.permissionId, id))

  const data = {
    id: row.id,
    employeeId: row.employeeId,
    permissionsTypeId: row.permissionsTypeId,
    status: row.status,
    validFrom: row.validFrom,
    validTo: row.validTo,
    description: row.description,
    createdAt: row.createdAt,
    employee: {
      id: row.employeeIdVal,
      employeeCode: row.employeeCode,
      fullName: row.employeeFullName,
      teamId: row.employeeTeamId,
      team: row.teamName ? { name: row.teamName } : null,
    },
    permissionType: {
      id: row.permissionsTypeId,
      name: row.permissionTypeName,
    },
    attachments,
  }

  return {
    data,
  }
})
