import { mysqlTable, varchar, timestamp, int, foreignKey } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assetRequestDetails } from './asset-request-details'

export const assetRequestDetailImages = mysqlTable('asset_request_detail_images', {
  id: int('id').primaryKey().autoincrement(),
  assetRequestDetailId: int('asset_request_detail_id').notNull(),
  attachment: varchar('attachment', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
}, (table) => ({
  fkDetail: foreignKey({
    columns: [table.assetRequestDetailId],
    foreignColumns: [assetRequestDetails.id],
    name: 'asset_req_det_img_det_id_fk',
  }).onDelete('cascade'),
}))
