import { mysqlTable, varchar, char, date, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeFamilyTree = mysqlTable(
  'employee_family_tree',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    name: varchar('name', { length: 50 }),
    relation: varchar('relation', { length: 50 }),
    gender: char('gender', { length: 1 }),
    birthDate: date('birth_date', { mode: 'string' }),
    lastEducation: varchar('last_education', { length: 50 }),
    lastWork: varchar('last_work', { length: 50 }),
    lastInstitute: varchar('last_institute', { length: 50 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_family_tree_employee_idx').on(table.employeeId),
  })
)
