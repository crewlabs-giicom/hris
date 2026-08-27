import { mysqlTable, varchar, timestamp, int, date, text, index, mysqlEnum } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { employees } from './employees'
import { users } from '../auth'

export const resignations = mysqlTable(
  'resignations',
  {
    id: int('id').primaryKey().autoincrement(),
    employeeId: int('employee_id')
      .notNull()
      .references(() => employees.id),
    resignationDate: date('resignation_date').notNull(),
    resignationType: varchar('resignation_type', { length: 100 }).notNull(), // Efektif Resign, Habis Kontrak, Freelance / Magang berakhir, Cancel join, Pemutusan Hub. Kerja
    resignationReason: text('resignation_reason').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    createdBy: int('created_by').references(() => users.id),
    updatedBy: int('updated_by').references(() => users.id),
    deletedBy: int('deleted_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    employeeIdx: index('resignations_employee_idx').on(table.employeeId),
    statusIdx: index('resignations_status_idx').on(table.status),
  })
)

export const resignationAssets = mysqlTable(
  'resignation_assets',
  {
    id: int('id').primaryKey().autoincrement(),
    resignationId: int('resignation_id')
      .notNull()
      .references(() => resignations.id),
    assetId: int('asset_id'),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    resignationIdx: index('resignation_assets_resignation_idx').on(table.resignationId),
  })
)

export const resignationTasks = mysqlTable(
  'resignation_tasks',
  {
    id: int('id').primaryKey().autoincrement(),
    resignationId: int('resignation_id')
      .notNull()
      .references(() => resignations.id),
    task: text('task').notNull(),
    type: mysqlEnum('type', ['soft copy', 'hard copy']).notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow(),
  },
  (table) => ({
    resignationIdx: index('resignation_tasks_resignation_idx').on(table.resignationId),
  })
)
