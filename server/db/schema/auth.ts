import { mysqlTable, varchar, timestamp, mysqlEnum, boolean, index, int } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const userRoleEnum = ['employee', 'approver', 'hr_admin', 'super_admin'] as const

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: mysqlEnum('role', userRoleEnum).notNull().default('employee'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const refreshTokens = mysqlTable(
  'refresh_tokens',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    userId: int('user_id').notNull().references(() => users.id),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    revokedAt: timestamp('revoked_at'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index('refresh_tokens_user_idx').on(table.userId),
  })
)

export const activationTokens = mysqlTable('activation_tokens', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  userId: int('user_id').notNull().references(() => users.id),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const apiClients = mysqlTable('api_clients', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  apiKeyHash: varchar('api_key_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: int('id').primaryKey().autoincrement(),
    uniqueId: varchar('unique_id', { length: 36 }).notNull().$defaultFn(() => crypto.randomUUID()),
    actorUserId: int('actor_user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 100 }),
    targetId: varchar('target_id', { length: 36 }),
    metadata: varchar('metadata', { length: 2000 }),
    createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    actorIdx: index('audit_logs_actor_idx').on(table.actorUserId),
    targetIdx: index('audit_logs_target_idx').on(table.targetType, table.targetId),
  })
)
