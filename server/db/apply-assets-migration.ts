import 'dotenv/config'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
    multipleStatements: true,
  })

  const migrationsDir = path.join(process.cwd(), 'server/db/migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found!')
    await connection.end()
    process.exit(1)
  }

  // Scan and sort SQL migration files
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort() // Sorts 0000, 0001, ..., 0006, 0007

  if (files.length === 0) {
    console.error('No SQL migration files found!')
    await connection.end()
    process.exit(1)
  }

  // Get the latest migration file
  const latestMigrationFile = files[files.length - 1]
  console.log(`Latest migration file found: ${latestMigrationFile}`)
  
  const migrationPath = path.join(migrationsDir, latestMigrationFile)
  const sqlContent = fs.readFileSync(migrationPath, 'utf8')
  
  const statements = sqlContent
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  console.log(`Found ${statements.length} SQL statements to execute in ${latestMigrationFile}.`)

  let successCount = 0
  let skippedCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const cleanStmt = stmt
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim()

    if (!cleanStmt) continue

    console.log(`Executing statement ${i + 1}/${statements.length}...`)
    try {
      await connection.query(cleanStmt)
      console.log(`[SUCCESS] Statement ${i + 1} executed successfully.`)
      successCount++
    } catch (err: any) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
        console.log(`[SKIPPED] Table/Column/Index already exists (Code: ${err.code}).`)
        skippedCount++
      } else {
        console.error(`[ERROR] Statement ${i + 1} failed:`, err.message)
        console.error('SQL query was:', cleanStmt)
      }
    }
  }

  console.log(`\nMigration completed: ${successCount} succeeded, ${skippedCount} skipped.`)
  await connection.end()
}

main().catch(console.error)
