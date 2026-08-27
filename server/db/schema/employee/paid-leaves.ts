import { mysqlTable, varchar, timestamp, int, date, text, index, mysqlEnum } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'
import { users } from '../auth'

export const employeePaidLeaves = mysqlTable(
  'employee_paid_leaves',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    paidLeaveType: mysqlEnum('paid_leave_type', ['cuti tahunan', 'cuti khusus']).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }).notNull(),
    paidLeaveCount: int('paid_leave_count').notNull(),
    dayOffCount: int('day_off_count').notNull(),
    description: text('description').notNull(),
    personResponsibleId: int('person_responsible_id').references(() => employees.id),
    task: text('task'),
    address: text('address'),
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
    employeeIdx: index('employee_paid_leaves_employee_idx').on(table.employeeId),
    statusIdx: index('employee_paid_leaves_status_idx').on(table.status),
  })
)
