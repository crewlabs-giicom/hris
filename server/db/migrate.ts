import 'dotenv/config'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'

/**
 * Pengganti `drizzle-kit migrate` yang menampilkan error MySQL apa adanya.
 * drizzle-kit menelan pesan errornya, jadi migration yang gagal cuma
 * terlihat seperti "tidak melakukan apa-apa".
 */
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
    multipleStatements: true,
  })

  const db = drizzle(conn)

  console.log('Menjalankan migration dari server/db/migrations ...')
  await migrate(db, { migrationsFolder: './server/db/migrations' })
  console.log('Semua migration selesai.')

  await conn.end()
}

main().catch((err) => {
  console.error('\n=== MIGRATION GAGAL ===')
  console.error(err)
  if (err?.cause) console.error('\ncause:', err.cause)
  process.exit(1)
})
