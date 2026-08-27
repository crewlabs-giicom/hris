import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const companies = mysqlTable('companies', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
