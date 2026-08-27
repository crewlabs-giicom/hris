<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { RefreshCw, ArrowLeft, Search, HelpCircle, Download } from 'lucide-vue-next'
import { usePageTabsStore } from '~/stores/pageTabs'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Penyusutan Aset',
})

const router = useRouter()
const route = useRoute()
const tabsStore = usePageTabsStore()

const assets = ref<any[]>([])
const columns = ref<any[]>([])
const history = ref<any[]>([])
const loading = ref(true)
const generating = ref(false)

// Filters State
const filterSearch = ref('')
const filterPt = ref<string[]>([])
const filterRoom = ref<string[]>([])
const filterManufacturer = ref<string[]>([])
const filterLocation = ref('')
const filterCategory = ref('')

const categoryOptions = [
  { id: 'asuransi', label: 'Asuransi' },
  { id: 'asset', label: 'Asset' },
  { id: 'sewa', label: 'Sewa' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await useApi<any>('/api/v1/assets/depreciations', {
      query: {
        search: filterSearch.value,
        ptId: filterPt.value.join(','),
        roomId: filterRoom.value.join(','),
        manufactureId: filterManufacturer.value.join(','),
        location: filterLocation.value.trim(),
        category: filterCategory.value,
      },
    })
    assets.value = res.data.assets
    columns.value = res.data.columns
    history.value = res.data.history
  } catch (e) {
    toast.error('Gagal mengambil data penyusutan aset')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterSearch.value = ''
  filterPt.value = []
  filterRoom.value = []
  filterManufacturer.value = []
  filterLocation.value = ''
  filterCategory.value = ''
  fetchData()
}

// Next month to process calculations
const nextPendingMonthLabel = computed(() => {
  if (history.value.length === 0) {
    const now = new Date()
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }
  const latest = new Date(history.value[0].periodDate)
  latest.setMonth(latest.getMonth() + 1)
  return latest.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

const nextPendingMonthDateKey = computed(() => {
  if (history.value.length === 0) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  const latest = new Date(history.value[0].periodDate)
  latest.setMonth(latest.getMonth() + 1)
  return `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}-01`
})

const { confirm } = useConfirm()

async function handleGenerate() {
  const isConfirmed = await confirm({
    title: 'Generate Depresiasi Aset',
    message: `Apakah Anda yakin ingin memproses depresiasi aset untuk periode bulan ${nextPendingMonthLabel.value}?`,
  })

  if (!isConfirmed) return

  generating.value = true
  try {
    const res = await useApi<any>('/api/v1/assets/depreciations/generate', {
      method: 'POST',
      body: {
        periodDate: nextPendingMonthDateKey.value,
      },
    })
    toast.success(`Berhasil! ${res.data.totalAssets} aset disusutkan untuk periode ${nextPendingMonthLabel.value}`)
    fetchData()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal melakukan generate depresiasi')
  } finally {
    generating.value = false
  }
}

// Format period e.g. "2026-08-01" to "Agustus 2026"
function formatPeriod(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

// Format datetime e.g. "2026-08-24T14:00:00.000Z" to "24 Agt 2026, 14:00"
function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Export CSV
function onExport() {
  if (assets.value.length === 0) {
    toast.error('Tidak ada data penyusutan untuk diekspor')
    return
  }

  try {
    let csvContent = 'kategori,pt,divisi,nama_aset,tanggal_beli,tanggal_habis,no_aset,umur_ekonomis,kali_susut,sisa_umur,harga_perolehan,nilai_sisa_manfaat'
    for (const col of columns.value) {
      csvContent += `,${col.label}`
    }
    csvContent += '\n'

    for (const r of assets.value) {
      let rowStr = `"${r.category || ''}","${r.ptCode || ''}","${r.divisionName || ''}","${r.name || ''}","${r.purchaseFromDate || ''}","${r.purchaseToDate || ''}","${r.code || ''}","${r.economicAge} Bln","${r.kaliDisusutkan}","${r.sisaMasaManfaat} Bln","${r.price || '0'}","${r.nilaiSisaManfaat || '0'}"`
      
      for (const col of columns.value) {
        const val = r.monthlyValues[col.dateKey] || 0
        rowStr += `,${val}`
      }
      csvContent += rowStr + '\n'
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `asset_depreciation_export_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Laporan depresiasi aset berhasil diekspor')
  } catch (e) {
    toast.error('Gagal mengekspor laporan penyusutan')
  }
}

onMounted(() => {
  fetchData()
})

// Watch tabs structure and keep tab title updated
const pagePath = route.path
watch(
  () => tabsStore.tabs,
  (newTabs) => {
    const activeTab = newTabs.find((t) => t.path === pagePath)
    if (activeTab) {
      activeTab.title = 'Penyusutan Aset'
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Penyusutan & Depresiasi Aset" breadcrumb="HR / Assets / Depreciation">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink-soft bg-white border border-line hover:bg-gray-50 rounded-lg transition-all flex items-center gap-1.5"
          @click="router.push('/hr/asset')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Kembali ke Master Aset</span>
        </button>

        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-ink bg-white border border-line hover:bg-gray-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          :disabled="loading"
          @click="onExport"
        >
          <Download class="w-4 h-4" />
          <span>Export Excel</span>
        </button>
        
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-topbar-1 hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          :disabled="generating || loading"
          @click="handleGenerate"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': generating }" />
          <span>Generate Depresiasi ({{ nextPendingMonthLabel }})</span>
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Pencarian</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Cari nama aset, kode..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="fetchData"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- PT Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">PT (Company)</label>
          <UiSelectSearch
            v-model="filterPt"
            endpoint="/api/v1/master-data/companies"
            placeholder="Semua PT"
            :multiple="true"
          />
        </div>

        <!-- Room Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Ruangan</label>
          <UiSelectSearch
            v-model="filterRoom"
            endpoint="/api/v1/master-data/rooms"
            placeholder="Semua Ruangan"
            :multiple="true"
          />
        </div>

        <!-- Manufacturer Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Pabrikan</label>
          <UiSelectSearch
            v-model="filterManufacturer"
            endpoint="/api/v1/master-data/manufacturers"
            placeholder="Semua Pabrikan"
            :multiple="true"
          />
        </div>

        <!-- Location Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Lokasi</label>
          <input
            v-model="filterLocation"
            placeholder="Cari lokasi..."
            class="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
            @keyup.enter="fetchData"
          />
        </div>

        <!-- Category Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Kategori</label>
          <UiSelectSearch
            v-model="filterCategory"
            :options="categoryOptions"
            placeholder="Semua Kategori"
            :multiple="false"
          />
        </div>
      </div>

      <!-- Action Buttons -->
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
          @click="fetchData"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          <span>Terapkan Filter</span>
        </button>
      </div>
    </div>

    <!-- Pivot Table Card Section -->
    <UiCard class="p-6 overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-24 bg-white rounded-xl border border-line">
        <span class="text-xs text-ink-soft animate-pulse">Memuat laporan penyusutan aset...</span>
      </div>

      <div v-else-if="!assets.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada data aset yang ditemukan untuk disusutkan.</p>
      </div>

      <template v-else>
        <!-- Combined Split-Pane Tables for Freeze-Pane effect -->
        <div class="flex border border-line rounded-xl overflow-hidden bg-white shadow-sm max-w-full">
          <!-- Left Fixed Master Table -->
          <div class="shrink-0 border-r border-line bg-white overflow-x-auto max-w-[50vw] sm:max-w-[70vw] lg:max-w-none">
            <table class="text-xs text-left border-collapse table-fixed">
              <thead class="bg-gray-50 border-b border-line text-ink-soft uppercase tracking-wider font-semibold text-[9.5px] whitespace-nowrap">
                <tr class="h-12">
                  <th class="p-3 border-r border-line w-24">Kategori</th>
                  <th class="p-3 border-r border-line w-14">PT</th>
                  <th class="p-3 border-r border-line w-20">DIV</th>
                  <th class="p-3 border-r border-line w-48">Nama Aset</th>
                  <th class="p-3 border-r border-line text-center w-24">Tanggal Beli</th>
                  <th class="p-3 border-r border-line text-center w-24">Tanggal Habis</th>
                  <th class="p-3 border-r border-line w-28">No. Aset</th>
                  <th class="p-3 border-r border-line text-center w-20">Umur Eko</th>
                  <th class="p-3 border-r border-line text-center w-20">Kali Susut</th>
                  <th class="p-3 border-r border-line text-center w-20">Sisa Umur</th>
                  <th class="p-3 border-r border-line text-right w-32">Harga Perolehan</th>
                  <th class="p-3 border-r border-line text-right w-36 bg-[#F9FBF9] text-green-700">Nilai Sisa Manfaat</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in assets"
                  :key="row.id"
                  class="h-12 border-b border-line hover:bg-gray-50/80 transition-colors text-[11px] whitespace-nowrap"
                >
                  <td class="p-3 border-r border-line capitalize font-semibold text-ink-soft bg-white">{{ row.category }}</td>
                  <td class="p-3 border-r border-line font-bold text-topbar-1">{{ row.ptCode }}</td>
                  <td class="p-3 border-r border-line">{{ row.divisionName }}</td>
                  <td class="p-3 border-r border-line font-bold truncate max-w-[190px]" :title="row.name">
                    <NuxtLink :to="`/hr/asset/${row.id}`" class="text-topbar-1 hover:underline cursor-pointer">
                      {{ row.name }}
                    </NuxtLink>
                  </td>
                  <td class="p-3 border-r border-line text-center font-mono text-ink-soft">{{ row.purchaseFromDate }}</td>
                  <td class="p-3 border-r border-line text-center font-mono text-ink-soft">{{ row.purchaseToDate }}</td>
                  <td class="p-3 border-r border-line font-mono">{{ row.code }}</td>
                  <td class="p-3 border-r border-line text-center font-medium">{{ row.economicAge }} Bln</td>
                  <td class="p-3 border-r border-line text-center font-semibold text-blue-600 bg-blue-50/30">{{ row.kaliDisusutkan }}</td>
                  <td
                    class="p-3 border-r border-line text-center font-bold"
                    :class="row.sisaMasaManfaat === 0 ? 'text-red-500 bg-red-50/20' : 'text-ink-soft'"
                  >
                    {{ row.sisaMasaManfaat }} Bln
                  </td>
                  <td class="p-3 border-r border-line text-right font-mono font-semibold">
                    Rp {{ Number(row.price).toLocaleString('id-ID') }}
                  </td>
                  <td class="p-3 border-r border-line text-right font-mono font-bold text-green-600 bg-[#F5FBF5]">
                    Rp {{ Number(row.nilaiSisaManfaat).toLocaleString('id-ID') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Right Scrollable Monthly Table -->
          <div class="flex-1 overflow-x-auto bg-[#FAFAFA]">
            <table class="text-xs text-left border-collapse table-fixed">
              <thead class="bg-gray-50 border-b border-line text-topbar-1 uppercase tracking-wider font-semibold text-[9.5px] whitespace-nowrap">
                <tr class="h-12">
                  <th
                    v-for="col in columns"
                    :key="col.dateKey"
                    class="p-3 border-r border-line text-right bg-[#FFF9F6] font-mono w-[110px]"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in assets"
                  :key="row.id"
                  class="h-12 border-b border-line hover:bg-gray-50/80 transition-colors text-[11px] whitespace-nowrap"
                >
                  <td
                    v-for="col in columns"
                    :key="col.dateKey"
                    class="p-3 border-r border-line text-right font-mono font-semibold w-[110px]"
                    :class="row.monthlyValues[col.dateKey] ? 'text-ink bg-white' : 'text-line bg-gray-50/50'"
                  >
                    {{ row.monthlyValues[col.dateKey] ? 'Rp ' + row.monthlyValues[col.dateKey].toLocaleString('id-ID') : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </UiCard>

    <!-- Execution History Section -->
    <UiCard class="p-5 mt-6 border border-line rounded-xl bg-white shadow-sm" v-if="!loading">
      <div class="flex items-center justify-between mb-3 border-b border-line pb-2">
        <h3 class="text-xs font-bold text-ink uppercase tracking-wider text-topbar-1">
          Riwayat Eksekusi Depresiasi
        </h3>
      </div>
      <div class="overflow-x-auto rounded-lg border border-line">
        <table class="min-w-full text-xs text-left border-collapse">
          <thead class="bg-gray-50 border-b border-line text-ink-soft font-semibold text-[10px] uppercase">
            <tr>
              <th class="p-2.5 border-r border-line">Periode Bulan</th>
              <th class="p-2.5 border-r border-line">Tanggal & Waktu Eksekusi</th>
              <th class="p-2.5 border-r border-line">Nama Executor (Admin)</th>
              <th class="p-2.5 border-r border-line text-center">Jumlah Aset Diproses</th>
              <th class="p-2.5 border-r border-line text-right">Total Akumulasi Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in history" :key="run.id" class="border-b border-line hover:bg-gray-50/80 transition-colors">
              <td class="p-2.5 border-r border-line font-bold text-ink">{{ formatPeriod(run.periodDate) }}</td>
              <td class="p-2.5 border-r border-line font-mono text-ink-soft">{{ formatDateTime(run.createdAt) }}</td>
              <td class="p-2.5 border-r border-line font-semibold text-ink-soft">{{ run.executorName }}</td>
              <td class="p-2.5 border-r border-line text-center font-medium">{{ run.totalAssets }} Aset</td>
              <td class="p-2.5 border-r border-line text-right font-mono font-bold text-green-600 bg-green-50/10">
                Rp {{ Number(run.totalAmount).toLocaleString('id-ID') }}
              </td>
            </tr>
            <tr v-if="!history.length">
              <td colspan="5" class="p-4 text-center text-ink-soft bg-canvas">Belum ada riwayat generate penyusutan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
