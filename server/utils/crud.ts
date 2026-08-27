import { getQuery, getRouterParam, createError, readValidatedBody, defineEventHandler } from 'h3'
import { eq, ne, and, like, inArray, sql, asc, desc, isNull, type SQL } from 'drizzle-orm'
import type { MySqlTable, AnyMySqlColumn } from 'drizzle-orm/mysql-core'
import type { ZodTypeAny, z } from 'zod'
import { useDb } from '~~/server/db'
import { requireAuth } from './requireAuth'
import { requirePermission } from './rbac'

type Db = ReturnType<typeof useDb>

/**
 * Generic "Master data" CRUD factory. Each generated handler still lives in its own
 * route file (Nitro requires one file per route) — the file just calls the matching
 * `create*Handler(config)` instead of re-writing requireAuth/requirePermission/zod/
 * query/response boilerplate from scratch. Cases that don't fit the plain-table shape
 * (joins, pivot tables, extra guards) plug in via the optional hooks/overrides below
 * rather than forking the whole handler.
 */
export interface CrudConfig<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny> {
  table: MySqlTable
  idColumn: AnyMySqlColumn
  permissions: { view: string; create: string; update: string; delete: string }
  createSchema: TCreate
  updateSchema: TUpdate

  /** Set to true if the ID is an auto-incrementing integer */
  autoIncrement?: boolean

  /** Column matched against `?search=` (e.g. name/email). Omit to disable search. */
  searchColumn?: AnyMySqlColumn
  /** Maps allowed `?sortBy=` values to actual columns — anything not listed here is rejected (400). */
  sortWhitelist: Record<string, AnyMySqlColumn>
  defaultSort: { column: string; dir: 'asc' | 'desc' }

  /** Column checked for uniqueness before create/update (e.g. name/email). */
  uniqueColumn?: AnyMySqlColumn
  uniqueMessage?: string

  /** Override the default `select().from(table)` list query — needed for joins (e.g. Roles + permissionCount). */
  listQuery?: (db: Db, args: { where?: SQL; orderBy: SQL; limit: number; offset: number }) => Promise<any[]>
  /** Override the default count query — must match the filtering semantics of `listQuery`. */
  countQuery?: (db: Db, where?: SQL) => Promise<number>

  beforeCreate?: (db: Db, body: z.infer<TCreate>) => Promise<void> | void
  /** Runs after the row is inserted — use for pivot-table inserts (e.g. role permissions). */
  afterCreate?: (db: Db, id: string | number, body: z.infer<TCreate>) => Promise<void> | void
  /** Runs after the row is updated — use for pivot-table full-replace. */
  afterUpdate?: (db: Db, id: string | number, body: z.infer<TUpdate>) => Promise<void> | void
  /** Runs before the row is deleted — throw createError(...) here to block deletion. */
  beforeDelete?: (db: Db, id: string | number, row: any) => Promise<void> | void

  /** Attach extra fields to a row before it's returned (e.g. permissionIds, roles). */
  serialize?: (db: Db, row: any) => Promise<Record<string, unknown>> | Record<string, unknown>

  /**
   * Whitelist of body keys that map to real table columns — needed when the create/update
   * schema also carries relation fields (e.g. Roles' `permissionIds`) that aren't columns
   * on `table` and must be handled by beforeCreate/afterCreate/afterUpdate instead.
   * Omit when every schema key is a real column.
   */
  columnFields?: string[]
}

function isAutoIncrement(config: CrudConfig<any, any>): boolean {
  if (config.autoIncrement) return true
  const colType = (config.idColumn as any).columnType || ''
  return colType.includes('Integer') || colType.includes('Serial') || colType.includes('int')
}

function pickColumnFields(body: Record<string, unknown>, columnFields?: string[]) {
  if (!columnFields) return body
  return Object.fromEntries(Object.entries(body).filter(([k]) => columnFields.includes(k)))
}

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10))
  return { page, perPage }
}

