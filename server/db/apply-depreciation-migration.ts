import 'dotenv/config'
import mysql from 'mysql2/promise'

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hris',
    multipleStatements: true,
  })

  console.log('Creating asset depreciation tables...')

  const runsTableSql = `
    CREATE TABLE IF NOT EXISTS \`asset_depreciation_runs\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`period_date\` date NOT NULL,
      \`total_assets\` int NOT NULL,
      \`total_amount\` decimal(15, 2) NOT NULL,
      \`created_by\` int NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`asset_dep_runs_created_by_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  const logsTableSql = `
    CREATE TABLE IF NOT EXISTS \`asset_depreciation_logs\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`run_id\` int NOT NULL,
      \`asset_id\` int NOT NULL,
      \`period_date\` date NOT NULL,
      \`amount\` decimal(15, 2) NOT NULL,
      \`remaining_age\` int NOT NULL,
      \`remaining_value\` decimal(15, 2) NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`asset_dep_logs_run_id_fk\` FOREIGN KEY (\`run_id\`) REFERENCES \`asset_depreciation_runs\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`asset_dep_logs_asset_id_fk\` FOREIGN KEY (\`asset_id\`) REFERENCES \`assets\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `

  try {
    await connection.query(runsTableSql)
    console.log('[SUCCESS] Table "asset_depreciation_runs" created or already exists.')

    await connection.query(logsTableSql)
    console.log('[SUCCESS] Table "asset_depreciation_logs" created or already exists.')
  } catch (err: any) {
    console.error('[ERROR] Migration failed:', err.message)
  }

  await connection.end()
}

main().catch(console.error)
