import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'
import { eq, isNull } from 'drizzle-orm'
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

  console.log('Fetching employees without user accounts...')
  const employeesWithoutUser = await db
    .select()
    .from(schema.employees)
    .where(isNull(schema.employees.userId))

  console.log(`Found ${employeesWithoutUser.length} employees without user accounts.`)

  if (employeesWithoutUser.length === 0) {
    console.log('All employees already have user accounts. Exiting.')
    await pool.end()
    return
  }

  const teams = await db.select().from(schema.teams)
  const roles = await db.select().from(schema.roles)
  const employeeRole = roles.find((r) => r.name === 'employee')

  if (teams.length === 0) {
    console.error('Error: Teams must be seeded first! Please run npx tsx server/db/seed-teams.ts')
    await pool.end()
    process.exit(1)
  }

  const hashedDefaultPassword = await bcrypt.hash('password123', 10)

  console.log('Generating users and mapping to teams...')
  for (const emp of employeesWithoutUser) {
    const email = emp.email || faker.internet.email({ firstName: emp.fullName.split(' ')[0] }).toLowerCase()
    
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

    // 3. Link employee to user
    await db
      .update(schema.employees)
      .set({ userId })
      .where(eq(schema.employees.id, emp.id))

    // 4. Assign user to team
    const team = faker.helpers.arrayElement(teams)
    
    // Check if mapping already exists to prevent duplicate entry
    const existingMap = await db
      .select()
      .from(schema.teamHasUsers)
      .where(eq(schema.teamHasUsers.userId, userId))

    if (existingMap.length === 0) {
      await db.insert(schema.teamHasUsers).values({
        teamId: team.id,
        userId,
      })
    }

    console.log(`- Linked employee ${emp.employeeCode} (${emp.fullName}) to User ID ${userId} and Team ${team.name}`)
  }

  console.log('Users and team mappings seeded successfully for existing employees!')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
