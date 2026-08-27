<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Search, RefreshCw, Eye, Edit2, Trash2, Download, X, Plus } from 'lucide-vue-next'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Asset Master',
})

const router = useRouter()
const { confirm } = useConfirm()

// Columns declaration matching specifications
const columns: DataTableColumn[] = [
  { key: 'code', label: 'ARF Number' },
  { key: 'pt', label: 'PT' },
  { key: 'manufacture', label: 'Manufacture' },
  { key: 'room', label: 'Room' },
  { key: 'personResponsible', label: 'Person Responsible' },
  { key: 'condition', label: 'Condition' },
  { key: 'location', label: 'Location' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
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

const conditionOptions = [
  { id: 'excellent', label: 'Excellent' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
  { id: 'broken', label: 'Broken' },
]

const statusOptions = [
  { id: 'active', label: 'Active' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'disposed', label: 'Disposed' },
]

const categoryOptions = [
  { id: 'asuransi', label: 'Asuransi' },
  { id: 'asset', label: 'Asset' },
  { id: 'sewa', label: 'Sewa' },
]

// Local Filter States
const filterSearch = ref('')
const filterRoom = ref<string[]>([])
const filterPt = ref<string[]>([])
const filterManufacturer = ref<string[]>([])
const filterLocation = ref('')
const filterCategory = ref('')
const filterMonth = ref('')
const filterYear = ref('')
const filterCodes = ref<string[]>([])
const assetCodeInput = ref('')

function addAssetCodeTag() {
  const val = assetCodeInput.value.trim().toUpperCase()
  if (val && !filterCodes.value.includes(val)) {
    filterCodes.value.push(val)
  }
  assetCodeInput.value = ''
}

function onAssetCodeKeydown(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === ',') {
    e.preventDefault()
    addAssetCodeTag()
  } else if (e.key === 'Backspace' && !assetCodeInput.value) {
    filterCodes.value.pop()
  }
}

function removeAssetCodeTag(idx: number) {
  filterCodes.value.splice(idx, 1)
}

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
    const res = await useApi<any>('/api/v1/assets', {
      query: {
        ...params,
        search: filterSearch.value,
        roomId: filterRoom.value.join(','),
        ptId: filterPt.value.join(','),
        manufactureId: filterManufacturer.value.join(','),
        location: filterLocation.value.trim(),
        category: filterCategory.value,
        month: filterMonth.value,
        year: filterYear.value,
        codes: filterCodes.value.join(','),
      },
    })
    return res
  },
  { defaultPerPage: 10 }
)

// Handle Detail View
function openDetail(row: any) {
  router.push(`/hr/asset/${row.id}`)
}

// Handle Edit
function openEdit(row: any) {
  router.push(`/hr/asset/${row.id}/edit`)
}

// Delete Asset
async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Aset?',
    text: `Aset "${row.name}" (${row.code}) akan dihapus secara soft-delete.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/assets/${row.id}`, { method: 'DELETE' })
    toast.success('Aset berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus aset')
  }
}

