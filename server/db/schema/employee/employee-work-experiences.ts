import { mysqlTable, varchar, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeWorkExperiences = mysqlTable(
  'employee_work_experiences',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    companyName: varchar('company_name', { length: 255 }),
    workPosition: varchar('work_position', { length: 255 }),
    workLength: varchar('work_length', { length: 255 }),
    salaryPerMonth: varchar('salary_per_month', { length: 100 }),
    reasonForLeaving: varchar('reason_for_leaving', { length: 255 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_work_experiences_employee_idx').on(table.employeeId),
  })
)
