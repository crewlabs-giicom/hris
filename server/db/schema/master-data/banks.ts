import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const banks = mysqlTable('banks', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
