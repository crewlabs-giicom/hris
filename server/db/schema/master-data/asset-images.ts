import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assets } from './assets'

export const assetImages = mysqlTable('asset_images', {
  id: int('id').primaryKey().autoincrement(),
  assetId: int('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  attachment: varchar('attachment', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
