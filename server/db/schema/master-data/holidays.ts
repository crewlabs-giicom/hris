import { mysqlTable, varchar, timestamp, int, date } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const holidays = mysqlTable('holidays', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
