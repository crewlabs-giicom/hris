import { mysqlTable, varchar, timestamp, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'

export const employeeEmergencyContacts = mysqlTable(
  'employee_emergency_contacts',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    employeeId: int('employee_id').notNull().references(() => employees.id),
    name: varchar('name', { length: 255 }),
    relation: varchar('relation', { length: 255 }),
    phone: varchar('phone', { length: 255 }),
    address: varchar('address', { length: 255 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
  },
  (table) => ({
    employeeIdx: index('employee_emergency_contacts_employee_idx').on(table.employeeId),
  })
)
