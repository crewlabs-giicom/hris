import { getRouterParam, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { employees, employeeDocuments } from '~~/server/db/schema'
import { requireAuth, requireRole } from '~~/server/utils/requireAuth'
import { saveUploadedFile, deleteUploadedFile } from '~~/server/utils/upload'
import { extractKtpFields } from '~~/server/utils/ktpOcr'

const DOCUMENT_TYPES = ['ktp', 'bpjs', 'npwp', 'bank_account'] as const

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  requireRole(user, ['hr_admin', 'super_admin'])

  const employeeId = getRouterParam(event, 'id') as string
  const db = useDb()

  const isNumberId = /^\d+$/.test(employeeId)
  const idFilter = isNumberId ? eq(employees.id, Number(employeeId)) : eq(employees.uniqueId, employeeId)
  const [employee] = await db.select().from(employees).where(idFilter).limit(1)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const upload = await saveUploadedFile(event, { subdir: `employee-documents/${employeeId}` })
  const documentType = upload.fields.documentType as (typeof DOCUMENT_TYPES)[number]
  if (!DOCUMENT_TYPES.includes(documentType)) {
    await deleteUploadedFile(upload.filePath)
    throw createError({ statusCode: 400, statusMessage: `Invalid documentType: ${upload.fields.documentType}` })
  }

  const [existing] = await db
    .select()
    .from(employeeDocuments)
    .where(and(eq(employeeDocuments.employeeId, employee.id), eq(employeeDocuments.documentType, documentType)))
    .limit(1)

  if (existing) {
    await deleteUploadedFile(existing.filePath)
    await db
      .update(employeeDocuments)
      .set({
        fileName: upload.fileName,
        filePath: upload.filePath,
        mimeType: upload.mimeType,
        fileSize: upload.fileSize,
        uploadedAt: new Date(),
      })
      .where(eq(employeeDocuments.id, existing.id))
  } else {
    await db.insert(employeeDocuments).values({
      employeeId: employee.id,
      documentType,
      fileName: upload.fileName,
      filePath: upload.filePath,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
    })
  }

  const [saved] = await db
    .select({
      id: employeeDocuments.id,
      documentType: employeeDocuments.documentType,
      fileName: employeeDocuments.fileName,
      mimeType: employeeDocuments.mimeType,
      fileSize: employeeDocuments.fileSize,
      uploadedAt: employeeDocuments.uploadedAt,
    })
    .from(employeeDocuments)
    .where(and(eq(employeeDocuments.employeeId, employee.id), eq(employeeDocuments.documentType, documentType)))
    .limit(1)

  let ocr: Awaited<ReturnType<typeof extractKtpFields>> | undefined
  if (documentType === 'ktp' && upload.mimeType.startsWith('image/')) {
    try {
      ocr = await extractKtpFields(upload.filePath)
    } catch {
      // OCR is a best-effort prefill aid — a failure here must not fail the upload itself.
      ocr = {}
    }
  }

  return { data: saved, ocr }
})
