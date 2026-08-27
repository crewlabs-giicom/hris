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

  console.log('Seeding attendance log data for August 2026...')

  // Fetch all employees in database
  const employeesList = await db.select().from(schema.employees)
  console.log(`Found ${employeesList.length} employees to seed attendance for.`)

  if (employeesList.length === 0) {
    console.log('No employees found. Please run seed-more-employees first.')
    await pool.end()
    return
  }

  // Clear existing attendance logs for August 2026 to start fresh
  const augustStart = '2026-08-01'
  const augustEnd = '2026-08-31'
  
  // Find all attendance IDs for August 2026
  const existingAtts = await db.select({ id: schema.employeeAttendances.id })
    .from(schema.employeeAttendances)
    .where(
      drizzleDbQueryCond()
    )

  function drizzleDbQueryCond() {
    const { and, sql } = require('drizzle-orm')
    return and(
      sql`${schema.employeeAttendances.date} >= ${augustStart}`,
      sql`${schema.employeeAttendances.date} <= ${augustEnd}`
    )
  }

  const existingAttIds = existingAtts.map((a) => a.id)
  if (existingAttIds.length > 0) {
    const { inArray } = require('drizzle-orm')
    await db.delete(schema.employeeAttendanceDetails)
      .where(inArray(schema.employeeAttendanceDetails.attendanceId, existingAttIds))
    await db.delete(schema.employeeAttendances)
      .where(inArray(schema.employeeAttendances.id, existingAttIds))
    console.log(`Cleared existing attendance logs for August 2026.`)
  }

  // Clear consolidations for August 2026 as well
  const { and, eq } = require('drizzle-orm')
  await db.delete(schema.attendanceConsolidations)
    .where(
      and(
        eq(schema.attendanceConsolidations.month, 8),
        eq(schema.attendanceConsolidations.year, 2026)
      )
    )
  console.log('Cleared existing consolidations for August 2026.')

  // Clear insentives and deductions for August 2026
  await db.delete(schema.insentives)
    .where(and(eq(schema.insentives.month, 8), eq(schema.insentives.year, 2026)))
  await db.delete(schema.deductions)
    .where(and(eq(schema.deductions.month, 8), eq(schema.deductions.year, 2026)))
  console.log('Cleared existing incentives and deductions.')

  // Seed attendances and details day-by-day
  for (const emp of employeesList) {
    console.log(`Seeding attendance logs for: ${emp.fullName}...`)
    
    // We will loop from Day 1 to Day 31 of August 2026
    for (let day = 1; day <= 31; day++) {
      const dayStr = String(day).padStart(2, '0')
      const dateStr = `2026-08-${dayStr}`
      const dateObj = new Date(2026, 7, day) // August is month index 7
      
      const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      if (isWeekend) {
        // Weekend -> Scheduled OFF Day
        await db.insert(schema.employeeAttendances).values({
          employeeId: emp.id,
          shiftIn: '00:00:00',
          shiftOut: '00:00:00',
          date: dateStr,
          isOff: 1, // OFF
          isLock: 0,
        })
      } else {
        // Weekday -> Scheduled Work Day
        const [insertedAtt] = await db.insert(schema.employeeAttendances).values({
          employeeId: emp.id,
          shiftIn: '08:00:00',
          shiftOut: '17:00:00',
          date: dateStr,
          isOff: 0,
          isLock: 0,
        })
        
        const attId = insertedAtt.insertId

        // Determine punch type for variety:
        if (day === 5) {
          // Case 1: Late Clock In (T - 25 mins)
          await db.insert(schema.employeeAttendanceDetails).values([
            {
              attendanceId: attId,
              permissionTypeId: 1, // Clock In
              clock: '08:25:00',
              location: 'OFFICE',
            },
            {
              attendanceId: attId,
              permissionTypeId: 2, // Clock Out
              clock: '17:05:00',
              location: 'OFFICE',
            }
          ])
        } else if (day === 12) {
          // Case 2: Masuk Siang (MS) (75 mins late)
          await db.insert(schema.employeeAttendanceDetails).values([
            {
              attendanceId: attId,
              permissionTypeId: 1, // Clock In
              clock: '09:15:00',
              location: 'OFFICE',
            },
            {
              attendanceId: attId,
              permissionTypeId: 2, // Clock Out
              clock: '17:00:00',
              location: 'OFFICE',
            }
          ])
        } else if (day === 19) {
          // Case 3: Sakit (S) - with form (PermissionTypeId 10)
          await db.insert(schema.employeeAttendanceDetails).values([
            {
              attendanceId: attId,
              permissionTypeId: 10, // Sakit
              clock: '00:00:00',
              description: 'Sakit flu dengan surat keterangan dokter',
            }
          ])
        } else if (day === 24) {
          // Case 4: Pulang Cepat (PC) (90 mins early)
          await db.insert(schema.employeeAttendanceDetails).values([
            {
              attendanceId: attId,
              permissionTypeId: 1, // Clock In
              clock: '07:58:00',
              location: 'OFFICE',
            },
            {
              attendanceId: attId,
              permissionTypeId: 2, // Clock Out
              clock: '15:30:00',
              location: 'OFFICE',
            }
          ])
        } else if (day === 28) {
          // Case 5: Alpha (Do nothing - no detail details inserted)
          // This will trigger Alpha calculation
        } else {
          // Case 6: Normal Day (On time clock in/out)
          await db.insert(schema.employeeAttendanceDetails).values([
            {
              attendanceId: attId,
              permissionTypeId: 1, // Clock In
              clock: '07:54:00',
              location: 'OFFICE',
            },
            {
              attendanceId: attId,
              permissionTypeId: 2, // Clock Out
              clock: '17:02:00',
              location: 'OFFICE',
            }
          ])
        }
      }
    }
  }

  // Seed incentives and deductions for the first 3 employees
  const selectedEmps = employeesList.slice(0, 3)
  for (let i = 0; i < selectedEmps.length; i++) {
    const emp = selectedEmps[i]
    
    // Insentive
    await db.insert(schema.insentives).values({
      employeeId: emp.id,
      status: 'active',
      month: 8,
      year: 2026,
      type: 'insentif',
      amount: String(500000 + i * 100000),
      description: `Insentif project bonus ke-${i + 1}`,
      createdBy: 1,
    })

    // Deduction
    await db.insert(schema.deductions).values({
      employeeId: emp.id,
      status: 'active',
      month: 8,
      year: 2026,
      type: 'pengurangan gaji',
      amount: String(1), // 1 day of wage reduction
      description: 'Potongan keterlambatan massal',
      createdBy: 1,
    })
  }

  console.log('Successfully finished seeding attendance records!')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
