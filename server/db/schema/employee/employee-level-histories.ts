import { mysqlTable, varchar, date, text, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { levels } from '../master-data'
import { employees } from './employees'

export const employeeLevelHistories = mysqlTable(
  'employee_level_histories',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    levelId: int('level_id').notNull().references(() => levels.id),
    effectiveDate: date('effective_date', { mode: 'string' }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    employeeIdx: index('employee_level_histories_employee_idx').on(table.employeeId),
  })
)
