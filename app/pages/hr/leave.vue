<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search, RefreshCw, Edit2, Trash2, Save, X } from 'lucide-vue-next'
import { useDataTable } from '~/composables/useDataTable'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Paid Leave',
})

const { confirm } = useConfirm()

// Columns declaration matching specifications
const columns: DataTableColumn[] = [
  { key: 'employeeCode', label: 'NIK' },
  { key: 'team', label: 'Team' },
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'paidLeaveType', label: 'Paid Leave Type' },
  { key: 'validFrom', label: 'Start' },
  { key: 'validTo', label: 'End' },
  { key: 'description', label: 'Description' },
  { key: 'paidLeaveCount', label: 'Paid Leave Count', align: 'right' },
  { key: 'dayOffCount', label: 'Day Off Count', align: 'right' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'status', label: 'Status' },
]

// Custom Filter Options
const statusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const months = [
  { id: '1', label: 'Januari' },
  { id: '2', label: 'Februari' },
  { id: '3', label: 'Maret' },
  { id: '4', label: 'April' },
  { id: '5', label: 'Mei' },
  { id: '6', label: 'Juni' },
  { id: '7', label: 'Juli' },
  { id: '8', label: 'Agustus' },
  { id: '9', label: 'September' },
  { id: '10', label: 'Oktober' },
  { id: '11', label: 'November' },
  { id: '12', label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => {
  const y = String(currentYear - 5 + i)
  return { id: y, label: y }
})

// Local Filter States
const filterSearch = ref('')
const filterStatus = ref<string[]>([])
const filterTeam = ref<string[]>([])
const filterMonth = ref(String(new Date().getMonth() + 1))
const filterYear = ref(String(new Date().getFullYear()))

// Initialize useDataTable
const {
  rows,
  loading,
  page,
  perPage,
  total,
  fetch,
  prev,
  next,
  setPerPage,
} = useDataTable<any>(
  async (params) => {
    const res = await useApi<any>('/api/v1/paid-leaves', {
      query: {
        ...params,
        search: filterSearch.value,
        status: filterStatus.value.join(','),
        teamId: filterTeam.value.join(','),
        month: filterMonth.value,
        year: filterYear.value,
      },
    })
    return res
  },
  { defaultPerPage: 10 }
)

// Formatting helpers
function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

// Modal States & Form Data
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)

const form = ref({
  paidLeaveType: '',
  validFrom: '',
  validTo: '',
  paidLeaveCount: 0,
  dayOffCount: 0,
  address: '',
  description: '',
  personResponsibleId: '',
  task: '',
})

// Team Employees List for select dropdown
const teamEmployees = ref<any[]>([])

async function fetchTeamEmployees() {
  try {
    const res = await useApi<any>('/api/v1/employees/my-team')
    teamEmployees.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch team employees', e)
  }
}

function openCreateModal() {
  isEdit.value = false
  editingId.value = null
  form.value = {
    paidLeaveType: '',
    validFrom: '',
    validTo: '',
    paidLeaveCount: 0,
    dayOffCount: 0,
    address: '',
    description: '',
    personResponsibleId: '',
    task: '',
  }
  showFormModal.value = true
}

async function openEditModal(row: any) {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    paidLeaveType: row.paidLeaveType,
    validFrom: formatDate(row.validFrom),
    validTo: formatDate(row.validTo),
    paidLeaveCount: row.paidLeaveCount,
    dayOffCount: row.dayOffCount,
    address: row.address || '',
    description: row.description || '',
    personResponsibleId: row.personResponsibleId ? String(row.personResponsibleId) : '',
    task: row.task || '',
  }
  showFormModal.value = true
}

async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Pengajuan Cuti?',
    text: `Pengajuan cuti "${row.employee?.fullName}" akan dihapus secara permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/paid-leaves/${row.id}`, { method: 'DELETE' })
    toast.success('Pengajuan cuti berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus pengajuan cuti')
  }
}

async function onSubmit() {
  if (!form.value.paidLeaveType) {
    toast.error('Pilih Tipe Cuti terlebih dahulu')
    return
  }
  if (!form.value.validFrom || !form.value.validTo) {
    toast.error('Harap lengkapi tanggal mulai dan berakhir')
    return
  }
  if (form.value.paidLeaveCount === undefined || form.value.paidLeaveCount < 0) {
    toast.error('Paid leave count tidak boleh kurang dari 0')
    return
  }
  if (form.value.dayOffCount === undefined || form.value.dayOffCount < 0) {
    toast.error('Day off count tidak boleh kurang dari 0')
    return
  }
  if (!form.value.description.trim()) {
    toast.error('Harap lengkapi alasan pengajuan cuti')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value && editingId.value) {
      await useApi(`/api/v1/paid-leaves/${editingId.value}`, {
        method: 'PUT',
        body: form.value,
      })
      toast.success('Pengajuan cuti berhasil diperbarui!')
    } else {
      await useApi('/api/v1/paid-leaves', {
        method: 'POST',
        body: form.value,
      })
      toast.success('Pengajuan cuti berhasil dibuat!')
    }
    showFormModal.value = false
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan pengajuan cuti')
  } finally {
    submitting.value = false
  }
}

