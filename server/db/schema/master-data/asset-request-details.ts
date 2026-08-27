import { mysqlTable, varchar, timestamp, int, decimal } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { assetRequests } from './asset-requests'
import { manufacturers } from './manufacturers'
import { rooms } from './rooms'

export const assetRequestDetails = mysqlTable('asset_request_details', {
  id: int('id').primaryKey().autoincrement(),
  assetRequestId: int('asset_request_id').notNull().references(() => assetRequests.id, { onDelete: 'cascade' }),
  arfNumber: varchar('arf_number', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  quantity: int('quantity').notNull().default(1),
  totalPrice: decimal('total_price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  economicAge: int('economic_age').notNull().default(1),
  condition: varchar('condition', { length: 50 }).notNull().default('new'), // 'new', 'good', 'old'
  manufacturerId: int('manufacturer_id').notNull().references(() => manufacturers.id),
  roomId: int('room_id').notNull().references(() => rooms.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
