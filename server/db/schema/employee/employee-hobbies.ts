import { mysqlTable, varchar, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeHobbies = mysqlTable(
  'employee_hobbies',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    hobby: varchar('hobby', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    employeeIdx: index('employee_hobbies_employee_idx').on(table.employeeId),
  })
)