function resolveSort(config: Pick<CrudConfig<any, any>, 'sortWhitelist' | 'defaultSort'>, query: Record<string, unknown>) {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : config.defaultSort.column
  const column = config.sortWhitelist[sortBy]
  if (!column) {
    throw createError({ statusCode: 400, statusMessage: `Invalid sortBy: ${sortBy}` })
  }
  const sortDir = query.sortDir === 'asc' || query.sortDir === 'desc' ? query.sortDir : config.defaultSort.dir
  return { orderBy: sortDir === 'asc' ? asc(column) : desc(column), sortBy, sortDir }
}

function getWhereClause(config: CrudConfig<any, any>, customWhere?: SQL) {
  const conditions: SQL[] = []
  if ('deletedAt' in config.table) {
    conditions.push(isNull((config.table as any).deletedAt))
  }
  if (customWhere) {
    conditions.push(customWhere)
  }
  return conditions.length > 0 ? and(...conditions) : undefined
}

export function createListHandler<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny>(
  config: CrudConfig<TCreate, TUpdate>
) {
  return defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const db = useDb()
    await requirePermission(event, user, db, config.permissions.view)

    const query = getQuery(event)
    const { orderBy } = resolveSort(config, query)

    // Global select support: `?ids=a,b,c` resolves specific rows by id (e.g. a searchable
    // select's pre-filled value on edit, or chips for a multi-select) instead of paginating —
    // skips search/pagination/sort entirely. Available on every resource for free since they
    // all go through this same factory.
    if (typeof query.ids === 'string') {
      const ids = query.ids
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
      if (!ids.length) {
        return { data: [], meta: { page: 1, perPage: 0, total: 0 } }
      }
      const idsWhere = getWhereClause(
        config,
        inArray(config.idColumn, isAutoIncrement(config) ? ids.map(Number) : ids)
      )
      const rows = config.listQuery
        ? await config.listQuery(db, { where: idsWhere, orderBy, limit: ids.length, offset: 0 })
        : await db.select().from(config.table).where(idsWhere ?? sql`1=1`).limit(ids.length)
      const data = config.serialize ? await Promise.all(rows.map((row) => config.serialize!(db, row))) : rows
      return { data, meta: { page: 1, perPage: ids.length, total: data.length } }
    }

    const { page, perPage } = parsePagination(query)
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const where = getWhereClause(
      config,
      search && config.searchColumn ? like(config.searchColumn, `%${search}%`) : undefined
    )
    const offset = (page - 1) * perPage

    const rows = config.listQuery
      ? await config.listQuery(db, { where, orderBy, limit: perPage, offset })
      : await db.select().from(config.table).where(where ?? sql`1=1`).orderBy(orderBy).limit(perPage).offset(offset)

    const total = config.countQuery
      ? await config.countQuery(db, where)
      : Number(
          (await db.select({ count: sql<number>`count(*)` }).from(config.table).where(where ?? sql`1=1`))[0]?.count ?? 0
        )

    const data = config.serialize ? await Promise.all(rows.map((row) => config.serialize!(db, row))) : rows

    return { data, meta: { page, perPage, total } }
  })
}

export function createDetailHandler<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny>(
  config: CrudConfig<TCreate, TUpdate>
) {
  return defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const db = useDb()
    await requirePermission(event, user, db, config.permissions.view)

    const id = getRouterParam(event, 'id') as string
    const idValue = isAutoIncrement(config) ? Number(id) : id
    const [row] = await db.select().from(config.table).where(getWhereClause(config, eq(config.idColumn, idValue))).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    return { data: config.serialize ? await config.serialize(db, row) : row }
  })
}

