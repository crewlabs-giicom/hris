import { mysqlTable, varchar, timestamp, int, date, text, index, foreignKey } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'
import { shifts } from '../master-data'
import { users } from '../auth'

export const schedules = mysqlTable(
  'schedule',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    shiftId: int('shift_id')
      .notNull()
      .references(() => shifts.id),
    isFix: int('is_fix').notNull().default(0), // 1 = Yes, 0 = No
    isOff: int('is_off').notNull().default(0), // 1 = Yes, 0 = No
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to').notNull(),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('schedule_employee_idx').on(table.employeeId),
    shiftIdx: index('schedule_shift_idx').on(table.shiftId),
  })
)

export const scheduleAdjustments = mysqlTable(
  'schedule_adjustment',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    shiftId: int('shift_id')
      .notNull()
      .references(() => shifts.id),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    isOff: int('is_off').notNull().default(0), // 1 = Yes, 0 = No
    adjustmentDate: date('adjustment_date').notNull(),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('schedule_adjustment_employee_idx').on(table.employeeId),
    shiftIdx: index('schedule_adjustment_shift_idx').on(table.shiftId),
  })
)

export const manualAttendances = mysqlTable(
  'manual_attendances',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    manualAttendanceType: varchar('manual_attendance_type', { length: 100 }).notNull(), // "Manual Absen" / "Telat Masuk dan Punishment"
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    clockIn: varchar('clock_in', { length: 10 }), // Format "HH:mm"
    clockOut: varchar('clock_out', { length: 10 }), // Format "HH:mm"
    isLate: int('is_late').notNull().default(0), // 1 = Yes, 0 = No
    freeAttendances: varchar('free_attendances', { length: 10 }).notNull().default('No'), // "Yes" / "No"
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('manual_attendances_employee_idx').on(table.employeeId),
  })
)

export const manualAttendanceAttachments = mysqlTable(
  'manual_attendance_attachments',
  {
    id: int('id').primaryKey().autoincrement(),
    manualAttendanceId: int('manual_attendance_id').notNull(),
    attachment: varchar('attachment', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    attendanceIdx: index('manual_attendance_attachments_attendance_idx').on(table.manualAttendanceId),
    // Nama FK dipendekkan manual; nama bawaan drizzle 76 karakter, lewat batas 64 MySQL.
    manualAttendanceFk: foreignKey({
      columns: [table.manualAttendanceId],
      foreignColumns: [manualAttendances.id],
      name: 'manual_att_attach_manual_attendance_id_fk',
    }),
  })
)
