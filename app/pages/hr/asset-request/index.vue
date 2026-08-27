<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useRouter, useRoute } from 'vue-router'
import { Search, RefreshCw, Eye, Edit2, Trash2, Plus } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Asset Requests',
})

const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()
const tabsStore = usePageTabsStore()

// Columns matching the requirements (NIK is changed to Employee Code)
const columns: DataTableColumn[] = [
  { key: 'employeeCode', label: 'Employee Code' },
  { key: 'teamName', label: 'Team' },
  { key: 'employeeFullName', label: 'Requester Name' },
  { key: 'code', label: 'Code Asset Request' },
  { key: 'roomName', label: 'Room' },
  { key: 'ptCode', label: 'PTCode' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'requestDate', label: 'Request Date' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'status', label: 'Status' },
]

const statusOptions = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
]

// Filter States
const filterSearch = ref('')
const filterStatus = ref('')
const filterPt = ref<string[]>([])
const filterTeam = ref<string[]>([])
const filterArfNumber = ref('')

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
    const res = await useApi<any>('/api/v1/asset-requests', {
      query: {
        ...params,
        search: filterSearch.value,
        status: filterStatus.value,
        ptId: filterPt.value.join(','),
        teamId: filterTeam.value.join(','),
        arfNumber: filterArfNumber.value.trim(),
      },
    })
    return res
  },
  { defaultPerPage: 10 }
)

// Actions
function openDetail(row: any) {
  router.push(`/hr/asset-request/${row.id}`)
}

function openCreate() {
  router.push('/hr/asset-request/new')
}

function openEdit(row: any) {
  router.push(`/hr/asset-request/${row.id}/edit`)
}

async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Pengajuan?',
    text: `Pengajuan "${row.code}" akan dihapus secara soft-delete.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/asset-requests/${row.id}`, { method: 'DELETE' })
    toast.success('Pengajuan berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus pengajuan')
  }
}

function applyFilters() {
  page.value = 1
  fetch()
}

function resetFilters() {
  filterSearch.value = ''
  filterStatus.value = ''
  filterPt.value = []
  filterTeam.value = []
  filterArfNumber.value = ''
  applyFilters()
}

onMounted(() => {
  fetch()
})

// Watch tabs structure and keep tab title updated
const pagePath = route.path
watch(
  () => tabsStore.tabs,
  (newTabs) => {
    const activeTab = newTabs.find((t) => t.path === pagePath)
    if (activeTab) {
      activeTab.title = 'Asset Requests'
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Asset Requests" breadcrumb="HR / Asset Requests">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="openCreate"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Pengajuan Baru</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <!-- Search bar -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Search</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Code, Requester, Desc..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="applyFilters"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- Status Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Status</label>
          <UiSelectSearch
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="All Status"
            :multiple="false"
          />
        </div>

        <!-- Team Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Team</label>
          <UiSelectSearch
            v-model="filterTeam"
            endpoint="/api/v1/master-data/teams"
            placeholder="All Team"
            :multiple="true"
          />
        </div>

        <!-- PT Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">PT (Company)</label>
          <UiSelectSearch
            v-model="filterPt"
            endpoint="/api/v1/master-data/companies"
            placeholder="All PT"
            :multiple="true"
          />
        </div>

        <!-- ARF / Code Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">ARF / Request Code</label>
          <input
            v-model="filterArfNumber"
            placeholder="Ketik kode/ARF..."
            class="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
            @keyup.enter="applyFilters"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          class="text-xs px-3 py-1.5 font-semibold text-ink-soft bg-white border border-line rounded-lg hover:bg-gray-50 transition-all"
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

    <!-- Data Table Card -->
    <UiCard class="overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-24 bg-white rounded-xl border border-line">
        <span class="text-xs text-ink-soft animate-pulse">Memuat data pengajuan...</span>
      </div>

      <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada data pengajuan aset yang ditemukan.</p>
      </div>

      <template v-else>
        <UiDataTable
          :columns="columns"
          :rows="rows"
        >
          <!-- Row actions -->
          <template #row-actions="{ row }">
            <button
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
              @click="openDetail(row)"
            >
              <Eye class="w-3.5 h-3.5 text-ink-soft" />
              <span>Detail</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
              @click="openEdit(row)"
            >
              <Edit2 class="w-3.5 h-3.5 text-ink-soft" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-[#FAFAFA] border-t border-line"
              @click="onDelete(row)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </template>

          <!-- Custom cells -->
          <template #cell-code="{ row }">
            <span class="font-semibold text-ink font-mono">{{ row.code }}</span>
          </template>

          <template #cell-employeeCode="{ row }">
            <span class="text-ink font-semibold">{{ row.employeeCode || '-' }}</span>
          </template>

          <template #cell-ptCode="{ row }">
            <span class="text-ink font-semibold">{{ row.ptCode }}</span>
          </template>

          <template #cell-category="{ row }">
            <span class="text-ink capitalize font-medium">{{ row.category === 'penambahan' ? 'Penambahan' : 'Pengganti' }}</span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize border"
              :class="{
                'bg-yellow-50 text-yellow-600 border-yellow-200': row.status === 'pending',
                'bg-blue-50 text-blue-600 border-blue-200': row.status === 'approved',
                'bg-green-50 text-green-600 border-green-200': row.status === 'completed',
                'bg-red-50 text-red-600 border-red-200': row.status === 'rejected',
              }"
            >
              {{ row.status }}
            </span>
          </template>
        </UiDataTable>

        <UiPagination
          :from="total === 0 ? 0 : (page - 1) * perPage + 1"
          :to="Math.min(page * perPage, total)"
          :total="total"
          :per-page="perPage"
          @prev="prev"
          @next="next"
          @update:per-page="setPerPage"
        />
      </template>
    </UiCard>
  </div>
</template>
