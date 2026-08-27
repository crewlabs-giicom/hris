<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Upload, FileText, Image as ImageIcon, X, Eye } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Add Permission Form',
})

const router = useRouter()

// Form state
const form = ref({
  permissionsTypeId: '',
  validFrom: '',
  validTo: '',
  description: '',
})

// Attachments list
interface AttachmentItem {
  tempId?: string
  fileName: string
  fileSize: number
  mimeType: string
  uploading: boolean
  filePath: string
}
const attachments = ref<AttachmentItem[]>([])

// Loading state
const saving = ref(false)

// Drag and drop state
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Preview state
const showPreview = ref(false)
const previewFileUrl = ref('')
const previewFileName = ref('')

const permissionCategories = [
  { id: '4', label: 'Tidak Masuk / Sakit tidak ada SKD' },
  { id: '5', label: 'Pulang Cepat' },
  { id: '6', label: 'Masuk Siang' },
  { id: '9', label: 'Izin Khusus' },
  { id: '10', label: 'Sakit ada SKD' },
  { id: '12', label: 'Keluar saat jam kerja' },
]

// Indonesian Ketentuan Notes mapped by Category ID
const categoryNotes: Record<string, string[]> = {
  '4': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
  ],
  '5': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
    'Jika ijin Masuk Siang / Pulang Cepat, isi jam tidak aktif bekerja jam berapa sampai jam berapa',
    'Jika ijin masuk siang / pulang cepat / ijin keluar, mohon upload foto selfie yang ada jam nya',
  ],
  '6': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
    'Jika ijin Masuk Siang / Pulang Cepat, isi jam tidak aktif bekerja jam berapa sampai jam berapa',
    'Jika ijin masuk siang / pulang cepat / ijin keluar, mohon upload foto selfie yang ada jam nya',
  ],
  '9': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
    'Mohon upload foto dan atau video bukti untuk ijin khusus',
  ],
  '10': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
    'Mohon upload foto dan atau video bukti ijin tidak masuk dan SKD jika ijin sakit',
  ],
  '12': [
    'Isi sesuai tanggal dan jam ijin tidak aktif bekerja',
    'Jika ijin Masuk Siang / Pulang Cepat, isi jam tidak aktif bekerja jam berapa sampai jam berapa',
    'Jika ijin masuk siang / pulang cepat / ijin keluar, mohon upload foto selfie yang ada jam nya',
  ],
}

const currentNotes = computed(() => {
  return categoryNotes[form.value.permissionsTypeId] || []
})

// Whether the current category requires attachments
const requiresAttachment = computed(() => {
  return form.value.permissionsTypeId !== '' && form.value.permissionsTypeId !== '4'
})

// File upload handlers
function triggerFileBrowser() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i])
    }
  }
  if (fileInput.value) fileInput.value.value = ''
}

function handleFileDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i])
    }
  }
}

function handleFilePaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items || [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  if (imageItem) {
    const file = imageItem.getAsFile()
    if (file) {
      // Auto-name pasted screenshots
      const namedFile = new File([file], `clipboard-screenshot-${Date.now()}.png`, { type: file.type })
      uploadFile(namedFile)
    }
  }
}

async function uploadFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    toast.error(`Format file tidak didukung: ${file.type}. Harap upload JPG, PNG, atau PDF.`)
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 5MB.')
    return
  }

  const tempId = crypto.randomUUID()
  const tempItem: AttachmentItem = {
    tempId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploading: true,
    filePath: '',
  }
  attachments.value.push(tempItem)

  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await useApi<any>('/api/v1/attachments/upload', {
      method: 'POST',
      body: formData,
    })

    const idx = attachments.value.findIndex((item) => item.tempId === tempId)
    if (idx !== -1) {
      attachments.value[idx].filePath = res.data.filePath
      attachments.value[idx].uploading = false
    }
  } catch (err: any) {
    const idx = attachments.value.findIndex((item) => item.tempId === tempId)
    if (idx !== -1) {
      attachments.value.splice(idx, 1)
    }
    toast.error(err?.data?.statusMessage || 'Gagal mengunggah attachment')
  }
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function previewAttachment(item: AttachmentItem) {
  const downloadUrl = `/api/v1/attachments/download?file=${encodeURIComponent(item.filePath)}`
  if (item.mimeType === 'application/pdf') {
    window.open(downloadUrl, '_blank')
  } else {
    previewFileName.value = item.fileName
    previewFileUrl.value = downloadUrl
    showPreview.value = true
  }
}

