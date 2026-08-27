import { mysqlTable, int, date, decimal, timestamp } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assetDepreciationRuns } from './asset-depreciation-runs'
import { assets } from './assets'

export const assetDepreciationLogs = mysqlTable('asset_depreciation_logs', {
  id: int('id').primaryKey().autoincrement(),
  runId: int('run_id').notNull().references(() => assetDepreciationRuns.id),
  assetId: int('asset_id').notNull().references(() => assets.id),
  periodDate: date('period_date', { mode: 'string' }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  remainingAge: int('remaining_age').notNull(),
  remainingValue: decimal('remaining_value', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
