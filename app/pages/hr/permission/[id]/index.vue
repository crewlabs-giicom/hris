<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { ArrowLeft, FileText, Image as ImageIcon, Eye, Clock, User, Calendar, Tag } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()

const id = route.params.id as string

const row = ref<any>(null)
const attachments = ref<any[]>([])
const loading = ref(true)

// Preview modal state
const showPreview = ref(false)
const previewFileUrl = ref('')
const previewFileName = ref('')

async function loadData() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/permissions/${id}`)
    row.value = res.data
    attachments.value = res.data.attachments || []
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat data pengajuan izin')
    router.push('/hr/permission')
  } finally {
    loading.value = false
  }
}

// Formatting helpers
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-50 text-blue-600 border border-blue-200'
    case 'approved':
      return 'bg-green-50 text-green-600 border border-green-200'
    case 'rejected':
      return 'bg-red-50 text-red-600 border border-red-200'
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-200'
  }
}

function getAttachmentName(filePath: string) {
  return filePath.split('/').pop() || 'attachment'
}

function previewAttachment(item: any) {
  const downloadUrl = `/api/v1/attachments/download?file=${encodeURIComponent(item.attachment)}`
  const ext = item.attachment.split('.').pop()?.toLowerCase() || ''

  if (ext === 'pdf') {
    window.open(downloadUrl, '_blank')
  } else {
    previewFileName.value = getAttachmentName(item.attachment)
    previewFileUrl.value = downloadUrl
    showPreview.value = true
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Permission Detail" :breadcrumb="`Dashboard / Permissions / Detail / #${id}`">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/permission')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke List</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-24 bg-white border border-line rounded-xl">
      <span class="text-xs text-ink-soft animate-pulse">Memuat data detail izin...</span>
    </div>

    <!-- Main Detail Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Details Card -->
      <div class="lg:col-span-2">
        <UiCard class="p-6">
          <div class="flex items-center justify-between border-b border-line pb-4 mb-4">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-[#F08050]" />
              <span>Detail Pengaju & Alasan</span>
            </h2>
            <span
              :class="getStatusClass(row.status)"
              class="text-[9.5px] font-bold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider"
            >
              {{ row.status }}
            </span>
          </div>

          <div class="flex flex-col gap-5">
            <!-- Employee Info Block -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-line text-xs">
              <div class="flex flex-col gap-1.5">
                <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Nama Lengkap</span>
                <span class="font-bold text-ink text-sm">{{ row.employee?.fullName }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">NIK / Kode</span>
                <span class="font-bold text-ink text-sm">{{ row.employee?.employeeCode }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Team</span>
                <span class="font-bold text-ink">{{ row.employee?.team?.name || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Tanggal Dibuat</span>
                <span class="font-medium text-ink">{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </div>

            <!-- Permission Time Block -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-line pb-4">
              <div class="flex items-start gap-2.5">
                <Calendar class="w-4 h-4 text-ink-soft mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Mulai Berlaku (Valid From)</span>
                  <span class="font-semibold text-ink text-sm">{{ formatDateTime(row.validFrom) }}</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Calendar class="w-4 h-4 text-ink-soft mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Selesai Berlaku (Valid To)</span>
                  <span class="font-semibold text-ink text-sm">{{ formatDateTime(row.validTo) }}</span>
                </div>
              </div>
            </div>

            <!-- Category & Reason Block -->
            <div class="flex flex-col gap-3">
              <div class="flex items-start gap-2.5 text-xs">
                <Tag class="w-4 h-4 text-ink-soft mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Kategori Izin</span>
                  <span class="font-bold text-[#F08050] text-sm">{{ row.permissionType?.name }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-1.5 text-xs bg-[#FFF8F5] p-4 rounded-xl border border-[#FFE8E0]">
                <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Keterangan Detail Izin (Reason)</span>
                <p class="text-ink leading-relaxed font-medium whitespace-pre-wrap">{{ row.description }}</p>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Attachments Column -->
      <div class="lg:col-span-1">
        <UiCard class="p-6">
          <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
            <Clock class="w-4 h-4 text-[#F08050]" />
            <span>Dokumen Lampiran (Attachments)</span>
          </h2>

          <div v-if="attachments.length > 0" class="flex flex-col gap-2.5">
            <div
              v-for="item in attachments"
              :key="item.id"
              class="flex items-center justify-between p-3 border border-line rounded-lg bg-white shadow-sm hover:shadow transition-shadow"
            >
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <FileText v-if="item.attachment.endsWith('.pdf')" class="w-4 h-4 text-red-500 shrink-0" />
                <ImageIcon v-else class="w-4 h-4 text-blue-500 shrink-0" />
                
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-ink truncate" :title="getAttachmentName(item.attachment)">
                    {{ getAttachmentName(item.attachment) }}
                  </p>
                  <p class="text-[9.5px] text-ink-soft uppercase font-bold tracking-wider">TERUNGGAH</p>
                </div>
              </div>

              <button
                type="button"
                class="p-1 rounded text-[#F08050] hover:text-[#E07040] hover:bg-[#FFF3EE] ml-2 shrink-0 flex items-center gap-1 text-[11px] font-bold"
                @click="previewAttachment(item)"
              >
                <Eye class="w-3.5 h-3.5" />
                <span>Lihat</span>
              </button>
            </div>
          </div>

          <div v-else class="text-center py-12 text-ink-soft text-xs">
            Tidak ada file lampiran bukti (attachment) untuk kategori pengajuan izin ini.
          </div>
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
