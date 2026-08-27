import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { teams, teamHasUsers } from '~~/server/db/schema'
import { createDeleteHandler } from '~~/server/utils/crud'

export default createDeleteHandler({
  table: teams,
  idColumn: teams.id,
  permissions: { view: 'teams.view', create: 'teams.manage', update: 'teams.manage', delete: 'teams.manage' },
  createSchema: z.object({ name: z.string().min(1).max(100), leaderId: z.coerce.number().int().optional(), picId: z.coerce.number().int().optional() }),
  updateSchema: z.object({
    name: z.string().min(1).max(100).optional(),
    leaderId: z.coerce.number().int().optional().nullable(),
    picId: z.coerce.number().int().optional().nullable(),
  }),
  sortWhitelist: { name: teams.name, createdAt: teams.createdAt },
  defaultSort: { column: 'name', dir: 'asc' },
  beforeDelete: async (db, id) => {
    // id will be a number here
    const [{ employeeCount }] = await db
      .select({ employeeCount: sql<number>`count(*)` })
      .from(teamHasUsers)
      .where(eq(teamHasUsers.teamId, Number(id)))

    if (Number(employeeCount) > 0) {
      throw createError({ statusCode: 400, statusMessage: `Team is still used by ${employeeCount} employee(s)` })
    }
  },
})
