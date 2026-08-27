import { mysqlTable, varchar, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeEducation = mysqlTable(
  'employee_education',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    degree: varchar('degree', { length: 255 }),
    schoolName: varchar('school_name', { length: 255 }),
    schoolYear: varchar('school_year', { length: 255 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_education_employee_idx').on(table.employeeId),
  })
)
