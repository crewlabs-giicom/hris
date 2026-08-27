import { mysqlTable, varchar, timestamp, int, date, decimal, text } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { manufacturers } from './manufacturers'
import { companies } from './companies'
import { rooms } from './rooms'
import { divisions } from './divisions'
import { users } from '../auth'

export const assets = mysqlTable('assets', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  purchaseFromDate: date('purchase_from_date', { mode: 'string' }).notNull(),
  purchaseToDate: date('purchase_to_date', { mode: 'string' }).notNull(),
  manufactureId: int('manufacture_id').notNull().references(() => manufacturers.id),
  economicAge: int('economic_age').notNull(),
  condition: varchar('condition', { length: 50 }).notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // asuransi, asset, sewa
  status: varchar('status', { length: 50 }).notNull(),
  ptId: int('pt_id').notNull().references(() => companies.id),
  location: varchar('location', { length: 255 }).notNull(),
  roomId: int('room_id').notNull().references(() => rooms.id),
  divisi: int('divisi').notNull().references(() => divisions.id),
  createdBy: int('created_by').notNull().references(() => users.id),
  updatedBy: int('updated_by').references(() => users.id),
  deletedBy: int('deleted_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
