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

  console.log('Seeding permissions & roles for asset requests...')
  const newPermissions = ['asset_requests.view', 'asset_requests.manage']
  const roleMap = {
    super_admin: newPermissions,
    hr_admin: newPermissions,
    approver: ['asset_requests.view'],
    employee: ['asset_requests.view'],
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

  console.log('Seeding dummy asset requests safely...')
  const existingRequests = await db.select().from(schema.assetRequests)
  if (existingRequests.length === 0) {
    // Fetch dependencies
    const pts = await db.select().from(schema.companies).limit(1)
    const rooms = await db.select().from(schema.rooms).limit(2)
    const manufacturers = await db.select().from(schema.manufacturers).limit(2)
    const employees = await db.select().from(schema.employees).limit(3)
    const adminUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'super_admin'))
      .limit(1)

    if (pts.length > 0 && rooms.length > 0 && manufacturers.length > 0 && employees.length > 0 && adminUser.length > 0) {
      const ptId = pts[0].id
      const requester = employees[0]
      // Try to find a finance employee or use employees[1]
      const financeStaff = employees[1 % employees.length]
      const createdBy = adminUser[0].id

      // 1. Pending Request
      const [req1Res] = await db.insert(schema.assetRequests).values({
        code: 'REQ-ASSET-20260824-0001',
        employeeId: requester.id,
        category: 'penambahan',
        ptId,
        marketplace: 'shopee',
        bank: 'bca',
        rekening: '8001234567',
        paymentTo: 'PT Shopee International Indonesia',
        financeId: financeStaff.id,
        requestDate: '2026-08-24',
        price: '5400000.00',
        description: 'Pengadaan laptop baru untuk staff engineering magang.',
        status: 'pending',
        createdBy,
      })
      const req1Id = req1Res.insertId

      // Insert Request Detail
      const [det1Res] = await db.insert(schema.assetRequestDetails).values({
        assetRequestId: req1Id,
        arfNumber: 'ARF-2026-9001',
        name: 'ASUS Vivobook 14"',
        price: '5400000.00',
        quantity: 1,
        totalPrice: '5400000.00',
        economicAge: 3,
        condition: 'new',
        manufacturerId: manufacturers[0].id,
        roomId: rooms[0].id,
      })

      // Insert Request Images
      await db.insert(schema.assetRequestImages).values({
        assetRequestId: req1Id,
        attachment: '/storage/uploads/invoice-master-1.jpg',
      })
      await db.insert(schema.assetRequestDetailImages).values({
        assetRequestDetailId: det1Res.insertId,
        attachment: '/storage/uploads/asus-spec.jpg',
      })

      // 2. Completed Request (which should have generated assets already in production, but we seed the request as completed here)
      const [req2Res] = await db.insert(schema.assetRequests).values({
        code: 'REQ-ASSET-20260820-0001',
        employeeId: requester.id,
        category: 'pengganti',
        ptId,
        marketplace: 'non marketplace',
        bank: 'mandiri',
        rekening: '1310022334455',
        paymentTo: 'Toko Listrik Sinar Abadi',
        financeId: financeStaff.id,
        requestDate: '2026-08-20',
        paymentDate: '2026-08-22',
        price: '3000000.00',
        description: 'Penggantian AC ruangan meeting yang mati.',
        status: 'completed',
        createdBy,
      })
      const req2Id = req2Res.insertId

      const [det2Res] = await db.insert(schema.assetRequestDetails).values({
        assetRequestId: req2Id,
        arfNumber: 'ARF-2026-9002',
        name: 'Panasonic AC 1 PK',
        price: '1500000.00',
        quantity: 2,
        totalPrice: '3000000.00',
        economicAge: 5,
        condition: 'new',
        manufacturerId: manufacturers[1 % manufacturers.length].id,
        roomId: rooms[1 % rooms.length].id,
      })

      await db.insert(schema.assetRequestImages).values({
        assetRequestId: req2Id,
        attachment: '/storage/uploads/invoice-master-2.jpg',
      })
      await db.insert(schema.assetRequestDetailImages).values({
        assetRequestDetailId: det2Res.insertId,
        attachment: '/storage/uploads/ac-spec.jpg',
      })

      console.log('Seeded dummy asset requests successfully.')
    } else {
      console.log('Skipping requests seeding: dependencies (companies, rooms, manufacturers, employees) not found.')
    }
  } else {
    console.log('Asset requests already exist, skipping dummy data.')
  }

  console.log('Asset requests seeding completed successfully.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
