<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Briefcase, FileText, Upload, Eye, X, FileImage } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const route = useRoute()
const id = route.params.id

interface AttachmentItem {
  tempId?: string
  fileName: string
  fileSize: number
  mimeType: string
  uploading: boolean
  filePath: string
}

// Loading state
const loading = ref(true)
const submitting = ref(false)

// Form states
const employeeId = ref('')
const employeeDetail = ref<any>(null)
const loadingDetail = ref(false)

const manualAttendanceType = ref('Manual Absen')
const startDate = ref('')
const endDate = ref('')
const clockIn = ref('')
const clockOut = ref('')
const isLate = ref(false)
const freeAttendances = ref(false)
const description = ref('')
const status = ref('')

const attachments = ref<AttachmentItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

// Image Preview Modal states
const showPreview = ref(false)
const previewFileName = ref('')
const previewFileUrl = ref('')

const typeOptions = [
  { id: 'Manual Absen', label: 'Manual Absen' },
  { id: 'Telat Masuk dan Punishment', label: 'Telat Masuk dan Punishment' },
]

const statusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

// Fetch employee details when selected
watch(employeeId, async (newVal) => {
  if (!newVal) {
    employeeDetail.value = null
    return
  }
  loadingDetail.value = true
  try {
    const res = await useApi<any>(`/api/v1/employees/${newVal}/detail`)
    employeeDetail.value = res.data
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat detail karyawan')
    employeeDetail.value = null
  } finally {
    loadingDetail.value = false
  }
})

// Auto-fill logic for Free Attendances rule
watch([freeAttendances, manualAttendanceType], ([isFree, type]) => {
  if (type === 'Manual Absen' && isFree) {
    clockIn.value = '08:30'
    clockOut.value = '17:00'
  }
})

