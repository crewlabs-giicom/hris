import { mysqlTable, varchar, timestamp, int, date, decimal, text } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { companies } from './companies'
import { employees } from '../employee/employees'
import { users } from '../auth'

export const assetRequests = mysqlTable('asset_requests', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 100 }).notNull().unique(),
  employeeId: int('employee_id').notNull().references(() => employees.id),
  category: varchar('category', { length: 50 }).notNull(), // 'penambahan', 'pengganti'
  ptId: int('pt_id').notNull().references(() => companies.id),
  marketplace: varchar('marketplace', { length: 100 }).notNull(), // 'shopee', 'tiktok', 'non marketplace'
  bank: varchar('bank', { length: 50 }).notNull(), // 'bca', 'mandiri'
  rekening: varchar('rekening', { length: 100 }).notNull(), // account number / VA
  paymentTo: varchar('payment_to', { length: 255 }).notNull(),
  financeId: int('finance_id').notNull().references(() => employees.id),
  requestDate: date('request_date', { mode: 'string' }).notNull(),
  paymentDate: date('payment_date', { mode: 'string' }),
  price: decimal('price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'approved', 'rejected', 'completed'
  createdBy: int('created_by').notNull().references(() => users.id),
  updatedBy: int('updated_by').references(() => users.id),
  deletedBy: int('deleted_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
