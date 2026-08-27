import { mysqlTable, int, varchar, decimal, date, timestamp, boolean, text, index } from 'drizzle-orm/mysql-core'
import { employees } from './employees'
import { permissionsType } from '../master-data/permissions-type'
import { users } from '../auth'

// 1. Table: employee_attendances
export const employeeAttendances = mysqlTable(
  'employee_attendances',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    shiftIn: varchar('shift_in', { length: 8 }), // HH:MM:SS
    shiftOut: varchar('shift_out', { length: 8 }),
    date: date('date', { mode: 'string' }).notNull(), // YYYY-MM-DD
    isOff: int('is_off').notNull().default(0),
    isLock: int('is_lock').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('employee_attendances_employee_idx').on(table.employeeId),
    dateIdx: index('employee_attendances_date_idx').on(table.date),
  })
)

// 2. Table: employee_attendance_details
export const employeeAttendanceDetails = mysqlTable(
  'employee_attendance_details',
  {
    id: int('id').primaryKey().autoincrement(),
    attendanceId: int('attendance_id')
      .notNull()
      .references(() => employeeAttendances.id, { onDelete: 'cascade' }),
    permissionTypeId: int('permission_type_id')
      .references(() => permissionsType.id),
    clock: varchar('clock', { length: 8 }).notNull(), // HH:MM:SS
    description: text('description'),
    dokumen: varchar('dokumen', { length: 255 }),
    location: varchar('location', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    attendanceIdx: index('employee_attendance_details_attendance_idx').on(table.attendanceId),
  })
)

// 3. Table: insentives
export const insentives = mysqlTable(
  'insentives',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    month: int('month').notNull(), // 1-12
    year: int('year').notNull(),
    type: varchar('type', { length: 100 }).notNull(), // 'Tambahan', 'insentif', 'laptop', 'ipad', 'klaim bpjs'
    amount: decimal('amount', { precision: 20, scale: 2 }).notNull().default('0.00'),
    description: text('description'),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('insentives_employee_idx').on(table.employeeId),
    periodIdx: index('insentives_period_idx').on(table.year, table.month),
  })
)

// 4. Table: deductions
export const deductions = mysqlTable(
  'deductions',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    month: int('month').notNull(), // 1-12
    year: int('year').notNull(),
    type: varchar('type', { length: 100 }).notNull(), // 'pengurangan gaji'
    amount: decimal('amount', { precision: 20, scale: 2 }).notNull().default('0.00'),
    description: text('description'),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('deductions_employee_idx').on(table.employeeId),
    periodIdx: index('deductions_period_idx').on(table.year, table.month),
  })
)

// 5. Table: attendance_consolidations
export const attendanceConsolidations = mysqlTable(
  'attendance_consolidations',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    month: int('month').notNull(),
    year: int('year').notNull(),
    
    // Counts
    sakit: int('sakit').notNull().default(0),
    izin: int('izin').notNull().default(0),
    cuti: int('cuti').notNull().default(0),
    cutiKhusus: int('cuti_khusus').notNull().default(0),
    telat: int('telat').notNull().default(0),
    potDa: int('pot_da').notNull().default(0),
    potJam: int('pot_jam').notNull().default(0), // in minutes
    
    // Ded. Amounts
    potJamRp: decimal('pot_jam_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    potDayRp: decimal('pot_day_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    potDaRp: decimal('pot_da_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    
    // Punishments
    punishmentTelat: int('punishment_telat').notNull().default(0),
    punishmentForm: int('punishment_form').notNull().default(0),
    punishmentAlpha: int('punishment_alpha').notNull().default(0),
    punishmentNoFinger: int('punishment_no_finger').notNull().default(0),
    punishmentFormLate: int('punishment_form_late').notNull().default(0),
    punishmentLateAttendance: int('punishment_late_attendance').notNull().default(0),
    
    // Punishment Amounts
    punishmentAlphaRp: decimal('punishment_alpha_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    punishmentNoFingerRp: decimal('punishment_no_finger_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    punishmentFormLateRp: decimal('punishment_form_late_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    punishmentLateAttendanceRp: decimal('punishment_late_attendance_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    punishmentRp: decimal('punishment_rp', { precision: 20, scale: 2 }).notNull().default('0.00'),
    totalPotongan: decimal('total_potongan', { precision: 20, scale: 2 }).notNull().default('0.00'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('attendance_consolidations_employee_idx').on(table.employeeId),
    periodIdx: index('attendance_consolidations_period_idx').on(table.year, table.month),
  })
)

// 6. Table: attendance_consolidation_days
export const attendanceConsolidationDays = mysqlTable(
  'attendance_consolidation_days',
  {
    id: int('id').primaryKey().autoincrement(),
    consolidationId: int('consolidation_id')
      .notNull()
      .references(() => attendanceConsolidations.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    
    clockIn: varchar('clock_in', { length: 8 }), // HH:MM:SS
    clockOut: varchar('clock_out', { length: 8 }),
    isOff: boolean('is_off').notNull().default(false),
    
    titleIn: varchar('title_in', { length: 100 }),
    titleOut: varchar('title_out', { length: 100 }),
    titlePunishment: text('title_punishment'),
    
    workHour: decimal('work_hour', { precision: 5, scale: 2 }),
    potJam: int('pot_jam'), // in minutes
    potRp: decimal('pot_rp', { precision: 20, scale: 2 }),
  },
  (table) => ({
    consolidationIdx: index('attendance_consolidation_days_consolidation_idx').on(table.consolidationId),
  })
)
