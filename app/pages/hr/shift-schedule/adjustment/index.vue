<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search, Eye, Edit2, Trash2, Download, Upload, Info } from 'lucide-vue-next'
import { useDataTable } from '~/composables/useDataTable'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

const { confirm } = useConfirm()

const columns: DataTableColumn[] = [
  { key: 'employeeCode', label: 'NIK' },
  { key: 'employeeName', label: 'Fullname' },
  { key: 'team', label: 'Team' },
  { key: 'adjustmentDate', label: 'Adjustment Date' },
  { key: 'shift', label: 'Shift (Jam Masuk - Jam Pulang)' },
  { key: 'isOff', label: 'Off?' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'status', label: 'Status' },
]

// Custom Filter Options with "All" option
const isOffOptions = [
  { id: '', label: 'Semua Status' },
  { id: '1', label: 'OFF / Libur' },
  { id: '0', label: 'Non-OFF / Masuk' },
]

const months = [
  { id: '', label: 'Semua Bulan' },
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

// Local Filter States initialized to "All" (empty string)
const filterSearch = ref('')
const filterIsOff = ref('')
const filterMonth = ref('') // Default to "All"
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
} = useDataTable<any>(
  async (params) => {
    const res = await useApi<any>('/api/v1/shift-schedule/adjustment', {
      query: {
        ...params,
        search: filterSearch.value,
        isOff: filterIsOff.value,
        month: filterMonth.value,
        year: filterYear.value,
      },
    })
    return res
  },
  { defaultPerPage: 10 }
)

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return dateStr.split('T')[0]
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '00:00'
  return timeStr.slice(0, 5) // Display HH:MM
}

async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Penyesuaian Jadwal?',
    text: `Penyesuaian jadwal untuk "${row.employee?.fullName}" pada tanggal ${formatDate(row.adjustmentDate)} akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/shift-schedule/adjustment/${row.id}`, { method: 'DELETE' })
    toast.success('Penyesuaian jadwal berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus penyesuaian jadwal')
  }
}

function applyFilters() {
  page.value = 1
  fetch()
}

function resetFilters() {
  filterSearch.value = ''
  filterIsOff.value = ''
  filterMonth.value = ''
  filterYear.value = String(new Date().getFullYear())
  applyFilters()
}

