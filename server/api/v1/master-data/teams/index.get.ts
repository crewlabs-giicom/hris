import { z } from 'zod'
import { eq, sql, like, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { teams, employees } from '~~/server/db/schema'
import { createListHandler } from '~~/server/utils/crud'

const leader = alias(employees, 'leader')
const pic = alias(employees, 'pic')

export default createListHandler({
  table: teams,
  idColumn: teams.id,
  permissions: { view: 'teams.view', create: 'teams.manage', update: 'teams.manage', delete: 'teams.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), leaderId: z.coerce.number().int().optional(), picId: z.coerce.number().int().optional() }),
  updateSchema: z.object({
    name: z.string().min(1).max(100).optional(),
    leaderId: z.coerce.number().int().optional().nullable(),
    picId: z.coerce.number().int().optional().nullable(),
  }),
  searchColumn: teams.name,
  sortWhitelist: { name: teams.name, createdAt: teams.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },

  listQuery: async (db, { where, orderBy, limit, offset }) => {
    return db
      .select({
        id: teams.id,
        name: teams.name,
        leaderId: teams.leaderId,
        leaderName: leader.fullName,
        picId: teams.picId,
        picName: pic.fullName,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
      })
      .from(teams)
      .leftJoin(leader, eq(leader.id, teams.leaderId))
      .leftJoin(pic, eq(pic.id, teams.picId))
      .where(where ?? (sql`1=1` as SQL))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)
  },
})
