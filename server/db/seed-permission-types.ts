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

  console.log('Seeding permission types data...')

  const permissionTypesData = [
    { id: 1, uniqueId: randomUUID(), code: 'IN', name: 'IN', createdAt: new Date('2023-05-26 07:42:37'), updatedAt: new Date('2023-05-26 07:42:37') },
    { id: 2, uniqueId: randomUUID(), code: 'OUT', name: 'OUT', createdAt: new Date('2023-05-26 07:42:44'), updatedAt: new Date('2023-05-26 07:42:44') },
    { id: 3, uniqueId: randomUUID(), code: 'C', name: 'Cuti', createdAt: new Date('2023-05-31 02:13:27'), updatedAt: new Date('2023-05-31 02:13:27') },
    { id: 4, uniqueId: randomUUID(), code: 'I', name: 'Tidak Masuk / Sakit Tidak Ada SKD', createdAt: new Date('2023-05-31 02:14:07'), updatedAt: new Date('2023-05-31 02:14:07') },
    { id: 5, uniqueId: randomUUID(), code: 'PC', name: 'Pulang Cepat', createdAt: new Date('2023-05-31 02:14:20'), updatedAt: new Date('2023-05-31 02:14:20') },
    { id: 6, uniqueId: randomUUID(), code: 'MS', name: 'Masuk Siang', createdAt: new Date('2023-05-31 02:14:25'), updatedAt: new Date('2023-05-31 02:14:25') },
    { id: 7, uniqueId: randomUUID(), code: 'T', name: 'Telat', createdAt: new Date('2023-05-31 02:14:28'), updatedAt: new Date('2023-05-31 02:14:28') },
    { id: 8, uniqueId: randomUUID(), code: 'TF', name: 'Tidak Finger', createdAt: new Date('2023-05-31 02:14:43'), updatedAt: new Date('2023-05-31 02:14:43') },
    { id: 9, uniqueId: randomUUID(), code: 'IKH', name: 'Ijin Khusus', createdAt: new Date('2023-05-31 02:14:54'), updatedAt: new Date('2023-05-31 02:14:54') },
    { id: 10, uniqueId: randomUUID(), code: 'S', name: 'Sakit Ada SKD', createdAt: new Date('2023-05-31 02:14:59'), updatedAt: new Date('2023-05-31 02:14:59') },
    { id: 11, uniqueId: randomUUID(), code: 'CK', name: 'Cuti Khusus', createdAt: new Date('2023-05-31 02:15:59'), updatedAt: new Date('2023-05-31 02:15:59') },
    { id: 12, uniqueId: randomUUID(), code: 'IK', name: 'Keluar Saat Jam kerja', createdAt: new Date('2023-05-31 02:20:43'), updatedAt: new Date('2023-05-31 02:20:43') },
    { id: 13, uniqueId: randomUUID(), code: 'OFF', name: 'OFF', createdAt: new Date('2023-06-14 08:45:11'), updatedAt: new Date('2023-06-14 08:45:11') }
  ]

  // Clear existing permissionsType first to avoid duplicate primary key / code errors
  await db.delete(schema.permissionsType)
  console.log('Cleared existing permission types in database.')

  await db.insert(schema.permissionsType).values(permissionTypesData)
  console.log(`Successfully seeded ${permissionTypesData.length} permission types.`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
