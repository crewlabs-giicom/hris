import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const rooms = mysqlTable('rooms', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  ruko: varchar('ruko', { length: 255 }).notNull(),
  floor: int('floor').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
