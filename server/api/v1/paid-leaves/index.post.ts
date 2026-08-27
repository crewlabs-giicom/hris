import { useDb } from '~~/server/db'
import { employeePaidLeaves, employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'
import { createError, readBody } from 'h3'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require logged-in user
  const user = requireAuth(event)

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
  } = body

  // Check mandatory fields
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

  const db = useDb()

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

  const [result] = await db.insert(employeePaidLeaves).values({
    employeeId: emp.id,
    paidLeaveType,
    status: 'active', // default status is active/pending
    validFrom: validFrom, // date string
    validTo: validTo, // date string
    paidLeaveCount: Number(paidLeaveCount),
    dayOffCount: Number(dayOffCount),
    description: String(description).trim(),
    personResponsibleId: personResponsibleId ? Number(personResponsibleId) : null,
    task: task ? String(task).trim() : null,
    address: address ? String(address).trim() : null,
    createdBy: user.sub,
    updatedBy: user.sub,
  })

  return {
    data: {
      id: result.insertId,
      success: true,
    },
  }
})
