import { mysqlTable, varchar, timestamp, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assetRequests } from './asset-requests'

export const assetRequestImages = mysqlTable('asset_request_images', {
  id: int('id').primaryKey().autoincrement(),
  assetRequestId: int('asset_request_id').notNull().references(() => assetRequests.id, { onDelete: 'cascade' }),
  attachment: varchar('attachment', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})
