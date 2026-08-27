<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Plus, Search, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-vue-next'
import { useDataTable } from '~/composables/useDataTable'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

const { confirm } = useConfirm()

// Columns declaration matching specifications
const columns: DataTableColumn[] = [
  { key: 'employeeCode', label: 'NIK' },
  { key: 'team', label: 'Team' },
  { key: 'employeeName', label: 'Nama Karyawan' },
  { key: 'validFrom', label: 'Start (Valid From)' },
  { key: 'validTo', label: 'End (Valid To)' },
  { key: 'permissionType', label: 'Permission Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'status', label: 'Status' },
]

// Custom Filter Options
const statusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const permissionCategories = [
  { id: '4', label: 'Tidak Masuk / Sakit tidak ada SKD' },
  { id: '5', label: 'Pulang Cepat' },
  { id: '6', label: 'Masuk Siang' },
  { id: '9', label: 'Izin Khusus' },
  { id: '10', label: 'Sakit ada SKD' },
  { id: '12', label: 'Keluar saat jam kerja' },
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

// Local Filter States (Status, Team, Category are multiple filters)
const filterSearch = ref('')
const filterStatus = ref<string[]>([])
const filterTeam = ref<string[]>([])
const filterCategory = ref<string[]>([])
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
    const res = await useApi<any>('/api/v1/permissions', {
      query: {
        ...params,
        search: filterSearch.value,
        status: filterStatus.value.join(','),
        teamId: filterTeam.value.join(','),
        permissionsTypeId: filterCategory.value.join(','),
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

// Action Handlers
async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Izin?',
    text: `Pengajuan izin "${row.employee?.fullName}" akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/permissions/${row.id}`, { method: 'DELETE' })
    toast.success('Pengajuan izin berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus pengajuan izin')
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
  filterCategory.value = []
  filterMonth.value = String(new Date().getMonth() + 1)
  filterYear.value = String(new Date().getFullYear())
  applyFilters()
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Permissions" breadcrumb="Dashboard / Permissions / Permission List">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="navigateTo('/hr/permission/new')"
        >
          <Plus class="w-4 h-4" />
          <span>Add Permission</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Search</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Name, NIK, or Reason..."
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

        <!-- Category Filter (Multiple Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Category</label>
          <UiSelectSearch
            v-model="filterCategory"
            :options="permissionCategories"
            placeholder="All Category"
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

      <!-- Action Buttons -->
      <div class="flex justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
          @click="resetFilters"
        >
          RESET
        </button>
        <button
          type="button"
          class="text-xs px-5 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          @click="applyFilters"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>APPLY FILTERS</span>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <UiCard>
      <div v-if="loading" class="flex justify-center items-center py-16">
        <span class="text-xs text-ink-soft animate-pulse">Memuat data pengajuan izin...</span>
      </div>

      <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada pengajuan izin yang ditemukan.</p>
      </div>

      <template v-else>
        <!-- Custom row rendering mapping joined fields -->
        <UiDataTable :columns="columns" :rows="rows">
          <!-- Row actions -->
          <template #row-actions="{ row }">
            <!-- Edit page - opens in new tab - only visible if active -->
            <NuxtLink
              v-if="row.status === 'active'"
              :to="`/hr/permission/${row.id}/edit`"
              target="_blank"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
            >
              <Edit2 class="w-3 h-3" />
              <span>Edit</span>
            </NuxtLink>

            <!-- Show page - opens in new tab - only visible if active -->
            <NuxtLink
              v-if="row.status === 'active'"
              :to="`/hr/permission/${row.id}`"
              target="_blank"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
            >
              <Eye class="w-3 h-3" />
              <span>Show</span>
            </NuxtLink>

            <!-- Delete action -->
            <button
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-[#FAFAFA] border-t border-line"
              @click="onDelete(row)"
            >
              <Trash2 class="w-3 h-3" />
              <span>Delete</span>
            </button>
          </template>

          <!-- Custom cell mappings -->
          <template #cell-employeeCode="{ row }">
            <span class="font-semibold text-ink">{{ row.employee?.employeeCode || '-' }}</span>
          </template>

          <template #cell-team="{ row }">
            <span class="text-ink">{{ row.employee?.team?.name || '-' }}</span>
          </template>

          <template #cell-employeeName="{ row }">
            <span class="font-medium text-ink">{{ row.employee?.fullName || '-' }}</span>
          </template>

          <template #cell-validFrom="{ row }">
            {{ formatDateTime(row.validFrom) }}
          </template>

          <template #cell-validTo="{ row }">
            {{ formatDateTime(row.validTo) }}
          </template>

          <template #cell-permissionType="{ row }">
            <span class="text-ink-soft font-medium">{{ row.permissionType?.name || '-' }}</span>
          </template>

          <template #cell-reason="{ row }">
            <span class="truncate max-w-[200px] block" :title="row.description">{{ row.description || '-' }}</span>
          </template>

          <template #cell-createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>

          <template #cell-status="{ row }">
            <span
              :class="getStatusClass(row.status)"
              class="text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block uppercase tracking-wider"
            >
              {{ row.status }}
            </span>
          </template>
        </UiDataTable>

        <!-- Pagination -->
        <UiPagination
          :from="(page - 1) * perPage + 1"
          :to="Math.min(page * perPage, total)"
          :total="total"
          @prev="prev"
          @next="next"
        />
      </template>
    </UiCard>
  </div>
</template>
