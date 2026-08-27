import { z } from 'zod'
import { readValidatedBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeLevelHistories } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(32),
  fullName: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(32).optional(),
  nik: z.string().max(25).optional(),
  departmentId: z.coerce.number().int().optional(),
  positionId: z.coerce.number().int().optional(),
  divisionId: z.coerce.number().int().optional(),
  teamId: z.coerce.number().int().optional(),
  companyId: z.coerce.number().int().optional(),
  bankId: z.coerce.number().int().optional(),
  accountNumber: z.string().max(50).optional(),
  joinDate: z.string().min(1).optional(),
  initialLevelId: z.coerce.number().int().optional(),

  // KTP / personal data
  birthDate: z.string().min(1).optional(),
  religion: z.string().max(50).optional(),
  bloodType: z.string().max(3).optional(),
  gender: z.enum(['male', 'female']).optional(),
  maritalStatus: z.string().max(30).optional(),
  ktpAddress: z.string().optional(),
  npwp: z.string().max(30).optional(),

  // Domicile
  domicileAddress: z.string().optional(),
  domicileOwnership: z.string().max(30).optional(),

  // Contact & administrative extras
  instagram: z.string().max(100).optional(),
  tiktok: z.string().max(100).optional(),
  contractEndDate: z.string().min(1).optional(),
  dominance: z.string().max(10).optional(),
  bpjsType: z.string().max(30).optional(),
  taxStatus: z.string().max(10).optional(),
  status: z.number().int().min(0).max(7).optional(),
  gajiPokokEmp: z.string().optional().or(z.literal('')),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const body = await readValidatedBody(event, createEmployeeSchema.parse)
  const db = useDb()

  const [existing] = await db.select().from(employees).where(eq(employees.employeeCode, body.employeeCode)).limit(1)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Employee code already exists' })
  }

  const [existingEmail] = await db.select().from(employees).where(eq(employees.email, body.email)).limit(1)
  if (existingEmail) {
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
  }

  if (body.nik) {
    const [existingNik] = await db.select().from(employees).where(eq(employees.nik, body.nik)).limit(1)
    if (existingNik) {
      throw createError({ statusCode: 409, statusMessage: 'NIK already in use' })
    }
  }

  let empId: number = 0

  await db.transaction(async (tx) => {
    const { initialLevelId, ...employeeFields } = body
    const [result] = await tx.insert(employees).values(employeeFields)
    empId = result.insertId

    if (initialLevelId && body.joinDate) {
      await tx.insert(employeeLevelHistories).values({
        employeeId: empId,
        levelId: initialLevelId,
        effectiveDate: body.joinDate,
        note: 'Initial level on hire',
      })
    }
  })

  const [created] = await db.select().from(employees).where(eq(employees.id, empId)).limit(1)
  return { data: created }
})
