<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Save, Plus, Trash2, Calendar, FileText, Briefcase, CheckCircle } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

// Form states
const employeeId = ref('')
const employeeDetail = ref<any>(null)
const resignationDate = ref('')
const resignationType = ref('')
const resignationReason = ref('')
const status = ref('active')

// Tasks list
const tasks = ref<Array<{ task: string; type: 'soft copy' | 'hard copy' }>>([])

// Assets (hidden for now)
const assets = ref<Array<{ assetId: number }>>([])

const resignationTypeOptions = [
  { id: 'Efektif Resign', label: 'Efektif Resign' },
  { id: 'Habis Kontrak', label: 'Habis Kontrak' },
  { id: 'Freelance / Magang berakhir', label: 'Freelance / Magang berakhir' },
  { id: 'Cancel join', label: 'Cancel join' },
  { id: 'Pemutusan Hub. Kerja', label: 'Pemutusan Hub. Kerja' },
]

const statusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const loading = ref(true)
const loadingDetail = ref(false)
const submitting = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await useApi<any>(`/api/v1/resignation/${id}`)
    const data = res.data
    
    // Only allow editing if status is active
    if (data.status !== 'active') {
      toast.error('Hanya pengajuan resign dengan status "active" yang dapat diubah')
      router.push('/hr/resignation')
      return
    }

    employeeId.value = String(data.employeeId)
    // Extract date without timezone issues
    resignationDate.value = data.resignationDate ? data.resignationDate.slice(0, 10) : ''
    resignationType.value = data.resignationType
    resignationReason.value = data.resignationReason
    status.value = data.status
    
    tasks.value = Array.isArray(data.tasks) && data.tasks.length > 0 
      ? data.tasks.map((t: any) => ({ task: t.task, type: t.type }))
      : [{ task: '', type: 'soft copy' }]

    assets.value = Array.isArray(data.assets) ? data.assets : []
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memuat data detail resign')
    router.push('/hr/resignation')
  } finally {
    loading.value = false
  }
}

// Fetch employee details when employeeId changes
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

// Dynamic tasks handlers
function addTask() {
  tasks.value.push({ task: '', type: 'soft copy' })
}

function removeTask(index: number) {
  if (tasks.value.length > 1) {
    tasks.value.splice(index, 1)
  } else {
    tasks.value = [{ task: '', type: 'soft copy' }]
  }
}

