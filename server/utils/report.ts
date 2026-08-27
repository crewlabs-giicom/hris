import type { H3Event } from 'h3'
import { getQuery, createError } from 'h3'

/**
 * Groundwork for future "Report" endpoints (attendance, payroll, etc.) — not wired to
 * any route yet. Parses the common ?dateFrom/?dateTo query shape every report needs.
 */
export function parseDateRangeQuery(event: H3Event, defaults?: { days: number }) {
  const query = getQuery(event)
  const days = defaults?.days ?? 30

  const dateTo = typeof query.dateTo === 'string' ? new Date(query.dateTo) : new Date()
  const dateFrom =
    typeof query.dateFrom === 'string' ? new Date(query.dateFrom) : new Date(dateTo.getTime() - days * 86_400_000)

  if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid dateFrom/dateTo' })
  }
  if (dateFrom > dateTo) {
    throw createError({ statusCode: 400, statusMessage: 'dateFrom must be before dateTo' })
  }

  return { dateFrom, dateTo }
}

/** Validates ?groupBy= against a whitelist, same rationale as the CRUD sort whitelist. */
export function parseGroupByQuery(event: H3Event, whitelist: string[], fallback: string) {
  const query = getQuery(event)
  const groupBy = typeof query.groupBy === 'string' ? query.groupBy : fallback
  if (!whitelist.includes(groupBy)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid groupBy: ${groupBy}` })
  }
  return groupBy
}

/** Minimal CSV export helper — good enough for admin "export" buttons on report tables. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const s = String(value ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))]
  return lines.join('\n')
}
