import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'
import { useDb } from '../db'
import { apiClients } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyTokenHash } from './password'

/**
 * Verifies the `x-api-key` header against the api_clients table.
 * Used to authenticate consumer apps (Backbone, Ticketing) calling
 * server-to-server endpoints — kept separate from user JWTs so each
 * consumer can be tracked and revoked independently.
 */
export async function requireApiClient(event: H3Event) {
  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) {
    throw createError({ statusCode: 401, statusMessage: 'Missing x-api-key header' })
  }

  const db = useDb()
  const clients = await db.select().from(apiClients).where(eq(apiClients.isActive, true))

  for (const client of clients) {
    if (await verifyTokenHash(apiKey, client.apiKeyHash)) {
      return client
    }
  }

  throw createError({ statusCode: 401, statusMessage: 'Invalid API key' })
}
