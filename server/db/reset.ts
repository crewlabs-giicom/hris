import 'dotenv/config'
import mysql from 'mysql2/promise'

/**
 * DESTRUKTIF. Drop semua tabel di DB yang ditunjuk .env, termasuk
 * `__drizzle_migrations`, sehingga `drizzle-kit migrate` bisa jalan
 * bersih dari 0000. Dipakai waktu skema DB dibuat di luar drizzle
 * sehingga stamp migration-nya tidak pernah sinkron.
 *
 * Jalankan dengan: npx tsx server/db/reset.ts --yes
 */
async function main() {
  const dbName = process.env.DB_NAME || 'hris'

  if (!process.argv.includes('--yes')) {
    console.error(`Akan DROP SEMUA TABEL di database "${dbName}".`)
    console.error('Ulangi dengan flag --yes kalau memang itu yang dimaui.')
    process.exit(1)
  }

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
  })

  const [rows] = await c.query<any[]>(
    'select table_name as t from information_schema.tables where table_schema = ? and table_type = ?',
    [dbName, 'BASE TABLE']
  )
  const tables = rows.map((r) => r.t)

  if (tables.length === 0) {
    console.log(`Database "${dbName}" sudah kosong.`)
    await c.end()
    return
  }

  console.log(`Drop ${tables.length} tabel dari "${dbName}"...`)
  // FK dimatikan sementara supaya urutan drop tidak perlu dipikirkan.
  await c.query('set foreign_key_checks = 0')
  for (const t of tables) {
    await c.query(`drop table if exists \`${t}\``)
    console.log(`  dropped ${t}`)
  }
  await c.query('set foreign_key_checks = 1')

  console.log('\nSelesai. Lanjutkan dengan: npm run db:migrate && npm run db:seed')
  await c.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
