import { saveUploadedFile } from '~~/server/utils/upload'
import { requireAuth } from '~~/server/utils/requireAuth'
import { basename } from 'node:path'

export default defineEventHandler(async (event) => {
  // Ensure the user is authenticated
  requireAuth(event)

  const upload = await saveUploadedFile(event, {
    subdir: 'attachments',
  })

  // Get only the file name with extension from the full path on disk
  const diskFileName = basename(upload.filePath)
  const relativePath = `attachments/${diskFileName}`

  return {
    data: {
      fileName: upload.fileName,
      filePath: relativePath,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
    },
  }
})
