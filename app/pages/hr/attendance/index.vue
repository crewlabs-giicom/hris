<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { Search, Loader2, RefreshCw, Download, Play, Info } from 'lucide-vue-next'
import Swal from 'sweetalert2'

definePageMeta({ middleware: ['auth'] })

const { confirm } = useConfirm()

// Date lists
const months = [
  { id: 1, label: 'Januari' },
  { id: 2, label: 'Februari' },
  { id: 3, label: 'Maret' },
  { id: 4, label: 'April' },
  { id: 5, label: 'Mei' },
  { id: 6, label: 'Juni' },
  { id: 7, label: 'Juli' },
  { id: 8, label: 'Agustus' },
  { id: 9, label: 'September' },
  { id: 10, label: 'Oktober' },
  { id: 11, label: 'November' },
  { id: 12, label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

// Filters (persisted in sessionStorage to survive page tab switching)
const filterMonth = useSessionStorage('attendance_filter_month', new Date().getMonth() + 1)
const filterYear = useSessionStorage('attendance_filter_year', currentYear)
const filterSearch = useSessionStorage('attendance_filter_search', '')
const filterTeam = useSessionStorage('attendance_filter_team', 0)
const filterStatus = useSessionStorage('attendance_filter_status', 'active')
const filterShift = useSessionStorage('attendance_filter_shift', 'all')

// Options
const teamsList = ref<{ id: number; name: string }[]>([])
const loadingTeams = ref(false)

// Data states
const items = ref<any[]>([])
const loading = ref(false)

// Pagination
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / perPage.value))

// Generate loading per employee
const generatingSingleId = ref<number | null>(null)
const generatingBulk = ref(false)

// Fetch Teams
async function fetchTeams() {
  loadingTeams.value = true
  try {
    const res = await useApi<any>('/api/v1/master-data/teams')
    if (res && res.data) {
      teamsList.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch teams:', err)
  } finally {
    loadingTeams.value = false
  }
}

// Fetch Consolidation Data
async function fetchData() {
  loading.value = true
  try {
    const res = await useApi<any>('/api/v1/attendance', {
      query: {
        page: page.value,
        perPage: perPage.value,
        month: filterMonth.value,
        year: filterYear.value,
        search: filterSearch.value,
        teamId: filterTeam.value || undefined,
        status: filterStatus.value,
        shift: filterShift.value
      }
    })
    if (res) {
      items.value = res.data || []
      total.value = res.meta?.total || 0
    }
  } catch (err: any) {
    Swal.fire('Error', err.message || 'Gagal memuat data absensi.', 'error')
  } finally {
    loading.value = false
  }
}

// Dynamic columns based on month/year selected
const daysList = computed(() => {
  const daysInMonth = new Date(filterYear.value, filterMonth.value, 0).getDate()
  const dates: { day: number; formatted: string }[] = []
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(filterYear.value, filterMonth.value - 1, d)
    const dayName = weekdays[dt.getDay()]
    const monthName = monthsShort[dt.getMonth()]
    dates.push({
      day: d,
      formatted: `${dayName}, ${d} ${monthName}`
    })
  }
  return dates
})

// Trigger Bulk Generate
async function handleBulkGenerate() {
  const ok = await confirm({
    title: 'Generate Absensi Bulanan?',
    text: `Data rekap kehadiran untuk semua karyawan pada bulan ${months.find(m => m.id === filterMonth.value)?.label} ${filterYear.value} akan dikalkulasi ulang.`,
    confirmText: 'Generate',
    danger: false
  })

  if (!ok) return

  generatingBulk.value = true
  try {
    const res = await useApi<any>('/api/v1/attendance/generate', {
      method: 'POST',
      body: {
        month: filterMonth.value,
        year: filterYear.value
      }
    })
    if (res.success) {
      Swal.fire('Sukses', res.message, 'success')
      fetchData()
    }
  } catch (err: any) {
    Swal.fire('Gagal', err.message || 'Proses generate gagal.', 'error')
  } finally {
    generatingBulk.value = false
  }
}

// Trigger Single Generate
async function handleSingleGenerate(emp: any) {
  generatingSingleId.value = emp.employeeId
  try {
    const res = await useApi<any>('/api/v1/attendance/generate', {
      method: 'POST',
      body: {
        month: filterMonth.value,
        year: filterYear.value,
        employeeId: emp.employeeId
      }
    })
    if (res.success) {
      Swal.fire('Sukses', `Berhasil generate absensi untuk ${emp.fullName}`, 'success')
      fetchData()
    }
  } catch (err: any) {
    Swal.fire('Gagal', err.message || 'Proses generate gagal.', 'error')
  } finally {
    generatingSingleId.value = null
  }
}

// Watch filters
watch([filterMonth, filterYear, filterTeam, filterStatus, filterShift], () => {
  page.value = 1
  fetchData()
})

