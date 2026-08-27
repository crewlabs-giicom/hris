import { and, desc, eq, lte } from 'drizzle-orm'
import type { useDb } from '~~/server/db'
import { employeeLevelHistories, levels } from '~~/server/db/schema'

type Db = ReturnType<typeof useDb>

/**
 * Resolves the level that was in effect for an employee as of a given date
 * (defaults to now) — the most recent employee_level_histories row whose
 * effectiveDate isn't in the future. Payroll will call this with the payroll
 * period's cutoff date once that module exists; keep this signature stable.
 */
export async function getCurrentLevel(db: Db, employeeId: string, asOfDate: Date = new Date()) {
  const asOfDateStr = asOfDate.toISOString().slice(0, 10)

  const [row] = await db
    .select({
      levelId: employeeLevelHistories.levelId,
      effectiveDate: employeeLevelHistories.effectiveDate,
      levelName: levels.name,
      baseSalary: levels.baseSalary,
      mealAllowance: levels.mealAllowance,
      otherAllowance: levels.otherAllowance,
    })
    .from(employeeLevelHistories)
    .innerJoin(levels, eq(employeeLevelHistories.levelId, levels.id))
    .where(and(eq(employeeLevelHistories.employeeId, employeeId), lte(employeeLevelHistories.effectiveDate, asOfDateStr)))
    .orderBy(desc(employeeLevelHistories.effectiveDate))
    .limit(1)

  return row ?? null
}
