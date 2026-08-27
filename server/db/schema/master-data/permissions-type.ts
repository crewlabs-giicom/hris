import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const permissionsType = mysqlTable('permissions_type', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
