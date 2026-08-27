import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { faker } from '@faker-js/faker'
import * as schema from './schema'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })
  const db = drizzle(pool, { schema, mode: 'default' })

  console.log('Fetching existing employees and users...')
  const employeesList = await db.select().from(schema.employees).limit(10)
  const usersList = await db.select().from(schema.users).limit(5)

  if (employeesList.length === 0) {
    console.error('No employees found in database. Run db:seed first.')
    await pool.end()
    process.exit(1)
  }

  if (usersList.length === 0) {
    console.error('No users found in database. Run db:seed first.')
    await pool.end()
    process.exit(1)
  }

  console.log('Seeding 5 resignation records...')
  const resignationTypes = [
    'Efektif Resign',
    'Habis Kontrak',
    'Freelance / Magang berakhir',
    'Cancel join',
    'Pemutusan Hub. Kerja',
  ]
  const statuses = ['active', 'approved', 'rejected']
  const taskOptions = [
    { task: 'Mengembalikan laptop dan charger', type: 'hard copy' as const },
    { task: 'Menyerahkan dokumen handover laporan proyek', type: 'soft copy' as const },
    { task: 'Mengembalikan ID card karyawan', type: 'hard copy' as const },
    { task: 'Menghapus akun akses email kantor', type: 'soft copy' as const },
    { task: 'Mengembalikan kunci laci meja kerja', type: 'hard copy' as const },
  ]

  for (let i = 0; i < 5; i++) {
    const employee = employeesList[i % employeesList.length]
    const creator = usersList[i % usersList.length]

    // Create resignation date in 2026 (Jan to Dec)
    const month = String(i + 1).padStart(2, '0')
    const resignDate = `2026-${month}-15`

    const [res] = await db.insert(schema.resignations).values({
      employeeId: employee.id,
      resignationDate: resignDate,
      resignationType: resignationTypes[i % resignationTypes.length],
      resignationReason: faker.lorem.paragraph(2),
      status: statuses[i % statuses.length],
      createdBy: creator.id,
      updatedBy: creator.id,
    })

    const resignationId = res.insertId
    console.log(`Inserted resignation ID: ${resignationId} for employee: ${employee.fullName}`)

    // Seed tasks (between 1 and 3 tasks per resignation)
    const numTasks = faker.number.int({ min: 1, max: 3 })
    const shuffledTasks = faker.helpers.shuffle(taskOptions)
    for (let t = 0; t < numTasks; t++) {
      await db.insert(schema.resignationTasks).values({
        resignationId,
        task: shuffledTasks[t].task,
        type: shuffledTasks[t].type,
      })
    }

    // Seed asset mapping (between 0 and 2 assets)
    const numAssets = faker.number.int({ min: 0, max: 2 })
    for (let a = 0; a < numAssets; a++) {
      await db.insert(schema.resignationAssets).values({
        resignationId,
        assetId: faker.number.int({ min: 1, max: 50 }),
      })
    }
  }

  console.log('Resignations seeding complete.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
