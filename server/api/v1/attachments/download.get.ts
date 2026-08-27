import { getQuery, createError, setHeader } from 'h3'
import { readFile } from 'node:fs/promises'
import { join, resolve, basename } from 'node:path'
import { existsSync } from 'node:fs'
import { requireAuth } from '~~/server/utils/requireAuth'
import { STORAGE_ROOT } from '~~/server/utils/upload'

export default defineEventHandler(async (event) => {
  // Ensure the user is authenticated
  requireAuth(event)

  const query = getQuery(event)
  const fileRelativePath = query.file as string
  if (!fileRelativePath) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file parameter' })
  }

  // Prevent directory traversal: ensure the resolved path remains under STORAGE_ROOT
  const absolutePath = resolve(STORAGE_ROOT, fileRelativePath)
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  if (!existsSync(absolutePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found on disk' })
  }

  const buffer = await readFile(absolutePath).catch(() => {
    throw createError({ statusCode: 500, statusMessage: 'Failed to read file' })
  })

  // Basic MIME type detection
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    pdf: 'application/pdf',
  }
  const ext = absolutePath.split('.').pop()?.toLowerCase() || ''
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `inline; filename="${encodeURIComponent(basename(absolutePath))}"`)

  return buffer
})
