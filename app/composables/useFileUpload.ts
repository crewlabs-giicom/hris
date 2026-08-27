export function useFileUpload() {
  const uploading = ref(false)
  const error = ref('')

  async function upload<T = any>(endpoint: string, file: File, extraFields?: Record<string, string>): Promise<T> {
    uploading.value = true
    error.value = ''
    try {
      const formData = new FormData()
      formData.append('file', file)
      for (const [key, value] of Object.entries(extraFields ?? {})) {
        formData.append(key, value)
      }
      return await useApi<T>(endpoint, { method: 'POST', body: formData })
    } catch (e: any) {
      error.value = e?.data?.statusMessage || 'Gagal mengunggah file'
      throw e
    } finally {
      uploading.value = false
    }
  }

  return { upload, uploading, error }
}