// Load details
async function loadDetails() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/shift-schedule/manual/${id}`)
    const d = res.data
    employeeId.value = String(d.employeeId)
    manualAttendanceType.value = d.manualAttendanceType
    startDate.value = d.startDate.split('T')[0]
    endDate.value = d.endDate.split('T')[0]
    clockIn.value = d.clockIn || ''
    clockOut.value = d.clockOut || ''
    isLate.value = d.isLate === 1
    freeAttendances.value = d.freeAttendances === 'Yes'
    description.value = d.description || ''
    status.value = d.status

    // Load attachments
    const loadedAttachments = Array.isArray(d.attachments) ? d.attachments : []
    attachments.value = loadedAttachments.map((a: any) => ({
      fileName: a.attachment.split('/').pop() || 'attachment',
      fileSize: 0, // not stored
      mimeType: a.attachment.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      uploading: false,
      filePath: a.attachment,
    }))
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat detail pengajuan')
    router.push('/hr/shift-schedule/manual')
  } finally {
    loading.value = false
  }
}

// File upload / paste handlers
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

async function onSubmit() {
  if (!employeeId.value) {
    toast.error('Harap pilih karyawan')
    return
  }
  if (!manualAttendanceType.value) {
    toast.error('Harap pilih tipe manual attendance')
    return
  }
  if (!startDate.value || !endDate.value) {
    toast.error('Harap isi rentang tanggal')
    return
  }

  const isFree = freeAttendances.value && manualAttendanceType.value === 'Manual Absen'
  if (!isFree && !clockIn.value && !clockOut.value) {
    toast.error('Harap isi bagian Clock In atau Clock Out sesuai bukti absen')
    return
  }

  const activeAttachments = attachments.value.filter((a) => !a.uploading && a.filePath)
  if (activeAttachments.length === 0) {
    toast.error('Harap unggah minimal satu bukti file/attachment.')
    return
  }

  submitting.value = true
  try {
    await useApi(`/api/v1/shift-schedule/manual/${id}`, {
      method: 'PUT',
      body: {
        employeeId: Number(employeeId.value),
        manualAttendanceType: manualAttendanceType.value,
        startDate: startDate.value,
        endDate: endDate.value,
        clockIn: clockIn.value,
        clockOut: clockOut.value,
        isLate: isLate.value,
        freeAttendances: isFree ? 'Yes' : 'No',
        description: description.value,
        status: status.value,
        attachments: activeAttachments.map((a) => a.filePath),
      },
    })
    toast.success('Pengajuan manual attendance berhasil diperbarui')
    router.push('/hr/shift-schedule/manual')
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memperbarui pengajuan')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDetails()
})
</script>

<template>
  <div @paste="handleFilePaste">
    <!-- Page Header -->
    <UiPageHeader :title="`Edit Manual Attendance #${id}`" :breadcrumb="`Dashboard / Shift Schedule / Manual Attendance / Edit / #${id}`">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/shift-schedule/manual')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke List</span>
        </button>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="flex justify-center items-center py-24 bg-white border border-line rounded-xl">
      <span class="text-xs text-ink-soft animate-pulse">Memuat data pengajuan...</span>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Main Form Column -->
      <div class="lg:col-span-2">
        <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
          <!-- Form Card -->
          <UiCard class="p-6">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
              <FileText class="w-4 h-4 text-[#F08050]" />
              <span>Detail Informasi Absen Manual</span>
            </h2>

            <div class="flex flex-col gap-4">
              <!-- Select Employee -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Karyawan <span class="text-red-500">*</span></label>
                <UiSelectSearch
                  v-model="employeeId"
                  endpoint="/api/v1/employees"
                  labelKey="fullName"
                  placeholder="Cari & Pilih Karyawan..."
                />
              </div>

              <!-- Read-only Employee Profile Panel -->
              <div v-if="loadingDetail" class="p-4 bg-gray-50 border border-line rounded-xl text-center">
                <span class="text-xs text-ink-soft animate-pulse">Mengambil data profil karyawan...</span>
              </div>
              <div v-else-if="employeeDetail" class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-line text-xs">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Nama Lengkap</span>
                  <span class="font-bold text-ink text-sm">{{ employeeDetail.fullName }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">NIK</span>
                  <span class="font-bold text-ink text-sm">{{ employeeDetail.employeeCode || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Division</span>
                  <span class="font-bold text-ink">{{ employeeDetail.division?.name || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Position</span>
                  <span class="font-bold text-ink">{{ employeeDetail.position?.title || '-' }}</span>
                </div>
              </div>

              <!-- Type Selector -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Tipe Pengajuan <span class="text-red-500">*</span></label>
                <UiSelectSearch
                  v-model="manualAttendanceType"
                  :options="typeOptions"
                  placeholder="Pilih Tipe Manual Attendance"
                />
              </div>

              <!-- Free Attendances Option (Only for Manual Absen) -->
              <div v-if="manualAttendanceType === 'Manual Absen'" class="bg-gray-50 p-4 rounded-xl border border-line">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="freeAttendances"
                    class="rounded text-[#F08050] focus:ring-[#F08050] h-4 w-4 border-line"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold text-ink">Free Attendances (Bebas Absen)</span>
                    <span class="text-[10px] text-ink-soft">Jika dipilih, Jam masuk & pulang otomatis diset ke 08:30 - 17:00</span>
                  </div>
                </label>
              </div>

              <!-- Date Range (Start Date & End Date) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-ink">Start Date <span class="text-red-500">*</span></label>
                  <UiDatePicker
                    v-model="startDate"
                    placeholder="Pilih Tanggal Mulai"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-ink">End Date <span class="text-red-500">*</span></label>
                  <UiDatePicker
                    v-model="endDate"
                    placeholder="Pilih Tanggal Selesai"
                  />
                </div>
              </div>

              <!-- Clock In, Clock Out, and Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-ink">Clock In</label>
                  <input
                    type="text"
                    v-model="clockIn"
                    placeholder="Contoh: 08:30"
                    :disabled="freeAttendances && manualAttendanceType === 'Manual Absen'"
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-ink">Clock Out</label>
                  <input
                    type="text"
                    v-model="clockOut"
                    placeholder="Contoh: 17:00"
                    :disabled="freeAttendances && manualAttendanceType === 'Manual Absen'"
                    class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <!-- Status Select -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-ink">Status <span class="text-red-500">*</span></label>
                  <UiSelectSearch
                    v-model="status"
                    :options="statusOptions"
                    placeholder="Pilih Status"
                  />
                </div>
              </div>

              <!-- Late Option (For punishment/check) -->
              <div class="bg-gray-50 p-4 rounded-xl border border-line">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="isLate"
                    class="rounded text-[#F08050] focus:ring-[#F08050] h-4 w-4 border-line"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold text-ink">Terlambat (Late)?</span>
                    <span class="text-[10px] text-ink-soft">Centang jika absen ini berstatus terlambat</span>
                  </div>
                </label>
              </div>

              <!-- Description / Reason -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Keterangan / Alasan <span class="text-red-500">*</span></label>
                <textarea
                  v-model="description"
                  rows="3"
                  placeholder="Tuliskan keterangan detail pengajuan absen manual..."
                  class="w-full text-xs p-3 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1 resize-none"
                ></textarea>
              </div>
            </div>
          </UiCard>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3">
            <UiButton
              type="button"
              variant="secondary"
              @click="router.push('/hr/shift-schedule/manual')"
            >
              Batal
            </UiButton>
            <UiButton
              type="submit"
              variant="primary"
              :loading="submitting"
            >
              <Save class="w-4 h-4 mr-1.5" />
              <span>Simpan Perubahan</span>
            </UiButton>
          </div>
        </form>
      </div>

      <!-- Attachment Dropzone Column -->
      <div class="lg:col-span-1 flex flex-col gap-4">
        <UiCard class="p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider">
              Bukti Lampiran <span class="text-red-600">*</span>
            </h2>
            <span class="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Min. 1 File</span>
          </div>

          <!-- Drag & Drop Zone -->
          <div
            tabindex="0"
            class="border-2 border-dashed border-line hover:border-topbar-1 rounded-xl p-6 text-center cursor-pointer bg-white transition-all flex flex-col items-center justify-center gap-2 outline-none"
            :class="{ 'border-topbar-1 bg-[#FFF3EE]': dragOver }"
            @click="triggerFileBrowser"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleFileDrop"
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
                <FileImage v-else class="w-4 h-4 text-blue-500 shrink-0" />
                
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

        <!-- Dynamic Rule Guide Info -->
        <UiCard class="p-5 border-dashed">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase class="w-4 h-4 text-[#F08050]" />
            <span>Aturan Manual Absen</span>
          </h3>
          <ul class="text-[11.5px] text-ink-soft list-disc list-inside space-y-2.5 leading-relaxed">
            <li>
              <b>Jika tidak bisa absen Masuk:</b> Isi kolom <span class="font-semibold text-ink">Clock In</span> sesuai jam di foto bukti, kosongkan Clock Out.
            </li>
            <li>
              <b>Jika tidak bisa absen Pulang:</b> Isi kolom <span class="font-semibold text-ink">Clock Out</span> sesuai jam di foto bukti, kosongkan Clock In.
            </li>
          </ul>
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