// Export feature
async function onExport() {
  try {
    const res = await useApi<any>('/api/v1/shift-schedule/adjustment/export')
    const dataList = res.data || []
    
    let csvContent = 'nik,employee_name,adjustment_date,shift_code,shift_name,is_off,status,created_at,created_by\n'
    for (const r of dataList) {
      csvContent += `"${r.nik || r.employeeCode || ''}","${r.fullName || ''}","${r.adjustmentDate}","${r.shiftCode || ''}","${r.shiftName || ''}","${r.isOff ? 'Yes' : 'No'}","${r.status}","${r.createdAt}","${r.creatorFullName || ''}"\n`
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `schedule_adjustment_export_${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Data penyesuaian berhasil diekspor')
  } catch (e: any) {
    toast.error('Gagal mengekspor data penyesuaian')
  }
}

// Download Import Template
function downloadTemplate() {
  const headers = 'nik,adjustment_date,shift_code,is_off\n'
  const example = 'NIK001,2026-08-10,S1,No\n'
  const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'template_schedule_adjustment.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Template CSV berhasil diunduh')
}

// Import handler
function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    try {
      const text = e.target?.result as string
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
      if (lines.length <= 1) {
        toast.error('File CSV kosong atau tidak memiliki baris data')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
      const rowsList = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        const row: any = {}
        headers.forEach((header, idx) => {
          const cleanHeader = header.toLowerCase().replace(/[\s_]/g, '')
          if (cleanHeader === 'nik') row.nik = values[idx]
          else if (cleanHeader === 'adjustmentdate') row.adjustmentDate = values[idx]
          else if (cleanHeader === 'shiftcode' || cleanHeader === 'codeshift') row.shiftCode = values[idx]
          else if (cleanHeader === 'isoff') row.isOff = values[idx]
        })
        rowsList.push(row)
      }

      const res = await useApi<any>('/api/v1/shift-schedule/adjustment/import', {
        method: 'POST',
        body: { rows: rowsList },
      })

      toast.success(`Berhasil mengimpor ${res.data?.importedCount || 0} penyesuaian jadwal`)
      fetch()
    } catch (err: any) {
      toast.error(err?.data?.statusMessage || 'Gagal mengimpor file CSV')
    } finally {
      input.value = '' // Reset input
    }
  }

  reader.readAsText(file)
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <UiPageHeader title="Schedule Adjustment" breadcrumb="Dashboard / Shift Schedule / Adjustment">
      <template #actions>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs px-3.5 py-2 font-semibold text-ink bg-white border border-line hover:bg-gray-50 rounded-lg flex items-center gap-1.5 transition-all"
            @click="downloadTemplate"
          >
            <Download class="w-3.5 h-3.5 text-ink-soft" />
            <span>Template CSV</span>
          </button>
          
          <label
            class="text-xs px-3.5 py-2 font-semibold text-ink bg-white border border-line hover:bg-gray-50 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload class="w-3.5 h-3.5 text-ink-soft" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" class="hidden" @change="handleImport" />
          </label>

          <button
            type="button"
            class="text-xs px-3.5 py-2 font-semibold text-ink bg-white border border-line hover:bg-gray-50 rounded-lg flex items-center gap-1.5 transition-all"
            @click="onExport"
          >
            <Download class="w-3.5 h-3.5 text-ink-soft" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            @click="navigateTo('/hr/shift-schedule/adjustment/new')"
          >
            <Plus class="w-4 h-4" />
            <span>Add Schedule Adjustment</span>
          </button>
        </div>
      </template>
    </UiPageHeader>

    <!-- Filter Section -->
    <div class="bg-white border border-line rounded-xl shadow-sm p-4 my-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <!-- Search bar -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Cari Karyawan</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              placeholder="Nama atau NIK..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="applyFilters"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <!-- OFF / Non-OFF Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Status Libur (OFF)</label>
          <UiSelectSearch
            v-model="filterIsOff"
            :options="isOffOptions"
            placeholder="Semua Status"
          />
        </div>

        <!-- Month Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Bulan</label>
          <UiSelectSearch
            v-model="filterMonth"
            :options="months"
            placeholder="Pilih Bulan"
          />
        </div>

        <!-- Year Filter -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Tahun</label>
          <UiSelectSearch
            v-model="filterYear"
            :options="years"
            placeholder="Pilih Tahun"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          class="text-xs px-3.5 py-1.5 font-semibold text-ink-soft hover:text-ink transition-colors"
          @click="resetFilters"
        >
          Reset Filter
        </button>
        <button
          type="button"
          class="text-xs px-4 py-1.5 font-semibold text-white bg-topbar-1 hover:bg-topbar-2 rounded-lg shadow-sm transition-all"
          @click="applyFilters"
        >
          Terapkan
        </button>
      </div>
    </div>

    <!-- Data Table Card -->
    <UiCard class="overflow-hidden my-4">
      <UiDataTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :page="page"
        :perPage="perPage"
        :total="total"
        @prev="prev"
        @next="next"
      >
        <!-- Table Action Dropdown (Row actions) -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/hr/shift-schedule/adjustment/${row.id}/edit`"
            class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-ink hover:bg-[#FAFAFA]"
          >
            <Edit2 class="w-3 h-3" />
            <span>Edit</span>
          </NuxtLink>
          <button
            type="button"
            class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-[#FAFAFA] border-t border-line"
            @click="onDelete(row)"
          >
            <Trash2 class="w-3 h-3" />
            <span>Delete</span>
          </button>
        </template>

        <!-- Custom Table Cell Slots -->
        <template #cell-employeeCode="{ row }">
          <span class="font-semibold text-ink">{{ row.employee?.employeeCode || '-' }}</span>
        </template>
        <template #cell-employeeName="{ row }">
          <span class="font-bold text-ink">{{ row.employee?.fullName }}</span>
        </template>
        <template #cell-team="{ row }">
          <span class="font-bold text-ink">{{ row.employee?.team?.name || '-' }}</span>
        </template>
        <template #cell-adjustmentDate="{ row }">
          <span class="text-xs text-ink font-semibold">{{ formatDate(row.adjustmentDate) }}</span>
        </template>
        <template #cell-shift="{ row }">
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 text-[11px] font-bold bg-gray-100 text-ink rounded border border-line">
              {{ row.shift?.code }}
            </span>
            <span class="text-ink text-xs">
              ({{ formatTime(row.shift?.shiftIn) }} - {{ formatTime(row.shift?.shiftOut) }})
            </span>
          </div>
        </template>
        <template #cell-isOff="{ row }">
          <UiStatusBadge :status="row.isOff === 1 ? 'OFF' : 'Masuk'" />
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-xs text-ink-soft">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #cell-createdBy="{ row }">
          <span class="text-xs text-ink-soft">{{ row.createdByVal }}</span>
        </template>
        <template #cell-status="{ row }">
          <UiStatusBadge :status="row.status" />
        </template>
      </UiDataTable>
    </UiCard>
  </div>
</template>
