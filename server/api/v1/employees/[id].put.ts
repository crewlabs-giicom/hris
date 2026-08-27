import { z } from 'zod'
import { readValidatedBody, getRouterParam, createError } from 'h3'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(32).optional(),
  nik: z.string().max(25).optional(),
  departmentId: z.coerce.number().int().optional(),
  positionId: z.coerce.number().int().optional(),
  divisionId: z.coerce.number().int().optional(),
  teamId: z.coerce.number().int().optional(),
  companyId: z.coerce.number().int().optional(),
  bankId: z.coerce.number().int().optional(),
  accountNumber: z.string().max(50).optional(),
  employmentStatus: z.enum(['pending_activation', 'active', 'resigned', 'terminated']).optional(),
  joinDate: z.string().min(1).optional(),
  resignDate: z.string().min(1).optional(),

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

  const id = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, updateEmployeeSchema.parse)
  const db = useDb()

  const isNumberId = /^\d+$/.test(id)
  const idFilter = isNumberId ? eq(employees.id, Number(id)) : eq(employees.uniqueId, id)

  const [row] = await db.select().from(employees).where(and(idFilter, isNull(employees.deletedAt))).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (body.email) {
    const [existing] = await db.select().from(employees).where(and(eq(employees.email, body.email), ne(employees.id, row.id))).limit(1)
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
    }
  }

  if (body.nik) {
    const [existingNik] = await db.select().from(employees).where(and(eq(employees.nik, body.nik), ne(employees.id, row.id))).limit(1)
    if (existingNik) {
      throw createError({ statusCode: 409, statusMessage: 'NIK already in use' })
    }
  }

  const updates = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))
  if (Object.keys(updates).length) {
    await db.update(employees).set(updates).where(eq(employees.id, row.id))
  }

  const [updated] = await db.select().from(employees).where(eq(employees.id, row.id)).limit(1)
  return { data: updated }
})