async function onSubmit() {
  if (!employeeId.value) {
    toast.error('Harap pilih karyawan')
    return
  }
  if (!resignationDate.value) {
    toast.error('Harap pilih tanggal resign')
    return
  }
  if (!resignationType.value) {
    toast.error('Harap pilih tipe resign')
    return
  }

  const validTasks = tasks.value.filter((t) => t.task.trim() !== '')
  if (validTasks.length === 0) {
    toast.error('Harap isi minimal satu tugas serah terima')
    return
  }

  submitting.value = true
  try {
    await useApi(`/api/v1/resignation/${id}`, {
      method: 'PUT',
      body: {
        employeeId: Number(employeeId.value),
        resignationDate: resignationDate.value,
        resignationType: resignationType.value,
        resignationReason: resignationType.value, // default reason to selected type to satisfy DB non-null constraint
        status: status.value,
        tasks: validTasks,
        assets: assets.value,
      },
    })
    toast.success('Pengajuan resign berhasil diperbarui')
    router.push('/hr/resignation')
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Gagal memperbarui pengajuan resign')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader :title="`Edit Resignation #${id}`" :breadcrumb="`Dashboard / Resignation / Edit / #${id}`">
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

    <div v-if="loading" class="flex justify-center items-center py-24 bg-white border border-line rounded-xl">
      <span class="text-xs text-ink-soft animate-pulse">Memuat data pengajuan resign...</span>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 my-4">
      <!-- Main Form Column -->
      <div class="lg:col-span-2">
        <form @submit.prevent="onSubmit" class="flex flex-col gap-5">
          <!-- Form Card -->
          <UiCard class="p-6">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
              <FileText class="w-4 h-4 text-[#F08050]" />
              <span>Detail Informasi Resign</span>
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
                  <span class="font-bold text-ink text-sm">{{ employeeDetail.nik || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Division</span>
                  <span class="font-bold text-ink">{{ employeeDetail.division?.name || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Position</span>
                  <span class="font-bold text-ink">{{ employeeDetail.position?.title || '-' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">Join Date</span>
                  <span class="font-bold text-ink">{{ employeeDetail.joinDate || '-' }}</span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <!-- Resignation Type -->
                <div class="flex flex-col gap-1.5 sm:col-span-1">
                  <label class="text-xs font-semibold text-ink">Tipe Resign <span class="text-red-500">*</span></label>
                  <UiSelectSearch
                    v-model="resignationType"
                    :options="resignationTypeOptions"
                    placeholder="Pilih Tipe"
                  />
                </div>

                <!-- Resignation Date -->
                <div class="flex flex-col gap-1.5 sm:col-span-1">
                  <label class="text-xs font-semibold text-ink">Tanggal Resign <span class="text-red-500">*</span></label>
                  <UiDatePicker
                    v-model="resignationDate"
                    placeholder="Pilih Tanggal Resign"
                  />
                </div>

                <!-- Status Select (Enable modify for admin) -->
                <div class="flex flex-col gap-1.5 sm:col-span-1">
                  <label class="text-xs font-semibold text-ink">Status <span class="text-red-500">*</span></label>
                  <UiSelectSearch
                    v-model="status"
                    :options="statusOptions"
                    placeholder="Pilih Status"
                  />
                </div>
              </div>

              <!-- Resignation Reason (Hidden since it is not in the requirements) -->
              <div v-if="false" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-ink">Alasan Resign</label>
                <textarea
                  v-model="resignationReason"
                  rows="4"
                  class="w-full text-xs p-3 rounded-lg border border-line bg-white text-ink outline-none"
                ></textarea>
              </div>
            </div>
          </UiCard>

          <!-- Tasks Card -->
          <UiCard class="p-6">
            <div class="flex items-center justify-between border-b border-line pb-4 mb-4">
              <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle class="w-4 h-4 text-[#F08050]" />
                <span>Tugas & Serah Terima Tanggung Jawab</span>
              </h2>
              <button
                type="button"
                class="text-[11px] px-2.5 py-1 font-semibold text-[#F08050] bg-[#FFF3EE] hover:bg-[#FFE8E0] rounded border border-[#FFE8E0] flex items-center gap-1"
                @click="addTask"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="(taskItem, idx) in tasks"
                :key="idx"
                class="flex items-center gap-3 border border-line p-3 rounded-lg bg-gray-50"
              >
                <span class="text-xs font-bold text-ink-soft shrink-0 w-5">#{{ idx + 1 }}</span>
                <input
                  v-model="taskItem.task"
                  placeholder="Tugas handover..."
                  class="flex-1 text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
                />
                
                <select
                  v-model="taskItem.type"
                  class="w-32 text-xs px-2.5 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
                >
                  <option value="soft copy">Soft Copy</option>
                  <option value="hard copy">Hard Copy</option>
                </select>

                <button
                  type="button"
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors shrink-0"
                  @click="removeTask(idx)"
                  title="Hapus Tugas"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </UiCard>

          <!-- Hidden Asset input section -->
          <UiCard v-if="false" class="p-6">
            <h2 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-4 mb-4">
              <Briefcase class="w-4 h-4 text-gray-400" />
              <span>Pengembalian Aset (Di-hide untuk sekarang)</span>
            </h2>
            <p class="text-xs text-ink-soft">Tabel aset belum siap.</p>
          </UiCard>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all"
              @click="router.push('/hr/resignation')"
            >
              BATAL
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="text-xs px-5 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save class="w-4 h-4" />
              <span>SIMPAN PERUBAHAN</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Info Banner Sidebar -->
      <div class="lg:col-span-1">
        <UiCard class="p-6 bg-[#FFFDFB] border-[#FFEADF]">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider mb-2 text-[#E07040]">Petunjuk Pengubahan</h3>
          <p class="text-xs text-ink-soft leading-relaxed">
            Perubahan pada pengajuan resign ini hanya diperbolehkan apabila pengajuan masih berstatus **Active**.<br/><br/>
            Apabila status diubah menjadi **Approved** atau **Rejected**, maka transaksi tidak akan dapat diubah kembali di masa mendatang.
          </p>
        </UiCard>
      </div>
    </div>
  </div>
</template>
