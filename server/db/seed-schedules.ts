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

  console.log('Fetching employees, users, and shifts...')
  const employeesList = await db.select().from(schema.employees).limit(10)
  const usersList = await db.select().from(schema.users).limit(5)
  const shiftsList = await db.select().from(schema.shifts).limit(5)

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

  if (shiftsList.length === 0) {
    console.error('No shifts found in database. Run db:seed first.')
    await pool.end()
    process.exit(1)
  }

  // 1. Seed 5 Schedule records
  console.log('Seeding 5 scheduling records...')
  for (let i = 0; i < 5; i++) {
    const employee = employeesList[i % employeesList.length]
    const userObj = usersList[i % usersList.length]
    const shift = shiftsList[i % shiftsList.length]

    const month = String(i + 1).padStart(2, '0')
    const validFrom = `2026-${month}-01`
    const validTo = `2026-${month}-28`

    await db.insert(schema.schedules).values({
      employeeId: employee.id,
      shiftId: shift.id,
      isFix: i % 2 === 0 ? 1 : 0,
      isOff: 0,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      createdBy: userObj.id,
      updatedBy: userObj.id,
    })
  }

  // 2. Seed 5 Schedule Adjustment records
  console.log('Seeding 5 schedule adjustment records...')
  for (let i = 0; i < 5; i++) {
    const employee = employeesList[(i + 2) % employeesList.length]
    const userObj = usersList[i % usersList.length]
    const shift = shiftsList[(i + 1) % shiftsList.length]

    const month = String(i + 1).padStart(2, '0')
    const adjustmentDate = `2026-${month}-10`

    await db.insert(schema.scheduleAdjustments).values({
      employeeId: employee.id,
      shiftId: shift.id,
      adjustmentDate: new Date(adjustmentDate),
      isOff: i % 3 === 0 ? 1 : 0,
      status: 'active',
      createdBy: userObj.id,
      updatedBy: userObj.id,
    })
  }

  // 3. Seed 5 Manual Attendance records
  console.log('Seeding 5 manual attendance records...')
  const attendanceTypes = ['Manual Absen', 'Telat Masuk dan Punishment']
  const statuses = ['active', 'approved', 'rejected']

  for (let i = 0; i < 5; i++) {
    const employee = employeesList[(i + 4) % employeesList.length]
    const userObj = usersList[i % usersList.length]

    const month = String(i + 1).padStart(2, '0')
    const startDate = `2026-${month}-12`
    const endDate = `2026-${month}-12`

    const type = attendanceTypes[i % attendanceTypes.length]
    const isFree = type === 'Manual Absen' && i % 2 === 0 ? 'Yes' : 'No'

    const [res] = await db.insert(schema.manualAttendances).values({
      employeeId: employee.id,
      manualAttendanceType: type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      clockIn: isFree === 'Yes' ? '08:30' : '08:45',
      clockOut: isFree === 'Yes' ? '17:00' : '17:15',
      isLate: isFree === 'Yes' ? 0 : 1,
      freeAttendances: isFree,
      description: faker.lorem.sentence(),
      status: statuses[i % statuses.length],
      createdBy: userObj.id,
      updatedBy: userObj.id,
    })

    const manualId = res.insertId

    // Add an attachment for each record
    await db.insert(schema.manualAttendanceAttachments).values({
      manualAttendanceId: manualId,
      attachment: `https://picsum.photos/seed/attendance${manualId}/600/400`,
    })
  }

  console.log('All schedule-related tables seeded successfully.')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
