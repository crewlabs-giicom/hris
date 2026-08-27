import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { eq, and } from 'drizzle-orm'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })
  const db = drizzle(pool, { schema, mode: 'default' })

  console.log('Seeding shifts safely...')
  const existingShifts = await db.select().from(schema.shifts)
  if (existingShifts.length === 0) {
    await db.insert(schema.shifts).values([
      { code: 'SH-MORNING', name: 'Morning Shift', shiftIn: '08:00:00', shiftOut: '17:00:00' },
      { code: 'SH-MIDDLE', name: 'Middle Shift', shiftIn: '12:00:00', shiftOut: '21:00:00' },
      { code: 'SH-NIGHT', name: 'Night Shift', shiftIn: '22:00:00', shiftOut: '07:00:00' },
    ])
    console.log('Shifts seeded successfully.')
  } else {
    console.log('Shifts already exist, skipping.')
  }

  console.log('Seeding permission types safely...')
  const existingPermissionTypes = await db.select().from(schema.permissionsType)
  if (existingPermissionTypes.length === 0) {
    await db.insert(schema.permissionsType).values([
      { code: 'AL', name: 'Annual Leave' },
      { code: 'SL', name: 'Sick Leave' },
      { code: 'ML', name: 'Maternity Leave' },
    ])
    console.log('Permission types seeded successfully.')
  } else {
    console.log('Permission types already exist, skipping.')
  }

  console.log('Seeding holidays safely...')
  const existingHolidays = await db.select().from(schema.holidays)
  if (existingHolidays.length === 0) {
    await db.insert(schema.holidays).values([
      { name: "New Year's Day", date: '2026-01-01' },
      { name: 'Independence Day', date: '2026-08-17' },
      { name: 'Christmas Day', date: '2026-12-25' },
    ])
    console.log('Holidays seeded successfully.')
  } else {
    console.log('Holidays already exist, skipping.')
  }

  console.log('Seeding new permissions and mapping to roles safely...')
  const newPermissions = [
    'shifts.view',
    'shifts.manage',
    'permissions_type.view',
    'permissions_type.manage',
    'holidays.view',
    'holidays.manage',
  ]

  const roleMap = {
    super_admin: newPermissions,
    hr_admin: newPermissions,
    approver: ['shifts.view', 'permissions_type.view', 'holidays.view'],
  }

  for (const permName of newPermissions) {
    let [existingPerm] = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.name, permName))
      .limit(1)

    let permId = existingPerm?.id

    if (!existingPerm) {
      permId = crypto.randomUUID()
      await db.insert(schema.permissions).values({
        id: permId,
        name: permName,
      })
      console.log(`Permission created: ${permName}`)
    }

    // Map to roles
    for (const [roleName, allowedPerms] of Object.entries(roleMap)) {
      if (allowedPerms.includes(permName)) {
        const [role] = await db
          .select()
          .from(schema.roles)
          .where(eq(schema.roles.name, roleName))
          .limit(1)

        if (role) {
          const [exists] = await db
            .select()
            .from(schema.roleHasPermissions)
            .where(
              and(
                eq(schema.roleHasPermissions.roleId, role.id),
                eq(schema.roleHasPermissions.permissionId, permId)
              )
            )
            .limit(1)

          if (!exists) {
            await db.insert(schema.roleHasPermissions).values({
              roleId: role.id,
              permissionId: permId,
            })
            console.log(`Mapped permission ${permName} to role ${roleName}`)
          }
        }
      }
    }
  }

  console.log('Custom seeding completed.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
