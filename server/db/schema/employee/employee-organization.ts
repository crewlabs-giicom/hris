import { mysqlTable, varchar, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeOrganization = mysqlTable(
  'employee_organization',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    name: varchar('name', { length: 50 }),
    position: varchar('position', { length: 50 }),
    organizationLength: varchar('organization_length', { length: 50 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_organization_employee_idx').on(table.employeeId),
  })
)
