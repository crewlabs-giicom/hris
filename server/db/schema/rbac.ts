import { mysqlTable, varchar, timestamp, primaryKey, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull().unique(),
  guardName: varchar('guard_name', { length: 50 }).notNull().default('web'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const permissions = mysqlTable('permissions', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 150 }).notNull().unique(),
  guardName: varchar('guard_name', { length: 50 }).notNull().default('web'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const roleHasPermissions = mysqlTable(
  'role_has_permissions',
  {
    roleId: int('role_id').notNull().references(() => roles.id),
    permissionId: int('permission_id').notNull().references(() => permissions.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  })
)

export const modelHasRoles = mysqlTable(
  'model_has_roles',
  {
    roleId: int('role_id').notNull().references(() => roles.id),
    modelId: int('model_id').notNull(),
    modelType: varchar('model_type', { length: 100 }).notNull().default('user'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.modelId, table.modelType] }),
  })
)

export const modelHasPermissions = mysqlTable(
  'model_has_permissions',
  {
    permissionId: int('permission_id').notNull().references(() => permissions.id),
    modelId: int('model_id').notNull(),
    modelType: varchar('model_type', { length: 100 }).notNull().default('user'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.permissionId, table.modelId, table.modelType] }),
  })
)
