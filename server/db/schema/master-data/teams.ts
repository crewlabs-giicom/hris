import { mysqlTable, varchar, timestamp, int, primaryKey } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
import { users } from '../auth'

export const teams = mysqlTable('teams', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  leaderId: int('leader_id'),
  picId: int('pic_id'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const teamHasUsers = mysqlTable(
  'team_has_users',
  {
    teamId: int('team_id').notNull().references(() => teams.id),
    userId: int('user_id').notNull().references(() => users.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
  })
)
