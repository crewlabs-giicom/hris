import { mysqlTable, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assets } from './assets'
import { employees } from '../employee/employees'

export const assetHasEmployees = mysqlTable('asset_has_employees', {
  id: int('id').primaryKey().autoincrement(),
  assetId: int('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  employeeId: int('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