export function createCreateHandler<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny>(
  config: CrudConfig<TCreate, TUpdate>
) {
  return defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const db = useDb()
    await requirePermission(event, user, db, config.permissions.create)

    const body = await readValidatedBody(event, config.createSchema.parse)

    if (config.uniqueColumn) {
      const value = (body as Record<string, unknown>)[getColumnKey(config.uniqueColumn)]
      const [existing] = await db.select().from(config.table).where(getWhereClause(config, eq(config.uniqueColumn, value))).limit(1)
      if (existing) {
        throw createError({ statusCode: 409, statusMessage: config.uniqueMessage ?? 'Value already exists' })
      }
    }

    if (config.beforeCreate) await config.beforeCreate(db, body)

    let insertId: any
    if (isAutoIncrement(config)) {
      const [result] = await db.insert(config.table).values(pickColumnFields(body as Record<string, unknown>, config.columnFields))
      insertId = (result as any).insertId
    } else {
      const id = crypto.randomUUID()
      await db.insert(config.table).values({ id, ...pickColumnFields(body as Record<string, unknown>, config.columnFields) })
      insertId = id
    }

    if (config.afterCreate) await config.afterCreate(db, insertId, body)

    const [created] = await db.select().from(config.table).where(getWhereClause(config, eq(config.idColumn, insertId))).limit(1)
    return { data: config.serialize ? await config.serialize(db, created) : created }
  })
}

export function createUpdateHandler<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny>(
  config: CrudConfig<TCreate, TUpdate>
) {
  return defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const db = useDb()
    await requirePermission(event, user, db, config.permissions.update)

    const id = getRouterParam(event, 'id') as string
    const idValue = isAutoIncrement(config) ? Number(id) : id
    const body = await readValidatedBody(event, config.updateSchema.parse)

    const [row] = await db.select().from(config.table).where(getWhereClause(config, eq(config.idColumn, idValue))).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    if (config.uniqueColumn) {
      const key = getColumnKey(config.uniqueColumn)
      const value = (body as Record<string, unknown>)[key]
      if (value !== undefined) {
        const [existing] = await db
          .select()
          .from(config.table)
          .where(getWhereClause(config, and(eq(config.uniqueColumn, value), ne(config.idColumn, idValue))))
          .limit(1)
        if (existing) {
          throw createError({ statusCode: 409, statusMessage: config.uniqueMessage ?? 'Value already exists' })
        }
      }
    }

    const columnUpdates = Object.fromEntries(
      Object.entries(pickColumnFields(body as Record<string, unknown>, config.columnFields)).filter(
        ([, v]) => v !== undefined
      )
    )
    if (Object.keys(columnUpdates).length) {
      await db.update(config.table).set(columnUpdates).where(eq(config.idColumn, idValue))
    }

    if (config.afterUpdate) await config.afterUpdate(db, idValue, body)

    const [updated] = await db.select().from(config.table).where(getWhereClause(config, eq(config.idColumn, idValue))).limit(1)
    return { data: config.serialize ? await config.serialize(db, updated) : updated }
  })
}

export function createDeleteHandler<TCreate extends ZodTypeAny, TUpdate extends ZodTypeAny>(
  config: CrudConfig<TCreate, TUpdate>
) {
  return defineEventHandler(async (event) => {
    const user = requireAuth(event)
    const db = useDb()
    await requirePermission(event, user, db, config.permissions.delete)

    const id = getRouterParam(event, 'id') as string
    const idValue = isAutoIncrement(config) ? Number(id) : id
    const [row] = await db.select().from(config.table).where(getWhereClause(config, eq(config.idColumn, idValue))).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    if (config.beforeDelete) await config.beforeDelete(db, idValue, row)

    if ('deletedAt' in config.table) {
      await db.update(config.table).set({ deletedAt: new Date() } as any).where(eq(config.idColumn, idValue))
    } else {
      await db.delete(config.table).where(eq(config.idColumn, idValue))
    }

    return { data: { id: idValue } }
  })
}

// Drizzle columns don't expose a public "js property name" API, but every column
// carries its declared field name at runtime — used to read the matching key off
// a parsed zod body (e.g. uniqueColumn = permissions.name -> body.name).
function getColumnKey(column: AnyMySqlColumn): string {
  return (column as unknown as { name: string }).name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}
