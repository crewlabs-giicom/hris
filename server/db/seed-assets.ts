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

  console.log('Seeding manufacturers safely...')
  const mfgIds: number[] = []
  const mfgs = [
    { code: 'DELL', name: 'Dell Technologies' },
    { code: 'APPL', name: 'Apple Inc.' },
    { code: 'LOGI', name: 'Logitech' },
    { code: 'HERM', name: 'Herman Miller' },
    { code: 'IKEA', name: 'IKEA' },
  ]

  for (const m of mfgs) {
    let [existing] = await db
      .select()
      .from(schema.manufacturers)
      .where(eq(schema.manufacturers.code, m.code))
      .limit(1)

    if (existing) {
      mfgIds.push(existing.id)
      console.log(`Manufacturer already exists: ${m.name}`)
    } else {
      const [res] = await db.insert(schema.manufacturers).values({
        code: m.code,
        name: m.name,
      })
      mfgIds.push(res.insertId)
      console.log(`Manufacturer created: ${m.name}`)
    }
  }

  console.log('Seeding permissions & roles for assets...')
  const newPermissions = ['assets.view', 'assets.manage']
  const roleMap = {
    super_admin: newPermissions,
    hr_admin: newPermissions,
    approver: ['assets.view'],
    employee: ['assets.view'],
  }

  for (const permName of newPermissions) {
    let [existingPerm] = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.name, permName))
      .limit(1)

    let permId = existingPerm?.id

    if (!existingPerm) {
      const [res] = await db.insert(schema.permissions).values({
        name: permName,
      })
      permId = res.insertId
      console.log(`Permission created: ${permName} (ID: ${permId})`)
    }

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

  console.log('Seeding dummy assets safely...')
  const existingAssets = await db.select().from(schema.assets)
  if (existingAssets.length === 0 && mfgIds.length > 0) {
    // Fetch dependencies
    const pts = await db.select().from(schema.companies).limit(1)
    const rooms = await db.select().from(schema.rooms).limit(2)
    const divisions = await db.select().from(schema.divisions).limit(2)
    const employees = await db.select().from(schema.employees).limit(3)
    const adminUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'super_admin'))
      .limit(1)

    if (pts.length > 0 && rooms.length > 0 && divisions.length > 0 && adminUser.length > 0) {
      const ptId = pts[0].id
      const createdBy = adminUser[0].id

      const dummyAssets = [
        {
          code: 'ARF-2026-0001',
          name: 'MacBook Pro M3 Max 16"',
          purchaseFromDate: '2026-01-10',
          purchaseToDate: '2026-01-12',
          manufactureId: mfgIds[1], // Apple
          economicAge: 5,
          condition: 'good',
          price: '45000000.00',
          description: 'High-end development laptop for engineering team lead.',
          status: 'active',
          category: 'asset',
          ptId,
          location: 'HQ Jakarta',
          roomId: rooms[0].id,
          divisi: divisions[0].id,
          createdBy,
        },
        {
          code: 'ARF-2026-0002',
          name: 'Dell UltraSharp 32" 4K Monitor',
          purchaseFromDate: '2026-02-15',
          purchaseToDate: '2026-02-16',
          manufactureId: mfgIds[0], // Dell
          economicAge: 4,
          condition: 'good',
          price: '12000000.00',
          description: 'Design monitor for creative marketing.',
          status: 'active',
          category: 'asset',
          ptId,
          location: 'HQ Jakarta',
          roomId: rooms[0].id,
          divisi: divisions[1 % divisions.length].id,
          createdBy,
        },
        {
          code: 'ARF-2026-0003',
          name: 'Herman Miller Aeron Chair Size B',
          purchaseFromDate: '2026-03-01',
          purchaseToDate: '2026-03-02',
          manufactureId: mfgIds[3], // Herman Miller
          economicAge: 10,
          condition: 'excellent',
          price: '24000000.00',
          description: 'Ergonomic mesh office chair.',
          status: 'active',
          category: 'asset',
          ptId,
          location: 'HQ Bandung Office',
          roomId: rooms[1 % rooms.length].id,
          divisi: divisions[0].id,
          createdBy,
        },
        {
          code: 'ARF-2026-0004',
          name: 'Logitech MX Master 3S Mouse',
          purchaseFromDate: '2026-03-05',
          purchaseToDate: '2026-03-05',
          manufactureId: mfgIds[2], // Logitech
          economicAge: 2,
          condition: 'good',
          price: '1600000.00',
          description: 'Wireless mouse for productivity.',
          status: 'active',
          category: 'asset',
          ptId,
          location: 'HQ Bandung Office',
          roomId: rooms[1 % rooms.length].id,
          divisi: divisions[1 % divisions.length].id,
          createdBy,
        },
      ]

      for (const assetData of dummyAssets) {
        const [assetRes] = await db.insert(schema.assets).values(assetData)
        const assetId = assetRes.insertId
        console.log(`Asset created: ${assetData.name} (ID: ${assetId})`)

        // Seed sample image
        await db.insert(schema.assetImages).values({
          assetId,
          attachment: '/storage/uploads/sample-asset.jpg',
        })

        // Seed responsible employee
        if (employees.length > 0) {
          const empIdx = Math.floor(Math.random() * employees.length)
          await db.insert(schema.assetHasEmployees).values({
            assetId,
            employeeId: employees[empIdx].id,
          })
          console.log(`Mapped Asset ID ${assetId} to Employee ID ${employees[empIdx].id}`)
        }
      }
    } else {
      console.log('Skipping asset seeding: companies, rooms, or divisions do not exist.')
    }
  } else {
    console.log('Assets already exist or manufacturers not seeded, skipping asset seeding.')
  }

  console.log('Asset seeding completed successfully.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
