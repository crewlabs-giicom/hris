import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

let pool: mysql.Pool | undefined
let dbInstance: MySql2Database<typeof schema> & { $client: any } | undefined

/**
 * Lazily-created singleton connection pool + Drizzle instance.
 * Reused across requests instead of opening a new connection per request.
 */
export function useDb(): MySql2Database<typeof schema> & { $client: any } {
  if (dbInstance) return dbInstance

  const config = useRuntimeConfig()

  pool = mysql.createPool({
    host: config.dbHost,
    port: Number(config.dbPort),
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    connectionLimit: 10,
    waitForConnections: true,
  })

  const instance = drizzle(pool, { schema, mode: 'default' })
  dbInstance = instance
  return instance
}
