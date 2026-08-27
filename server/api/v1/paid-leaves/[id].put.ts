import { useDb } from '~~/server/db'
import { employeePaidLeaves, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const user = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  const body = await readBody(event)
  const {
    paidLeaveType,
    validFrom,
    validTo,
    paidLeaveCount,
    dayOffCount,
    description,
    personResponsibleId,
    task,
    address,
    status,
  } = body

  const db = useDb()

  // 1. Fetch existing paid leave request
  const [row] = await db
    .select()
    .from(employeePaidLeaves)
    .where(and(eq(employeePaidLeaves.id, id), isNull(employeePaidLeaves.deletedAt)))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Paid leave record not found' })
  }

  // Only allow modifications when status is "active"
  if (row.status !== 'active') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only paid leave transactions with "active" status can be modified',
    })
  }

  // Validate mandatory fields
  if (
    !paidLeaveType ||
    !validFrom ||
    !validTo ||
    paidLeaveCount === undefined ||
    dayOffCount === undefined ||
    !description
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Required fields: paidLeaveType, validFrom, validTo, paidLeaveCount, dayOffCount, description',
    })
  }

  if (!['cuti tahunan', 'cuti khusus'].includes(paidLeaveType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid paidLeaveType. Must be "cuti tahunan" or "cuti khusus".',
    })
  }

  // Always resolve employeeId from the logged-in user
  const [emp] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, user.sub), isNull(employees.deletedAt)))
    .limit(1)

  if (!emp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current user has no associated employee record.',
    })
  }

  await db
    .update(employeePaidLeaves)
    .set({
      employeeId: emp.id,
      paidLeaveType,
      validFrom: validFrom, // date string
      validTo: validTo, // date string
      paidLeaveCount: Number(paidLeaveCount),
      dayOffCount: Number(dayOffCount),
      description: String(description).trim(),
      personResponsibleId: personResponsibleId ? Number(personResponsibleId) : null,
      task: task ? String(task).trim() : null,
      address: address ? String(address).trim() : null,
      status: status || row.status,
      updatedBy: user.sub,
      updatedAt: new Date(),
    })
    .where(eq(employeePaidLeaves.id, id))

  return {
    data: {
      success: true,
    },
  }
})
