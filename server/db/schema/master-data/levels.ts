import { mysqlTable, varchar, decimal, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const levels = mysqlTable('levels', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 50 }).notNull().unique(),
  baseSalary: decimal('base_salary', { precision: 20, scale: 0 }).notNull().default('0'),
  mealAllowance: decimal('meal_allowance', { precision: 20, scale: 0 }).notNull().default('0'),
  otherAllowance: decimal('other_allowance', { precision: 20, scale: 0 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