// Export CSV
async function onExport() {
  try {
    const res = await useApi<any>('/api/v1/assets/export', {
      query: {
        search: filterSearch.value,
        roomId: filterRoom.value.join(','),
        ptId: filterPt.value.join(','),
        manufactureId: filterManufacturer.value.join(','),
        location: filterLocation.value.trim(),
        month: filterMonth.value,
        year: filterYear.value,
        codes: filterCodes.value.join(','),
      },
    })
    const dataList = res.data || []

    let csvContent = 'arf_number,pt_code,pt_name,manufacture_name,room_name,purchase_from,purchase_end,economic_age,person_responsible,condition,location,status,description,price\n'
    for (const r of dataList) {
      csvContent += `"${r.code || ''}","${r.ptCode || ''}","${r.ptName || ''}","${r.manufactureName || ''}","${r.roomName || ''}","${r.purchaseFromDate || ''}","${r.purchaseToDate || ''}","${r.economicAge || ''}","${r.personResponsible || ''}","${r.condition || ''}","${r.location || ''}","${r.status || ''}","${r.description || ''}","${r.price || '0'}"\n`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `asset_master_export_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Data aset berhasil diekspor')
  } catch (e: any) {
    toast.error('Gagal mengekspor data aset')
  }
}

function applyFilters() {
  page.value = 1
  fetch()
}

function resetFilters() {
  filterSearch.value = ''
  filterRoom.value = []
  filterPt.value = []
  filterManufacturer.value = []
  filterLocation.value = ''
  filterCategory.value = ''
  filterMonth.value = ''
  filterYear.value = ''
  filterCodes.value = []
  assetCodeInput.value = ''
  applyFilters()
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Assets" breadcrumb="HR / Assets">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-[#F08050] bg-white border border-[#F08050] hover:bg-[#FFF3EE] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="router.push('/hr/asset/depreciation')"
        >
          <RefreshCw class="w-4 h-4" />
          <span>Penyusutan Aset</span>
        </button>

        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="onExport"
        >
          <Download class="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Search</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Name, ARF, or Desc..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="applyFilters"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- Asset Code Filter (Ignorance criteria) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider text-red-500">Asset Code (Prioritas)</label>
          <div
            class="w-full min-h-[36px] text-xs px-3 py-1 border border-line rounded-lg bg-white text-ink flex flex-wrap items-center gap-1.5 focus-within:border-topbar-1"
          >
            <span
              v-for="(code, idx) in filterCodes"
              :key="code"
              class="inline-flex items-center gap-1 bg-[#FFF3EE] text-topbar-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            >
              {{ code }}
              <button type="button" class="leading-none text-topbar-1 font-bold hover:text-red-500" @click="removeAssetCodeTag(idx)">&#10005;</button>
            </span>
            <input
              v-model="assetCodeInput"
              placeholder="Ketik & Enter..."
              class="flex-1 min-w-[100px] outline-none border-none bg-transparent py-1 text-xs text-ink"
              @keydown.enter.prevent="addAssetCodeTag"
              @keydown="onAssetCodeKeydown"
              @blur="addAssetCodeTag"
            />
          </div>
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

        <!-- Room Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Room</label>
          <UiSelectSearch
            v-model="filterRoom"
            endpoint="/api/v1/master-data/rooms"
            placeholder="All Room"
            :multiple="true"
          />
        </div>

        <!-- Manufacturer Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Manufacturer</label>
          <UiSelectSearch
            v-model="filterManufacturer"
            endpoint="/api/v1/master-data/manufacturers"
            placeholder="All Manufacturer"
            :multiple="true"
          />
        </div>

        <!-- Location Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Location</label>
          <input
            v-model="filterLocation"
            placeholder="Cari lokasi..."
            class="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
            @keyup.enter="applyFilters"
          />
        </div>

        <!-- Month Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Month Created</label>
          <UiSelectSearch
            v-model="filterMonth"
            :options="months"
            placeholder="Select Month"
            :multiple="false"
          />
        </div>

        <!-- Year Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Year Created</label>
          <UiSelectSearch
            v-model="filterYear"
            :options="years"
            placeholder="Select Year"
            :multiple="false"
          />
        </div>

        <!-- Category Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Category</label>
          <UiSelectSearch
            v-model="filterCategory"
            :options="categoryOptions"
            placeholder="All Category"
            :multiple="false"
          />
        </div>
      </div>

      <!-- Filter Actions -->
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

    <!-- Datatable Section -->
    <UiCard class="overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-24 bg-white rounded-xl border border-line">
        <span class="text-xs text-ink-soft animate-pulse">Memuat data aset...</span>
      </div>

      <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada data aset yang ditemukan.</p>
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

          <!-- Cell formatting slots -->
          <template #cell-code="{ row }">
            <span class="font-semibold text-ink">{{ row.code }}</span>
          </template>

          <template #cell-pt="{ row }">
            <span class="text-ink" :title="row.pt?.name">{{ row.pt?.code || '-' }}</span>
          </template>

          <template #cell-manufacture="{ row }">
            <span class="text-ink">{{ row.manufacture?.name || '-' }}</span>
          </template>

          <template #cell-room="{ row }">
            <span class="text-ink">{{ row.room?.name || '-' }}</span>
          </template>

          <template #cell-economicAge="{ row }">
            <span class="font-medium">{{ row.economicAge }} Tahun</span>
          </template>

          <template #cell-condition="{ row }">
            <span class="text-xs uppercase font-semibold text-ink-soft">{{ row.condition }}</span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
              :class="row.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'"
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

<style scoped>
.calendar-grid {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
  gap: 3px !important;
}
</style>
