import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { faker } from '@faker-js/faker'
import * as schema from './schema'
import bcrypt from 'bcryptjs'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })
  const db = drizzle(pool, { schema, mode: 'default' })

  console.log('Seeding departments & positions...')
  const departmentIds = await Promise.all(
    ['Engineering', 'Human Resources', 'Finance', 'Operations'].map(async (name) => {
      const [res] = await db.insert(schema.departments).values({ name, code: name.slice(0, 3).toUpperCase() })
      return res.insertId
    })
  )

  const positionIds = await Promise.all(
    ['Staff', 'Supervisor', 'Manager'].map(async (title) => {
      const [res] = await db.insert(schema.positions).values({ title, code: title.slice(0, 3).toUpperCase() })
      return res.insertId
    })
  )

  console.log('Seeding divisions, levels, companies, banks...')
  const divisionIds = await Promise.all(
    ['Product', 'Sales', 'Corporate'].map(async (name) => {
      const [res] = await db.insert(schema.divisions).values({ name, code: name.slice(0, 3).toUpperCase() })
      return res.insertId
    })
  )

  const levelIds = await Promise.all(
    [
      { name: 'L1', baseSalary: '5000000', mealAllowance: '500000', otherAllowance: '0' },
      { name: 'L2', baseSalary: '7500000', mealAllowance: '600000', otherAllowance: '250000' },
      { name: 'L3', baseSalary: '10000000', mealAllowance: '700000', otherAllowance: '500000' },
    ].map(async (level) => {
      const [res] = await db.insert(schema.levels).values(level)
      return res.insertId
    })
  )

  const companyIds = await Promise.all(
    [{ code: 'GII', name: 'PT Global Inovasi Indonesia' }].map(async (company) => {
      const [res] = await db.insert(schema.companies).values(company)
      return res.insertId
    })
  )

  const bankIds = await Promise.all(
    ['BCA', 'Mandiri', 'BNI'].map(async (name) => {
      const [res] = await db.insert(schema.banks).values({ name })
      return res.insertId
    })
  )

  console.log('Seeding shifts, permissions_type, holidays...')
  await Promise.all([
    db.insert(schema.shifts).values([
      { code: 'SH-MORNING', name: 'Morning Shift', shiftIn: '08:00:00', shiftOut: '17:00:00' },
      { code: 'SH-MIDDLE', name: 'Middle Shift', shiftIn: '12:00:00', shiftOut: '21:00:00' },
      { code: 'SH-NIGHT', name: 'Night Shift', shiftIn: '22:00:00', shiftOut: '07:00:00' },
    ]),
    db.insert(schema.permissionsType).values([
      { code: 'AL', name: 'Annual Leave' },
      { code: 'SL', name: 'Sick Leave' },
      { code: 'ML', name: 'Maternity Leave' },
    ]),
    db.insert(schema.holidays).values([
      { name: "New Year's Day", date: '2026-01-01' },
      { name: 'Independence Day', date: '2026-08-17' },
      { name: 'Christmas Day', date: '2026-12-25' },
    ]),
  ])

  console.log('Seeding a super_admin user for local login...')
  const [adminRes] = await db.insert(schema.users).values({
    email: 'admin@gii.local',
    passwordHash: await bcrypt.hash('password123', 10),
    role: 'super_admin',
  })
  const adminId = adminRes.insertId

  console.log('Seeding permissions & roles...')
  const masterDataResources = [
    'departments',
    'positions',
    'divisions',
    'levels',
    'companies',
    'banks',
    'teams',
    'shifts',
    'permissions_type',
    'holidays'
  ]
  const permissionNames = [
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'roles.view',
    'roles.manage',
    'permissions.view',
    'permissions.manage',
    ...masterDataResources.flatMap((resource) => [`${resource}.view`, `${resource}.manage`]),
  ]
  const permissionIds: Record<string, number> = {}
  for (const name of permissionNames) {
    const [res] = await db.insert(schema.permissions).values({ name })
    permissionIds[name] = res.insertId
  }

  const roleNames = ['super_admin', 'hr_admin', 'approver', 'employee'] as const
  const roleIds: Record<(typeof roleNames)[number], number> = {} as any
  for (const name of roleNames) {
    const [res] = await db.insert(schema.roles).values({ name })
    roleIds[name] = res.insertId
  }

  const rolePermissionMap: Record<(typeof roleNames)[number], string[]> = {
    super_admin: permissionNames,
    hr_admin: [
      'users.view',
      'users.create',
      'users.update',
      'roles.view',
      'permissions.view',
      ...masterDataResources.flatMap((resource) => [`${resource}.view`, `${resource}.manage`]),
    ],
    approver: ['users.view', ...masterDataResources.map((resource) => `${resource}.view`)],
    employee: [],
  }
  for (const roleName of roleNames) {
    for (const permissionName of rolePermissionMap[roleName]) {
      await db.insert(schema.roleHasPermissions).values({
        roleId: roleIds[roleName],
        permissionId: permissionIds[permissionName],
      })
    }
  }

  await db.insert(schema.modelHasRoles).values({
    roleId: roleIds.super_admin,
    modelId: adminId,
    modelType: 'user',
  })

  console.log('Seeding sample employees...')
  for (let i = 0; i < 10; i++) {
    const joinDate = faker.date.past({ years: 3 }).toISOString().slice(0, 10)

    const [empRes] = await db.insert(schema.employees).values({
      employeeCode: `EMP${String(i + 1).padStart(4, '0')}`,
      fullName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      departmentId: faker.helpers.arrayElement(departmentIds),
      positionId: faker.helpers.arrayElement(positionIds),
      divisionId: faker.helpers.arrayElement(divisionIds),
      companyId: faker.helpers.arrayElement(companyIds),
      bankId: faker.helpers.arrayElement(bankIds),
      employmentStatus: 'active',
      joinDate,
    })
    const employeeId = empRes.insertId

    // Every employee must have at least one level history row from day one.
    await db.insert(schema.employeeLevelHistories).values({
      employeeId,
      levelId: faker.helpers.arrayElement(levelIds),
      effectiveDate: joinDate,
      note: 'Initial level on hire',
    })
  }

  console.log('Done. Login with admin@gii.local / password123')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
