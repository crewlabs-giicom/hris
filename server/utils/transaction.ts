import { createError } from 'h3'
import { useDb } from '~~/server/db'
import { auditLogs } from '~~/server/db/schema'

type Db = ReturnType<typeof useDb>

/**
 * Writes to the `audit_logs` table (schema already existed but nothing wrote to it —
 * see the former TODO in login.post.ts). Use after any sensitive create/update/delete.
 */
export async function writeAuditLog(
  db: Db,
  entry: {
    actorUserId?: number | null
    action: string
    targetType?: string
    targetId?: string
    metadata?: Record<string, unknown>
  }
) {
  await db.insert(auditLogs).values({
    uniqueId: crypto.randomUUID(),
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
  })
}

/**
 * Groundwork for future "Transaction" endpoints that carry an approval-style status
 * field (leave requests, etc.) — not wired to any route yet. Given a map of allowed
 * transitions, returns a guard that throws 400 on an illegal status change and writes
 * an audit log entry on success.
 */
export function defineStatusTransition<TStatus extends string>(config: {
  allowed: Record<TStatus, TStatus[]>
  action: string
}) {
  return async function transition(
    db: Db,
    args: { currentStatus: TStatus; nextStatus: TStatus; actorUserId: number; targetType: string; targetId: string }
  ) {
    const allowedNext = config.allowed[args.currentStatus] ?? []
    if (!allowedNext.includes(args.nextStatus)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot transition from "${args.currentStatus}" to "${args.nextStatus}"`,
      })
    }

    await writeAuditLog(db, {
      actorUserId: args.actorUserId,
      action: config.action,
      targetType: args.targetType,
      targetId: args.targetId,
      metadata: { from: args.currentStatus, to: args.nextStatus },
    })
  }
}
