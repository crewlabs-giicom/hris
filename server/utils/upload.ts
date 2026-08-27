import { readMultipartFormData, createError, type H3Event } from 'h3'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

// Project-root-relative, outside `public/` on purpose — files are only reachable through
// an authenticated download route (see server/api/v1/employees/[id]/documents/*), never
// served as static assets.
export const STORAGE_ROOT = join(process.cwd(), 'storage')

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
}

export interface SavedUpload {
  fileName: string
  filePath: string // absolute path on disk
  mimeType: string
  fileSize: number
  /** Other (non-file) fields sent alongside the file in the same multipart body. */
  fields: Record<string, string>
}

/**
 * Reads a single-file multipart upload from `event`, validates it, and writes it to
 * `storage/<subdir>/`. Used by both the employee-document and employee-photo endpoints —
 * keeps validation/storage-path rules in one place instead of duplicated per route.
 * The request body can only be read once, so this also returns any other text fields
 * (e.g. `documentType`) sent in the same multipart body — callers must not read the body again.
 */
export async function saveUploadedFile(
  event: H3Event,
  opts: { subdir: string; allowedMime?: string[]; maxSizeBytes?: number; fieldName?: string }
): Promise<SavedUpload> {
  const allowedMime = opts.allowedMime ?? ['image/jpeg', 'image/png', 'application/pdf']
  const maxSizeBytes = opts.maxSizeBytes ?? 5 * 1024 * 1024
  const fieldName = opts.fieldName ?? 'file'

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }
  const filePart = parts.find((p) => p.name === fieldName && p.filename)
  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: `Missing file field "${fieldName}"` })
  }

  const mimeType = filePart.type ?? 'application/octet-stream'
  if (!allowedMime.includes(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: `Unsupported file type: ${mimeType}` })
  }
  if (filePart.data.length > maxSizeBytes) {
    throw createError({ statusCode: 400, statusMessage: `File exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit` })
  }

  const ext = EXT_BY_MIME[mimeType] ?? 'bin'
  const targetDir = join(STORAGE_ROOT, opts.subdir)
  await mkdir(targetDir, { recursive: true })

  const diskName = `${crypto.randomUUID()}.${ext}`
  const filePath = join(targetDir, diskName)
  await writeFile(filePath, filePart.data)

  const fields: Record<string, string> = {}
  for (const part of parts) {
    if (!part.filename && part.name) fields[part.name] = part.data.toString('utf-8')
  }

  return {
    fileName: filePart.filename ?? diskName,
    filePath,
    mimeType,
    fileSize: filePart.data.length,
    fields,
  }
}

export async function deleteUploadedFile(filePath: string) {
  try {
    await unlink(filePath)
  } catch {
    // already gone — fine, nothing to clean up
  }
}
