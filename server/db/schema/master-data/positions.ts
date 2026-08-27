import { mysqlTable, varchar, timestamp, uniqueIndex, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { departments } from './departments'

export const positions = mysqlTable(
  'positions',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    title: varchar('title', { length: 255 }).notNull(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    departmentId: int('department_id').references(() => departments.id),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    titleDepartmentIdx: uniqueIndex('positions_title_department_idx').on(table.title, table.departmentId),
  })
)
