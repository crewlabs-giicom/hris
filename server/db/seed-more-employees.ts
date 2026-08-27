import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { faker } from '@faker-js/faker'
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

  console.log('Fetching master data references...')
  const departments = await db.select().from(schema.departments)
  const positions = await db.select().from(schema.positions)
  const divisions = await db.select().from(schema.divisions)
  const levels = await db.select().from(schema.levels)
  const companies = await db.select().from(schema.companies)
  const banks = await db.select().from(schema.banks)
  const teams = await db.select().from(schema.teams)
  const roles = await db.select().from(schema.roles)

  const employeeRole = roles.find((r) => r.name === 'employee')

  if (departments.length === 0 || positions.length === 0 || levels.length === 0 || companies.length === 0 || teams.length === 0) {
    console.error('Error: Master data (departments, positions, levels, companies, teams) must be seeded first!')
    await pool.end()
    process.exit(1)
  }

  // Get current max employee code suffix to prevent duplicate code
  const existingEmployees = await db.select({ code: schema.employees.employeeCode }).from(schema.employees)
  let startIdx = 11
  if (existingEmployees.length > 0) {
    const suffixes = existingEmployees
      .map((e) => {
        const match = e.code.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter(Boolean)
    if (suffixes.length > 0) {
      startIdx = Math.max(...suffixes) + 1
    }
  }

  console.log(`Seeding 10 more employees starting from code suffix ${startIdx}...`)
  const hashedDefaultPassword = await bcrypt.hash('password123', 10)

  for (let i = 0; i < 10; i++) {
    const idx = startIdx + i
    const employeeCode = `EMP${String(idx).padStart(4, '0')}`
    const fullName = faker.person.fullName()
    const email = faker.internet.email({ firstName: fullName.split(' ')[0] }).toLowerCase()
    const joinDate = faker.date.past({ years: 2 }).toISOString().slice(0, 10)

    const dept = faker.helpers.arrayElement(departments)
    const pos = faker.helpers.arrayElement(positions)
    const div = faker.helpers.arrayElement(divisions)
    const comp = faker.helpers.arrayElement(companies)
    const bank = faker.helpers.arrayElement(banks)
    const lvl = faker.helpers.arrayElement(levels)
    const team = faker.helpers.arrayElement(teams)

    // 1. Create user account
    const [userRes] = await db.insert(schema.users).values({
      email,
      passwordHash: hashedDefaultPassword,
      role: 'employee',
    })
    const userId = userRes.insertId

    // 2. Assign employee role relationship
    if (employeeRole) {
      await db.insert(schema.modelHasRoles).values({
        roleId: employeeRole.id,
        modelId: userId,
        modelType: 'user',
      })
    }

    // 3. Create employee details
    const [empRes] = await db.insert(schema.employees).values({
      userId,
      employeeCode,
      fullName,
      email,
      departmentId: dept.id,
      positionId: pos.id,
      divisionId: div?.id || null,
      companyId: comp.id,
      bankId: bank?.id || null,
      employmentStatus: 'active',
      joinDate,
    })
    const employeeId = empRes.insertId

    // 4. Create level history
    await db.insert(schema.employeeLevelHistories).values({
      employeeId,
      levelId: lvl.id,
      effectiveDate: joinDate,
      note: 'Initial level on hire (bulk seed)',
    })

    // 5. Assign user to team (team_has_users)
    await db.insert(schema.teamHasUsers).values({
      teamId: team.id,
      userId,
    })

    console.log(`- Created ${employeeCode}: ${fullName} (Team: ${team.name}, User ID: ${userId})`)
  }

  console.log('Seeder completed successfully!')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
