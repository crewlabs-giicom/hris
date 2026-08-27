import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees } from '~~/server/db/schema'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const db = useDb()
  const [emp] = await db
    .select({
      id: employees.id,
      nik: employees.nik,
      fullName: employees.fullName,
    })
    .from(employees)
    .where(and(eq(employees.userId, user.sub), isNull(employees.deletedAt)))
    .limit(1)

  return { data: emp || null }
})
