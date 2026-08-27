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
    multipleStatements: true, // Allow executing multiple statements if needed
  })

  console.log('Reading migration file 0005_melted_union_jack.sql...')
  const migrationPath = path.join(process.cwd(), 'server/db/migrations/0005_melted_union_jack.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found!')
    await connection.end()
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8')
  
  // Split the statements by Drizzle's statement-breakpoint
  const statements = sqlContent
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  console.log(`Found ${statements.length} SQL statements to execute.`)

  let successCount = 0
  let skippedCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    // Clean up comment lines
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
      // If table/column already exists, we can safely ignore it and continue
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
        console.log(`[SKIPPED] Table/Column/Index already exists (Code: ${err.code}).`)
        skippedCount++
      } else {
        console.error(`[ERROR] Statement ${i + 1} failed:`, err.message)
        console.error('SQL query was:', cleanStmt)
        // We continue to allow other independent statements to run
      }
    }
  }

  // Insert a mock record to Drizzle's __drizzle_migrations table if needed,
  // but since we bypass it for dev, syncing schema directly is enough.
  console.log(`\nMigration completed: ${successCount} succeeded, ${skippedCount} skipped.`)
  await connection.end()
}

main().catch(console.error)
