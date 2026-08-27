<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, User, Calendar, Tag, FileText, CheckSquare, Layers, AlertCircle } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const row = ref<any>(null)
const tasks = ref<any[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/resignation/${id}`)
    row.value = res.data
    tasks.value = res.data.tasks || []
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat detail pengajuan resign')
    router.push('/hr/resignation')
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

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

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Resignation Detail" :breadcrumb="`Dashboard / Resignation / Detail / #${id}`">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/resignation')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke List</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-24 bg-white border border-line rounded-xl">
      <span class="text-xs text-ink-soft animate-pulse">Memuat detail pengajuan resign...</span>
    </div>

    <!-- Main Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Left Column (Detail & Profile) -->
      <div class="lg:col-span-2 flex flex-col gap-5">
        <UiCard class="p-6">
          <div class="flex items-center justify-between border-b border-line pb-4 mb-4">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-[#F08050]" />
              <span>Profil Karyawan & Informasi Resign</span>
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
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Nama Karyawan</span>
                <span class="font-bold text-ink text-sm">{{ row.employee?.fullName }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">NIK</span>
                <span class="font-bold text-ink text-sm">{{ row.employee?.employeeCode || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Divisi / Division</span>
                <span class="font-bold text-ink">{{ row.employee?.division?.name || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Position / Jabatan</span>
                <span class="font-bold text-ink">{{ row.employee?.position?.title || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Tanggal Join</span>
                <span class="font-medium text-ink">{{ row.employee?.joinDate || '-' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Tanggal Pengajuan</span>
                <span class="font-medium text-ink">{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </div>

            <!-- Resignation Metadata Block -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-line pb-4">
              <div class="flex items-start gap-2.5">
                <Calendar class="w-4.5 h-4.5 text-ink-soft mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Tanggal Resign</span>
                  <span class="font-bold text-ink text-sm">{{ formatDate(row.resignationDate) }}</span>
                </div>
              </div>
              <div class="flex items-start gap-2.5">
                <Tag class="w-4.5 h-4.5 text-ink-soft mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Tipe Resign</span>
                  <span class="font-bold text-[#F08050] text-sm">{{ row.resignationType }}</span>
                </div>
              </div>
            </div>

            <!-- Reason Description Block -->
            <div class="flex flex-col gap-1.5 text-xs bg-[#FFF8F5] p-4 rounded-xl border border-[#FFE8E0]">
              <span class="text-ink-soft font-semibold text-[10px] uppercase tracking-wider">Detail Alasan Resign</span>
              <p class="text-ink leading-relaxed font-medium whitespace-pre-wrap">{{ row.resignationReason }}</p>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Right Column (Tasks list) -->
      <div class="lg:col-span-1 flex flex-col gap-5">
        <!-- Tasks Checklist Card -->
        <UiCard class="p-6">
          <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
            <CheckSquare class="w-4 h-4 text-[#F08050]" />
            <span>Tugas & Handover ({{ tasks.length }})</span>
          </h2>

          <div v-if="tasks.length > 0" class="flex flex-col gap-2.5">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="flex flex-col gap-1.5 p-3 border border-line rounded-lg bg-gray-50 hover:shadow-sm transition-shadow"
            >
              <p class="text-xs font-semibold text-ink leading-normal">{{ task.task }}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block uppercase tracking-wider"
                  :class="task.type === 'hard copy' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-purple-50 text-purple-600 border border-purple-200'"
                >
                  {{ task.type }}
                </span>
                <span class="text-[9px] text-ink-soft">Handover Item</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-ink-soft text-xs">
            Tidak ada daftar tugas serah terima.
          </div>
        </UiCard>

        <!-- Sidebar Info -->
        <UiCard class="p-5 flex items-start gap-2 bg-gray-50 border border-line">
          <AlertCircle class="w-4.5 h-4.5 text-ink-soft shrink-0 mt-0.5" />
          <div class="flex flex-col gap-1 text-[11px] text-ink-soft leading-normal">
            <p class="font-bold text-ink">Catatan Transisi</p>
            <p>Pastikan setiap butir tugas penyerahan tanggung jawab di atas telah diperiksa oleh kepala divisi terkait sebelum persetujuan akhir diberikan.</p>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
