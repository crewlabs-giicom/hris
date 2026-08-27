import { mysqlTable, varchar, date, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeFamily = mysqlTable(
  'employee_family',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    name: varchar('name', { length: 255 }),
    birthDate: date('birth_date', { mode: 'string' }),
    familyRelation: varchar('family_relation', { length: 25 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_family_employee_idx').on(table.employeeId),
  })
)