function applyFilters() {
  page.value = 1
  fetch()
}

function resetFilters() {
  filterSearch.value = ''
  filterStatus.value = []
  filterTeam.value = []
  filterMonth.value = String(new Date().getMonth() + 1)
  filterYear.value = String(new Date().getFullYear())
  applyFilters()
}

onMounted(() => {
  fetch()
  fetchTeamEmployees()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Paid Leave" breadcrumb="Dashboard / Permissions / Paid Leave">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4" />
          <span>Add Paid Leave</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Search</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Name, NIK, or Description..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="applyFilters"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- Status Filter (Multiple Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Status</label>
          <UiSelectSearch
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="All Status"
            :multiple="true"
          />
        </div>

        <!-- Team Filter (Multiple Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Team</label>
          <UiSelectSearch
            v-model="filterTeam"
            endpoint="/api/v1/master-data/teams"
            placeholder="All Team"
            :multiple="true"
          />
        </div>

        <!-- Month Filter (Single Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Month</label>
          <UiSelectSearch
            v-model="filterMonth"
            :options="months"
            placeholder="Select Month"
            :multiple="false"
          />
        </div>

        <!-- Year Filter (Single Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Year</label>
          <UiSelectSearch
            v-model="filterYear"
            :options="years"
            placeholder="Select Year"
            :multiple="false"
          />
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="flex justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          class="text-xs px-3 py-1.5 font-semibold text-ink-soft bg-white border border-line rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1.5"
          @click="resetFilters"
        >
          <span>Reset Filters</span>
        </button>
        <button
          type="button"
          class="text-xs px-3 py-1.5 font-semibold text-white bg-topbar-1 hover:opacity-90 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="applyFilters"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>Apply Filters</span>
        </button>
      </div>
    </div>

    <!-- Datatable Section -->
    <UiCard class="overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-24 bg-white rounded-xl border border-line">
        <span class="text-xs text-ink-soft animate-pulse">Memuat data pengajuan cuti...</span>
      </div>

      <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada pengajuan cuti yang ditemukan.</p>
      </div>

      <template v-else>
        <UiDataTable
          :columns="columns"
          :rows="rows"
        >
          <!-- Row actions -->
          <template #row-actions="{ row }">
            <!-- Edit modal trigger - only if active -->
            <button
              v-if="row.status === 'active'"
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
              @click="openEditModal(row)"
            >
              <Edit2 class="w-3 h-3" />
              <span>Edit</span>
            </button>

            <!-- Delete action - only if active -->
            <button
              v-if="row.status === 'active'"
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-[#FAFAFA] border-t border-line"
              @click="onDelete(row)"
            >
              <Trash2 class="w-3 h-3" />
              <span>Delete</span>
            </button>
          </template>

          <!-- Cell formatting slots -->
          <template #cell-employeeCode="{ row }">
            <span class="font-semibold text-ink">{{ row.employee?.employeeCode || '-' }}</span>
          </template>

          <template #cell-team="{ row }">
            <span class="text-ink">{{ row.employee?.team?.name || '-' }}</span>
          </template>

          <template #cell-employeeName="{ row }">
            <span class="font-medium text-ink">{{ row.employee?.fullName || '-' }}</span>
          </template>

          <template #cell-paidLeaveType="{ row }">
            <span class="font-semibold text-xs capitalize text-ink-soft">{{ row.paidLeaveType }}</span>
          </template>

          <template #cell-validFrom="{ row }">
            {{ formatDate(row.validFrom) }}
          </template>

          <template #cell-validTo="{ row }">
            {{ formatDate(row.validTo) }}
          </template>

          <template #cell-description="{ row }">
            <span class="truncate max-w-[180px] block" :title="row.description">{{ row.description || '-' }}</span>
          </template>

          <template #cell-paidLeaveCount="{ row }">
            <span class="font-semibold text-right block">{{ row.paidLeaveCount }} Hari</span>
          </template>

          <template #cell-dayOffCount="{ row }">
            <span class="font-semibold text-right block">{{ row.dayOffCount }} Hari</span>
          </template>

          <template #cell-createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>

          <template #cell-status="{ row }">
            <span
              :class="getStatusClass(row.status)"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border"
            >
              {{ row.status }}
            </span>
          </template>
        </UiDataTable>

        <!-- Pagination Controls -->
        <div class="px-4 py-3 flex items-center justify-between border-t border-line bg-[#FAFAFA]">
          <div class="text-[11px] text-ink-soft">
            Menampilkan halaman <span class="font-semibold">{{ page }}</span> dari total <span class="font-semibold">{{ Math.ceil(total / perPage) }}</span> halaman (Total: {{ total }} data)
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="text-xs px-2.5 py-1 rounded border border-line bg-white hover:bg-gray-50 transition-all font-semibold disabled:opacity-50"
              :disabled="page <= 1"
              @click="prev"
            >
              Prev
            </button>
            <button
              type="button"
              class="text-xs px-2.5 py-1 rounded border border-line bg-white hover:bg-gray-50 transition-all font-semibold disabled:opacity-50"
              :disabled="page * perPage >= total"
              @click="next"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </UiCard>

    <!-- Create / Edit Form Modal -->
    <Teleport to="body">
      <UiModal
        v-model="showFormModal"
        :title="isEdit ? 'Edit Paid Leave Request' : 'Add Paid Leave Request'"
        size="lg"
      >
        <form @submit.prevent="onSubmit" class="space-y-4 text-xs">
          <!-- Paid Leave Type -->
          <UiFormField label="Paid Leave Type" required>
            <select
              v-model="form.paidLeaveType"
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1"
              required
            >
              <option value="">Pilih Tipe Cuti</option>
              <option value="cuti tahunan">Cuti Tahunan</option>
              <option value="cuti khusus">Cuti Khusus</option>
            </select>
          </UiFormField>

          <!-- Dates (From & To) - Date-only fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UiFormField label="Start Date" required>
              <UiDatePicker
                v-model="form.validFrom"
                placeholder="Pilih Tanggal Mulai"
              />
            </UiFormField>

            <UiFormField label="End Date" required>
              <UiDatePicker
                v-model="form.validTo"
                placeholder="Pilih Tanggal Selesai"
              />
            </UiFormField>
          </div>

          <!-- Paid Leave Count & Day Off Count -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UiFormField label="Paid Leave Count (Hari)" required>
              <input
                type="number"
                min="0"
                v-model="form.paidLeaveCount"
                placeholder="Jumlah hari cuti..."
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1"
                required
              />
            </UiFormField>

            <UiFormField label="Day Off Count (Hari)" required>
              <input
                type="number"
                min="0"
                v-model="form.dayOffCount"
                placeholder="Jumlah hari libur..."
                class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1"
                required
              />
            </UiFormField>
          </div>

          <!-- Address (Alamat Selama Cuti) -->
          <UiFormField label="Address (Alamat Selama Cuti)">
            <textarea
              v-model="form.address"
              rows="2"
              placeholder="Tuliskan alamat lengkap selama cuti..."
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 resize-none"
            />
          </UiFormField>

          <!-- Description (Alasan Cuti) -->
          <UiFormField label="Description (Alasan Cuti)" required>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Tuliskan alasan pengajuan cuti secara spesifik..."
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 resize-none"
              required
            />
            <span class="text-red-600 text-[10.5px] mt-1 block font-medium leading-normal">
              * Mohon isi keterangan detail cuti dengan lebih spesifik, HRD tidak menerima penulisan alasan karena kepentingan / keperluan pribadi
            </span>
          </UiFormField>

          <!-- Person Responsible (Select dropdown filtered by Team) -->
          <UiFormField label="Person Responsible (Nama Pihak Bertanggung Jawab)" required>
            <select
              v-model="form.personResponsibleId"
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1"
              required
            >
              <option value="">Pilih Penanggung Jawab (Rekan Tim)</option>
              <option v-for="emp in teamEmployees" :key="emp.id" :value="String(emp.id)">
                {{ emp.fullName }} ({{ emp.employeeCode }})
              </option>
            </select>
          </UiFormField>

          <!-- Task (Pekerjaan yang Didelegasikan) -->
          <UiFormField label="Task (Pekerjaan yang Didelegasikan)">
            <textarea
              v-model="form.task"
              rows="2"
              placeholder="Tuliskan tugas atau pekerjaan yang didelegasikan..."
              class="w-full text-xs px-3 py-2 border border-line rounded-lg bg-white text-ink outline-none focus:border-topbar-1 resize-none"
            />
          </UiFormField>

          <!-- Footer Actions -->
          <div class="flex justify-end gap-2 border-t border-line pt-4 mt-2">
            <button
              type="button"
              class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all"
              @click="showFormModal = false"
              :disabled="submitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              :disabled="submitting"
            >
              <Save class="w-4 h-4" />
              <span>{{ submitting ? 'Saving...' : 'Save' }}</span>
            </button>
          </div>
        </form>
      </UiModal>
    </Teleport>
  </div>
</template>
