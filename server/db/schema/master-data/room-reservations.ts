import { mysqlTable, varchar, timestamp, int, boolean, date } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from '../employee/employees'
import { rooms } from './rooms'

export const roomReservations = mysqlTable('room_reservations', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  employeeId: int('employee_id').notNull().references(() => employees.id),
  roomId: int('room_id').notNull().references(() => rooms.id),
  type: boolean('type').notNull(), // false = Standard, true = Event
  date: date('date', { mode: 'string' }).notNull(),
  clockStart: varchar('clock_start', { length: 8 }).notNull(),
  clockEnd: varchar('clock_end', { length: 8 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdBy: int('created_by').notNull().references(() => employees.id),
  updatedBy: int('updated_by').references(() => employees.id),
  deletedBy: int('deleted_by').references(() => employees.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  deletedAt: timestamp('deleted_at'),
})
