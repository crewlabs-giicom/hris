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

  console.log('Seeding rooms safely...')
  let roomIds: number[] = []
  const existingRooms = await db.select().from(schema.rooms)
  if (existingRooms.length === 0) {
    const insertedRooms = [
      { name: 'Meeting Room 1', ruko: 'Ruko Magnolia Block A', floor: 1 },
      { name: 'Meeting Room 2', ruko: 'Ruko Magnolia Block A', floor: 2 },
      { name: 'Main Hall Auditorium', ruko: 'Ruko Orchid Block B', floor: 1 },
      { name: 'Creative Focus Space', ruko: 'Ruko Orchid Block B', floor: 2 },
    ]

    for (const r of insertedRooms) {
      const [res] = await db.insert(schema.rooms).values(r)
      roomIds.push(res.insertId)
      console.log(`Room created: ${r.name}`)
    }
  } else {
    roomIds = existingRooms.map((r) => r.id)
    console.log('Rooms already exist, using existing room IDs.')
  }

  console.log('Seeding new permissions and mapping to roles safely...')
  const newPermissions = [
    'rooms.view',
    'rooms.manage',
    'room_reservations.view',
    'room_reservations.manage',
  ]

  const roleMap = {
    super_admin: newPermissions,
    hr_admin: newPermissions,
    approver: ['rooms.view', 'room_reservations.view'],
    employee: ['rooms.view', 'room_reservations.view', 'room_reservations.manage'],
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

  console.log('Seeding dummy room reservations safely...')
  const existingReservations = await db.select().from(schema.roomReservations)
  if (existingReservations.length === 0 && roomIds.length > 0) {
    const emps = await db.select().from(schema.employees).limit(5)
    if (emps.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const reservations = [
        {
          employeeId: emps[0].id,
          roomId: roomIds[0],
          type: false, // Standard (max 3 hours)
          date: today,
          clockStart: '09:00:00',
          clockEnd: '11:00:00', // 2 hours
          description: 'Daily standup meeting',
          createdBy: emps[0].id,
        },
        {
          employeeId: emps[1 % emps.length].id,
          roomId: roomIds[1 % roomIds.length],
          type: true, // Event (no limit)
          date: today,
          clockStart: '13:00:00',
          clockEnd: '18:00:00', // 5 hours (allowed for event)
          description: 'Quarterly Town Hall and Sharing Session',
          createdBy: emps[1 % emps.length].id,
        },
        {
          employeeId: emps[2 % emps.length].id,
          roomId: roomIds[2 % roomIds.length],
          type: false, // Standard
          date: today,
          clockStart: '10:00:00',
          clockEnd: '12:30:00', // 2.5 hours
          description: 'Technical brainstorming',
          createdBy: emps[2 % emps.length].id,
        },
      ]

      for (const res of reservations) {
        await db.insert(schema.roomReservations).values(res)
        console.log(`Reservation created for Room ID ${res.roomId} by Employee ID ${res.employeeId}`)
      }
    } else {
      console.log('No employees found, skipping room reservations seeding.')
    }
  } else {
    console.log('Reservations already exist or no rooms available, skipping reservations seeding.')
  }

  console.log('Custom rooms seeding completed.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
