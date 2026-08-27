import { eq, and, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { useDb } from '~~/server/db'
import { employeePaidLeaves, employees, teams, teamHasUsers } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  // Ensure the user is authenticated
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const db = useDb()

  // Alias employees table for personResponsible lookup
  const employeeResponsible = alias(employees, 'employeeResponsible')

  const [row] = await db
    .select({
      id: employeePaidLeaves.id,
      employeeId: employeePaidLeaves.employeeId,
      paidLeaveType: employeePaidLeaves.paidLeaveType,
      status: employeePaidLeaves.status,
      validFrom: employeePaidLeaves.validFrom,
      validTo: employeePaidLeaves.validTo,
      paidLeaveCount: employeePaidLeaves.paidLeaveCount,
      dayOffCount: employeePaidLeaves.dayOffCount,
      description: employeePaidLeaves.description,
      personResponsibleId: employeePaidLeaves.personResponsibleId,
      personResponsibleName: employeeResponsible.fullName,
      task: employeePaidLeaves.task,
      address: employeePaidLeaves.address,
      createdAt: employeePaidLeaves.createdAt,
      employeeIdVal: employees.id,
      employeeCode: employees.employeeCode,
      employeeFullName: employees.fullName,
      employeeTeamId: teamHasUsers.teamId,
      teamName: teams.name,
    })
    .from(employeePaidLeaves)
    .innerJoin(employees, eq(employeePaidLeaves.employeeId, employees.id))
    .leftJoin(employeeResponsible, eq(employeePaidLeaves.personResponsibleId, employeeResponsible.id))
    .leftJoin(teamHasUsers, eq(employees.userId, teamHasUsers.userId))
    .leftJoin(teams, eq(teamHasUsers.teamId, teams.id))
    .where(and(eq(employeePaidLeaves.id, id), isNull(employeePaidLeaves.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Paid leave record not found' })
  }

  const data = {
    id: row.id,
    employeeId: row.employeeId,
    paidLeaveType: row.paidLeaveType,
    status: row.status,
    validFrom: row.validFrom,
    validTo: row.validTo,
    paidLeaveCount: row.paidLeaveCount,
    dayOffCount: row.dayOffCount,
    description: row.description,
    personResponsibleId: row.personResponsibleId,
    personResponsibleName: row.personResponsibleName,
    task: row.task,
    address: row.address,
    createdAt: row.createdAt,
    employee: {
      id: row.employeeIdVal,
      employeeCode: row.employeeCode,
      fullName: row.employeeFullName,
      teamId: row.employeeTeamId,
      team: row.teamName ? { name: row.teamName } : null,
    },
  }

  return {
    data,
  }
})
