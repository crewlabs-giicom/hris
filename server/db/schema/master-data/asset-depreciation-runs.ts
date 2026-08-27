import { mysqlTable, int, date, decimal, timestamp } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { users } from '../auth'

export const assetDepreciationRuns = mysqlTable('asset_depreciation_runs', {
  id: int('id').primaryKey().autoincrement(),
  periodDate: date('period_date', { mode: 'string' }).notNull(),
  totalAssets: int('total_assets').notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