// Helper to find daily log in details
function getDayLog(row: any, day: number) {
  const dayStr = `${filterYear.value}-${String(filterMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return row.days?.find((d: any) => d.date === dayStr) || null
}

function formatCurrency(val: any) {
  const num = Number(val) || 0
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

function getKetClass(title: string) {
  if (!title) return ''
  const t = title.toUpperCase()
  if (t.startsWith('T -') || t.includes('TELAT') || t.includes('TF')) return 'text-amber-600 bg-amber-50 font-semibold rounded px-1'
  if (t === 'ALPHA' || t.startsWith('MS -') || t.startsWith('PC -')) return 'text-rose-600 bg-rose-50 font-semibold rounded px-1'
  if (t === 'OFF' || t === 'GUDANG') return 'text-slate-500 bg-slate-100 rounded px-1'
  if (t === 'CUTI' || t === 'SAKIT' || t === 'IZIN') return 'text-sky-600 bg-sky-50 rounded px-1'
  return ''
}

onMounted(() => {
  fetchTeams()
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-ink">Attendance Consolidation</h1>
        <p class="text-sm text-slate-500">Monitoring and calculate monthly attendance deductions & statistics.</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <UiButton
          variant="secondary"
          disabled
          class="flex items-center gap-1.5 opacity-50"
        >
          <Download class="w-4 h-4" />
          Export Salary Form
        </UiButton>
        <UiButton
          variant="secondary"
          disabled
          class="flex items-center gap-1.5 opacity-50"
        >
          <RefreshCw class="w-4 h-4" />
          Get Attendance
        </UiButton>
        <UiButton
          variant="primary"
          :disabled="generatingBulk"
          @click="handleBulkGenerate"
          class="flex items-center gap-1.5"
        >
          <Play v-if="!generatingBulk" class="w-4 h-4" />
          <Loader2 v-else class="w-4 h-4 animate-spin" />
          Generate Attendance
        </UiButton>
      </div>
    </div>

    <!-- Filters Section -->
    <UiCard class="p-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <!-- Month -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Month</label>
          <select
            v-model="filterMonth"
            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option v-for="m in months" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>

        <!-- Year -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Year</label>
          <select
            v-model="filterYear"
            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Team -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Team</label>
          <select
            v-model="filterTeam"
            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option :value="0">All Teams</option>
            <option v-for="t in teamsList" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <!-- Employee Status -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Employee Status</label>
          <select
            v-model="filterStatus"
            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <!-- Shift Type -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Shift Type</label>
          <select
            v-model="filterShift"
            class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All</option>
            <option value="fixed">Fixed Shift</option>
            <option value="non-fixed">Non-Fixed Shift</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Search Employee</label>
          <div class="relative">
            <input
              v-model="filterSearch"
              type="text"
              placeholder="Search Name/NIK..."
              @keyup.enter="fetchData"
              class="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Search class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </UiCard>

    <!-- Table Section -->
    <UiCard class="overflow-hidden">
      <!-- Loading indicator -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <span class="text-sm font-medium text-slate-500">Memuat data absensi...</span>
      </div>

      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center p-12 text-slate-400">
        <Info class="w-12 h-12 mb-3 opacity-30" />
        <span class="text-sm font-medium">Tidak ada data absensi untuk periode/filter ini.</span>
      </div>

      <div v-else class="relative overflow-x-auto border border-slate-200 rounded-lg max-h-[600px] overflow-y-auto">
        <table class="w-full border-collapse text-left text-xs text-slate-700">
          <thead class="sticky top-0 bg-slate-100 z-30 shadow-[0_2px_2px_rgba(0,0,0,0.05)] border-b border-slate-200">
            <!-- First Header Row: Column categories -->
            <tr>
              <th colspan="10" class="th-frozen-header text-center font-bold text-slate-700 bg-slate-200 border-r border-slate-300">
                EMPLOYEE & DEDUCTION SUMMARY (IDR)
              </th>
              <th v-for="col in daysList" :key="col.day" colspan="2" class="px-3 py-2 text-center border-r border-slate-200 font-semibold bg-slate-150">
                {{ col.formatted }}
              </th>
            </tr>
            <!-- Second Header Row: Subheaders -->
            <tr class="bg-slate-50 text-[10px] uppercase font-bold text-slate-600">
              <th class="sticky left-0 bg-slate-50 z-20 px-2 py-2 border-r border-slate-200 min-w-[50px] text-center">Aksi</th>
              <th class="sticky left-[50px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[210px]">Employee</th>
              <th class="sticky left-[260px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[100px]">NIK</th>
              <th class="sticky left-[360px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[100px] text-right">Pot. Kehadiran</th>
              <th class="sticky left-[460px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[100px] text-right">Pot. Lain-lain</th>
              <th class="sticky left-[560px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[100px] text-right">Pot. Alpha</th>
              <th class="sticky left-[660px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[100px] text-right">Pot. Telat Form</th>
              <th class="sticky left-[760px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[110px] text-right">Pot. Punishment</th>
              <th class="sticky left-[870px] bg-slate-50 z-20 px-3 py-2 border-r border-slate-200 min-w-[110px] text-right">Pot. Tanpa Finger</th>
              <th class="sticky left-[980px] bg-slate-100 z-20 px-3 py-2 border-r border-slate-300 min-w-[125px] text-right text-rose-700">Total Potongan</th>

              <template v-for="col in daysList" :key="col.day">
                <th class="px-2 py-2 border-r border-slate-200 text-center min-w-[80px]">Jam</th>
                <th class="px-2 py-2 border-r border-slate-200 text-center min-w-[80px]">Ket</th>
              </template>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50/70 transition-colors">
              <!-- Aksi (Single Generate button) - Pojok Kiri, Icon-only -->
              <td class="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-2 py-2 border-r border-slate-200 text-center">
                <UiButton
                  size="xs"
                  variant="secondary"
                  :disabled="generatingSingleId === row.employeeId"
                  @click="handleSingleGenerate(row)"
                  class="p-1 min-w-0 font-semibold text-amber-600 hover:text-amber-700 border border-slate-200 shadow-sm rounded-full"
                  title="Hitung Ulang"
                >
                  <RefreshCw class="w-3.5 h-3.5" :class="{'animate-spin': generatingSingleId === row.employeeId}" />
                </UiButton>
              </td>

              <!-- Employee (Avatar bulat + Kotak Merah link) -->
              <td class="sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <img
                    :src="row.photoPath ? (row.photoPath.startsWith('/') ? row.photoPath : '/' + row.photoPath) : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}&background=random`"
                    class="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover"
                    alt="avatar"
                  />
                  <div>
                    <NuxtLink
                      :to="`/master/employees/${row.employeeId}`"
                      class="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      {{ row.fullName }}
                    </NuxtLink>
                    <div class="text-[10px] text-slate-500 font-normal">Team: <span class="font-bold text-slate-700">{{ row.teamName || '-' }}</span></div>
                  </div>
                </div>
              </td>

              <!-- NIK (Plain Text) -->
              <td class="sticky left-[260px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 font-mono text-slate-600 font-bold">
                {{ row.employeeCode }}
              </td>

              <!-- Deductions -->
              <td class="sticky left-[360px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.potJamRp) }}
              </td>
              <td class="sticky left-[460px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.potDaRp) }}
              </td>
              <td class="sticky left-[560px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.punishmentAlphaRp) }}
              </td>
              <td class="sticky left-[660px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.punishmentFormLateRp) }}
              </td>
              <td class="sticky left-[760px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.punishmentRp) }}
              </td>
              <td class="sticky left-[870px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2 border-r border-slate-200 text-right font-mono">
                {{ formatCurrency(row.punishmentNoFingerRp) }}
              </td>
              <td class="sticky left-[980px] bg-rose-50/50 group-hover:bg-rose-50 z-10 px-3 py-2 border-r border-slate-300 text-right font-bold text-rose-600 font-mono">
                {{ formatCurrency(row.totalPotongan) }}
              </td>

              <!-- Daily columns loop -->
              <template v-for="col in daysList" :key="col.day">
                <td class="px-2 py-1.5 border-r border-slate-100 text-center font-mono">
                  <template v-if="getDayLog(row, col.day)">
                    <div class="text-[10px] text-slate-800">
                      {{ getDayLog(row, col.day).clockIn || '-' }}
                    </div>
                    <div class="text-[10px] text-slate-500 border-t border-slate-50 pt-0.5 mt-0.5">
                      {{ getDayLog(row, col.day).clockOut || '-' }}
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-slate-300">-</span>
                  </template>
                </td>

                <td class="px-2 py-1.5 border-r border-slate-200 text-center font-medium leading-tight">
                  <template v-if="getDayLog(row, col.day)">
                    <div class="flex flex-col gap-0.5 items-center justify-center">
                      <span v-if="getDayLog(row, col.day).titleIn" :class="getKetClass(getDayLog(row, col.day).titleIn)" class="text-[9px]">
                        {{ getDayLog(row, col.day).titleIn }}
                      </span>
                      <span v-if="getDayLog(row, col.day).titleOut" :class="getKetClass(getDayLog(row, col.day).titleOut)" class="text-[9px]">
                        {{ getDayLog(row, col.day).titleOut }}
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-slate-300">-</span>
                  </template>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Pagination -->
    <div v-if="totalPages > 1 && !loading" class="flex items-center justify-between">
      <span class="text-xs text-slate-500">
        Showing {{ (page - 1) * perPage + 1 }} to {{ Math.min(page * perPage, total) }} of {{ total }} records
      </span>
      <div class="flex items-center gap-1">
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="page === 1"
          @click="page--; fetchData()"
        >
          Previous
        </UiButton>
        <span class="px-3 text-xs font-semibold">Page {{ page }} of {{ totalPages }}</span>
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="page === totalPages"
          @click="page++; fetchData()"
        >
          Next
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-slate-150 {
  background-color: #f1f5f9;
}

/* Ensure sticky columns remain stacked cleanly */
.th-frozen-header {
  position: sticky;
  left: 0;
  z-index: 35;
}

th.sticky {
  z-index: 31;
}

/* Keep sticky column items aligned */
td.sticky {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.02);
}
</style>
