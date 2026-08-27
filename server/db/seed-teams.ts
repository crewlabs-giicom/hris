import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { randomUUID } from 'crypto'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })
  const db = drizzle(pool, { schema, mode: 'default' })

  console.log('Seeding teams data...')

  const teamsData = [
    { id: 1, uniqueId: randomUUID(), name: 'SHADOW', leaderId: 330, picId: 80, createdAt: new Date('2023-06-10 08:59:58'), updatedAt: new Date('2023-06-10 09:02:27') },
    { id: 3, uniqueId: randomUUID(), name: 'BRIDGE', leaderId: 261, picId: 80, createdAt: new Date('2023-06-10 09:02:36'), updatedAt: new Date('2023-10-31 16:38:47') },
    { id: 5, uniqueId: randomUUID(), name: 'THUNDER', leaderId: 345, picId: 80, createdAt: new Date('2023-10-17 10:36:11'), updatedAt: new Date('2023-10-17 10:36:15') },
    { id: 7, uniqueId: randomUUID(), name: 'HOKAGII', leaderId: 72, picId: 72, createdAt: new Date('2023-06-10 09:04:33'), updatedAt: new Date('2023-06-10 09:04:33') },
    { id: 8, uniqueId: randomUUID(), name: 'KAKTUS', leaderId: 266, picId: 72, createdAt: new Date('2023-06-10 09:04:45'), updatedAt: new Date('2023-06-10 09:04:45') },
    { id: 10, uniqueId: randomUUID(), name: 'MOONLIGHT', leaderId: 440, picId: 440, createdAt: new Date('2023-06-10 09:05:15'), updatedAt: new Date('2023-06-10 09:05:15') },
    { id: 12, uniqueId: randomUUID(), name: 'MIX-MIX', leaderId: 279, picId: 440, createdAt: new Date('2023-06-10 09:05:46'), updatedAt: new Date('2023-06-10 09:05:46') },
    { id: 13, uniqueId: randomUUID(), name: 'PISAU', leaderId: 167, picId: 440, createdAt: new Date('2023-06-10 09:06:06'), updatedAt: new Date('2023-06-10 09:06:06') },
    { id: 14, uniqueId: randomUUID(), name: 'DAYLIGHT', leaderId: 239, picId: 440, createdAt: new Date('2023-06-10 09:06:40'), updatedAt: new Date('2023-06-10 09:06:40') },
    { id: 16, uniqueId: randomUUID(), name: 'UNICORN', leaderId: 391, picId: 80, createdAt: new Date('2023-06-10 09:07:31'), updatedAt: new Date('2023-06-10 09:07:31') },
    { id: 17, uniqueId: randomUUID(), name: 'KOPASGAT', leaderId: 397, picId: 80, createdAt: new Date('2023-06-10 09:07:46'), updatedAt: new Date('2023-06-10 09:07:46') },
    { id: 18, uniqueId: randomUUID(), name: 'DOLPHIN', leaderId: 175, picId: 80, createdAt: new Date('2023-06-10 09:07:58'), updatedAt: new Date('2023-06-10 09:07:58') },
    { id: 19, uniqueId: randomUUID(), name: 'TAWON', leaderId: 391, picId: 80, createdAt: new Date('2023-06-10 09:09:02'), updatedAt: new Date('2023-06-10 09:09:02') },
    { id: 20, uniqueId: randomUUID(), name: 'WOLF', leaderId: 324, picId: 80, createdAt: new Date('2023-06-10 09:09:24'), updatedAt: new Date('2023-06-10 09:09:24') },
    { id: 21, uniqueId: randomUUID(), name: 'RRQ', leaderId: 268, picId: 80, createdAt: new Date('2023-06-10 09:10:58'), updatedAt: new Date('2023-06-10 09:10:58') },
    { id: 22, uniqueId: randomUUID(), name: 'HIVE', leaderId: 106, picId: 80, createdAt: new Date('2023-06-10 09:11:52'), updatedAt: new Date('2023-06-10 09:11:52') },
    { id: 26, uniqueId: randomUUID(), name: 'OCEAN', leaderId: 64, picId: 80, createdAt: new Date('2023-10-23 10:41:39'), updatedAt: new Date('2023-10-23 10:41:43') },
    { id: 27, uniqueId: randomUUID(), name: 'AVATAR', leaderId: null, picId: 80, createdAt: new Date('2023-10-27 11:28:43'), updatedAt: new Date('2023-10-27 11:28:43') },
    { id: 28, uniqueId: randomUUID(), name: 'SEMUT HITAM', leaderId: 80, picId: 80, createdAt: new Date('2023-06-10 09:00:47'), updatedAt: new Date('2023-06-10 09:00:47') },
    { id: 30, uniqueId: randomUUID(), name: 'INFINITY', leaderId: 440, picId: 440, createdAt: new Date('2024-01-06 09:59:16'), updatedAt: new Date('2024-01-06 09:59:16') },
    { id: 31, uniqueId: randomUUID(), name: 'SMART SINAR', leaderId: 574, picId: 574, createdAt: new Date('2024-07-23 13:58:30'), updatedAt: new Date('2024-07-23 13:58:30') },
    { id: 32, uniqueId: randomUUID(), name: 'CHAMPION', leaderId: 266, picId: 72, createdAt: new Date('2023-06-10 09:04:33'), updatedAt: new Date('2023-06-10 09:04:33') },
    { id: 33, uniqueId: randomUUID(), name: 'OWL', leaderId: 418, picId: 80, createdAt: new Date('2025-01-14 11:55:59'), updatedAt: new Date('2025-01-14 11:55:59') },
    { id: 34, uniqueId: randomUUID(), name: 'STARLIGHT', leaderId: 64, picId: 440, createdAt: new Date('2026-05-29 11:16:18'), updatedAt: new Date('2026-05-29 11:16:18') }
  ]

  // Clear existing pivot table mappings first
  await db.delete(schema.teamHasUsers)
  console.log('Cleared existing team_has_users mappings.')

  // Clear existing teams first
  await db.delete(schema.teams)
  console.log('Cleared existing teams in database.')

  // Seed teams
  await db.insert(schema.teams).values(teamsData)
  console.log(`Successfully seeded ${teamsData.length} teams.`)

  // Distribute existing users across teams
  const allUsers = await db.select({ id: schema.users.id }).from(schema.users)
  if (allUsers.length > 0) {
    const mappings = allUsers.map((u, idx) => {
      const team = teamsData[idx % teamsData.length]
      return {
        teamId: team.id,
        userId: u.id,
      }
    })
    await db.insert(schema.teamHasUsers).values(mappings)
    console.log(`Successfully mapped ${mappings.length} users to teams.`)
  }

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
