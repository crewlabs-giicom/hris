import { mysqlTable, varchar, timestamp, int, time } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const shifts = mysqlTable('shift', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  shiftIn: time('shift_in').notNull(),
  shiftOut: time('shift_out').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
