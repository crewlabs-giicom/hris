import 'dotenv/config'
import mysql from 'mysql2/promise'

/**
 * Diagnostik: bandingkan isi tabel stamp `__drizzle_migrations` dengan
 * kondisi skema sebenarnya. Dipakai waktu `drizzle-kit migrate` diam saja
 * padahal ada kolom dari migration yang belum ada di DB.
 */
async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
  })

  console.log('DB =', process.env.DB_NAME, '@', process.env.DB_HOST)

  try {
    const [rows] = await c.query(
      'select id, hash, from_unixtime(created_at/1000) as applied_at from `__drizzle_migrations` order by id'
    )
    console.log(`\n__drizzle_migrations: ${(rows as any[]).length} baris`)
    console.table(rows)
  } catch (err: any) {
    console.log('\n__drizzle_migrations:', err.code === 'ER_NO_SUCH_TABLE' ? 'TIDAK ADA' : err.message)
  }

  const [tables] = await c.query('show tables')
  console.log('jumlah tabel:', (tables as any[]).length)

  // Penanda per-migration: kalau false, DDL migration itu belum jalan di DB ini.
  const probes: Array<[string, string]> = [
    ['0000 employees', "show tables like 'employees'"],
    ['0005 employees.basic_salary', "show columns from employees like 'basic_salary'"],
    ['0005 attendance_consolidations', "show tables like 'attendance_consolidations'"],
  ]
  console.log()
  for (const [label, sql] of probes) {
    try {
      const [r] = await c.query(sql)
      console.log(`${(r as any[]).length > 0 ? 'ADA   ' : 'HILANG'}  ${label}`)
    } catch (err: any) {
      console.log(`ERROR   ${label}: ${err.code || err.message}`)
    }
  }

  await c.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