// Global submit handler
async function onSubmit() {
  // Validate fields
  if (!form.value.permissionsTypeId) {
    toast.error('Pilih Kategori Izin terlebih dahulu')
    return
  }
  if (!form.value.validFrom || !form.value.validTo) {
    toast.error('Harap lengkapi Valid From dan Valid To')
    return
  }
  if (!form.value.description.trim()) {
    toast.error('Harap lengkapi keterangan detail izin')
    return
  }

  // Validate attachments
  const activeAttachments = attachments.value.filter((a) => !a.uploading && a.filePath)
  if (requiresAttachment.value && activeAttachments.length === 0) {
    toast.error('Kategori izin ini wajib mengunggah minimal 1 file bukti/attachment.')
    return
  }

  saving.value = true
  try {
    await useApi('/api/v1/permissions', {
      method: 'POST',
      body: {
        ...form.value,
        attachments: activeAttachments.map((a) => a.filePath),
      },
    })
    toast.success('Pengajuan izin berhasil dibuat!')
    router.push('/hr/permission')
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan pengajuan izin')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div @paste="handlePaste">
    <!-- Header -->
    <UiPageHeader title="Add Permission" breadcrumb="Dashboard / Permissions / Add">
      <template #actions>
        <div class="flex gap-2">
          <button
            type="button"
            class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
            @click="router.push('/hr/permission')"
            :disabled="saving"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <button
            type="button"
            class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            @click="onSubmit"
            :disabled="saving"
          >
            <Save class="w-4 h-4" />
            <span>{{ saving ? 'Menyimpan...' : 'Simpan' }}</span>
          </button>
        </div>
      </template>
    </UiPageHeader>

    <!-- Main Form Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <div class="lg:col-span-2 flex flex-col gap-4">
        <!-- Input Form Card -->
        <UiCard class="p-5">
          <h2 class="text-xs font-bold text-ink uppercase tracking-wider mb-4">Informasi Pengajuan Izin</h2>
          
          <div class="flex flex-col gap-4">
            <!-- Permission Category -->
            <UiFormField label="Permissions Category" required>
              <UiSelectSearch
                v-model="form.permissionsTypeId"
                :options="permissionCategories"
                placeholder="Pilih Kategori Izin"
              />
              <!-- Dynamic Category Rules in Red -->
              <div v-if="currentNotes.length > 0" class="mt-2 text-red-600 text-[11px] leading-relaxed font-medium bg-red-50 p-2.5 rounded-md border border-red-100">
                <p class="font-bold mb-1">Ketentuan Pengajuan:</p>
                <ul class="list-disc pl-4 flex flex-col gap-0.5">
                  <li v-for="(note, idx) in currentNotes" :key="idx">{{ note }}</li>
                </ul>
              </div>
            </UiFormField>

            <!-- Datetimes (From & To) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UiFormField label="Valid From" required>
                <UiDateTimePicker
                  v-model="form.validFrom"
                />
              </UiFormField>

              <UiFormField label="Valid To" required>
                <UiDateTimePicker
                  v-model="form.validTo"
                />
              </UiFormField>
            </div>

            <!-- Description/Reason -->
            <UiFormField label="Keterangan Detail Izin" required>
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="Tuliskan detail alasan pengajuan izin secara spesifik..."
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 resize-none"
              />
              <span class="text-red-600 text-[10.5px] mt-1 block font-medium leading-normal">
                * Mohon isi keterangan detail ijin dengan lebih spesifik, HRD tidak menerima penulisan alasan karena kepentingan / keperluan pribadi
              </span>
            </UiFormField>
          </div>
        </UiCard>
      </div>

      <!-- Attachment Card (Hidden for Category ID 4) -->
      <div class="lg:col-span-1">
        <UiCard v-if="form.permissionsTypeId !== '4'" class="p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider">
              Attachments <span v-if="requiresAttachment" class="text-red-600">*</span>
            </h2>
            <span v-if="requiresAttachment" class="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Wajib input minimal 1</span>
          </div>

          <!-- Drag and Drop zone with paste hook -->
          <div
            ref="slotRef"
            tabindex="0"
            class="border-2 border-dashed border-line hover:border-topbar-1 rounded-xl p-6 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center gap-2 outline-none"
            :class="{ 'border-topbar-1 bg-[#FFF3EE]': dragOver }"
            @click="triggerFileBrowser"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleFileDrop"
            @paste.prevent="handleFilePaste"
          >
            <Upload class="w-7 h-7 text-ink-soft" />
            <span class="text-[11px] text-ink font-semibold">Klik, drag & drop, atau paste (Ctrl+V)</span>
            <span class="text-[9.5px] text-ink-soft">JPG, PNG, PDF (Maks. 5MB)</span>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              @change="handleFileSelect"
            />
          </div>

          <!-- List of uploaded files -->
          <div v-if="attachments.length > 0" class="mt-4 flex flex-col gap-2">
            <div
              v-for="(file, idx) in attachments"
              :key="file.tempId || file.filePath"
              class="flex items-center justify-between p-2.5 border border-line rounded-lg bg-white shadow-sm"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <FileText v-if="file.mimeType.includes('pdf')" class="w-4 h-4 text-red-500 shrink-0" />
                <ImageIcon v-else class="w-4 h-4 text-blue-500 shrink-0" />
                
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-medium text-ink truncate" :title="file.fileName">{{ file.fileName }}</p>
                  <p class="text-[9.5px] text-ink-soft">
                    {{ file.uploading ? 'Mengunggah...' : formatBytes(file.fileSize) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  v-if="!file.uploading"
                  type="button"
                  class="p-1 rounded text-ink-soft hover:text-ink hover:bg-gray-100"
                  @click="previewAttachment(file)"
                  title="Preview"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50"
                  @click="removeAttachment(idx)"
                  title="Hapus"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Informational state for Category 4 -->
        <UiCard v-else class="p-5 text-center bg-gray-50 border border-line">
          <p class="text-xs text-ink-soft">
            Kategori "Tidak Masuk / Sakit tidak ada SKD" tidak memerlukan unggahan file attachment/bukti.
          </p>
        </UiCard>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <UiModal v-model="showPreview" :title="previewFileName" size="lg">
        <div class="flex items-center justify-center p-2 bg-[#FAFAFA] rounded-lg border border-line min-h-[200px]">
          <img :src="previewFileUrl" class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
        </div>
      </UiModal>
    </Teleport>
  </div>
</template>
