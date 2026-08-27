import { mysqlTable, varchar, timestamp, int, datetime, text, index } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { permissionsType } from '../master-data'
import { employees } from './employees'
import { users } from '../auth'

export const employeePermissions = mysqlTable(
  'employee_permissions',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    permissionsTypeId: int('permissions_type_id')
      .notNull()
      .references(() => permissionsType.id),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    validFrom: datetime('valid_from').notNull(),
    validTo: datetime('valid_to').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedBy: int('deleted_by').references(() => users.id),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('employee_permissions_employee_idx').on(table.employeeId),
    permissionsTypeIdx: index('employee_permissions_type_idx').on(table.permissionsTypeId),
    statusIdx: index('employee_permissions_status_idx').on(table.status),
  })
)

export const permissionAttachments = mysqlTable(
  'permission_attachments',
  {
    id: int('id').primaryKey().autoincrement(),
    permissionId: int('permission_id')
      .notNull()
      .references(() => employeePermissions.id),
    attachment: varchar('attachment', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    permissionIdx: index('permission_attachments_permission_idx').on(table.permissionId),
  })
)
