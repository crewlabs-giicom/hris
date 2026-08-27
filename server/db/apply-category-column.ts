import 'dotenv/config'
import mysql from 'mysql2/promise'

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })

  console.log('Adding "category" column to "assets" table...')
  try {
    // Add column category to assets table
    await connection.query("ALTER TABLE `assets` ADD COLUMN `category` varchar(50) NOT NULL DEFAULT 'asset'")
    console.log('[SUCCESS] Column "category" added successfully.')
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('[SKIPPED] Column "category" already exists.')
    } else {
      console.error('[ERROR] Failed to add column:', err.message)
    }
  }

  await connection.end()
}

main().catch(console.error)
