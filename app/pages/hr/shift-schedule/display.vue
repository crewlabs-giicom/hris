<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { Search, Loader2, Download, Play, Info } from 'lucide-vue-next'
import Swal from 'sweetalert2'

definePageMeta({ middleware: ['auth'] })

const { confirm } = useConfirm()

// Date lists
const months = [
  { id: 1, label: 'Jan' },
  { id: 2, label: 'Feb' },
  { id: 3, label: 'Mar' },
  { id: 4, label: 'Apr' },
  { id: 5, label: 'May' },
  { id: 6, label: 'Jun' },
  { id: 7, label: 'Jul' },
  { id: 8, label: 'Aug' },
  { id: 9, label: 'Sep' },
  { id: 10, label: 'Oct' },
  { id: 11, label: 'Nov' },
  { id: 12, label: 'Dec' },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

// Filters (Persisted in sessionStorage to survive page tab switching)
const filterSearch = useSessionStorage('shift_display_filter_search', '')
const filterMonth = useSessionStorage('shift_display_filter_month', new Date().getMonth() + 1)
const filterYear = useSessionStorage('shift_display_filter_year', currentYear)
const filterTeam = useSessionStorage('shift_display_filter_team', 0)
const filterStatus = useSessionStorage('shift_display_filter_status', 'active')
const filterShift = useSessionStorage('shift_display_filter_shift', 'all')

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

// Loading states for actions
const generatingNonFix = ref(false)
const generatingFix = ref(false)
const generatingNewFix = ref(false)

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

// Fetch Shift Display Data
async function fetchData() {
  loading.value = true
  try {
    const res = await useApi<any>('/api/v1/attendance/shift-display', {
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
    Swal.fire('Error', err.message || 'Gagal memuat jadwal shift.', 'error')
  } finally {
    loading.value = false
  }
}

// Generate Shifts API call
async function handleGenerateShift(type: 'non-fixed' | 'fixed' | 'new-fixed') {
  let title = ''
  let label = ''
  if (type === 'non-fixed') {
    title = 'Generate Non Fix Shift?'
    label = 'Non Fix'
    generatingNonFix.value = true
  } else if (type === 'fixed') {
    title = 'Generate Fix Shift?'
    label = 'Fix'
    generatingFix.value = true
  } else {
    title = 'Generate New Fix Employee Shift?'
    label = 'New Fix Employee'
    generatingNewFix.value = true
  }

  const ok = await confirm({
    title,
    text: `Jadwal shift ${label} untuk karyawan pada bulan ${months.find(m => m.id === filterMonth.value)?.label} ${filterYear.value} akan digenerate otomatis.`,
    confirmText: 'Generate',
    danger: false
  })

  if (!ok) {
    generatingNonFix.value = false
    generatingFix.value = false
    generatingNewFix.value = false
    return
  }

  try {
    const res = await useApi<any>('/api/v1/attendance/generate-shift', {
      method: 'POST',
      body: {
        month: filterMonth.value,
        year: filterYear.value,
        type
      }
    })
    if (res.success) {
      Swal.fire('Sukses', res.message, 'success')
      fetchData()
    }
  } catch (err: any) {
    Swal.fire('Gagal', err.message || 'Proses generate gagal.', 'error')
  } finally {
    generatingNonFix.value = false
    generatingFix.value = false
    generatingNewFix.value = false
  }
}

// Dynamic columns for dates list
const daysList = computed(() => {
  const daysInMonth = new Date(filterYear.value, filterMonth.value, 0).getDate()
  const dates: { day: number; formatted: string }[] = []
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthsShort = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] // fallback mapping matching display

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(filterYear.value, filterMonth.value - 1, d)
    const dayName = weekdays[dt.getDay()]
    const monthLabel = months.find(m => m.id === filterMonth.value)?.label || 'Aug'
    dates.push({
      day: d,
      formatted: `${dayName}, ${d} ${monthLabel}`
    })
  }
  return dates
})

// Watch filters
watch([filterMonth, filterYear, filterTeam, filterStatus, filterShift], () => {
  page.value = 1
  fetchData()
})

function getDayLog(row: any, day: number) {
  return row.days?.find((d: any) => d.day === day) || null
}

onMounted(() => {
  fetchTeams()
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <div class="text-xs text-slate-500 flex items-center gap-1">
      <span>Dashboard</span>
      <span>/</span>
      <span>Schedule</span>
      <span>/</span>
      <span class="font-semibold text-slate-700">Shift Display</span>
    </div>

    <!-- Header Grid: Left Filter Card and Right Button Card side-by-side -->
    <div class="grid-container">
      <!-- Left Card: Filters (Green Box) -->
      <UiCard class="left-card p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
        <div class="space-y-4">
          <!-- Input Row 1 -->
          <div class="input-grid">
            <div>
              <input
                v-model="filterSearch"
                type="text"
                placeholder="Search..."
                @keyup.enter="fetchData"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <select
                v-model="filterMonth"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option v-for="m in months" :key="m.id" :value="m.id">{{ m.label }}</option>
              </select>
            </div>
            <div>
              <select
                v-model="filterYear"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <!-- Input Row 2 -->
          <div class="input-grid">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Team :</label>
              <select
                v-model="filterTeam"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option :value="0">All</option>
                <option v-for="t in teamsList" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Status :</label>
              <select
                v-model="filterStatus"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">ALL</option>
                <option value="active">ACTIVE</option>
                <option value="resigned">RESIGNED</option>
                <option value="terminated">TERMINATED</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Shift :</label>
              <select
                v-model="filterShift"
                class="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">ALL</option>
                <option value="fixed">FIX</option>
                <option value="non-fixed">NON FIX</option>
              </select>
            </div>
          </div>
        </div>
      </UiCard>

      <!-- Right Card: Buttons (Red Box) -->
      <UiCard class="right-card p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col gap-2">
        <button
          @click="fetchData"
          style="background-color: #10b981 !important; color: #ffffff !important;"
          class="w-full h-10 font-bold rounded-lg text-sm shadow-sm transition-colors uppercase tracking-wider hover:opacity-90"
        >
          Terapkan Filter
        </button>
        <button
          disabled
          style="background-color: #0ea5e9 !important; color: #ffffff !important; opacity: 0.6;"
          class="w-full h-10 font-bold rounded-lg text-sm shadow-sm uppercase tracking-wider cursor-not-allowed"
        >
          Export
        </button>
        <button
          @click="handleGenerateShift('non-fixed')"
          :disabled="generatingNonFix"
          style="background-color: #e11d48 !important; color: #ffffff !important;"
          class="w-full h-10 font-bold rounded-lg text-sm shadow-sm transition-colors uppercase tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5"
        >
          <Loader2 v-if="generatingNonFix" class="w-4 h-4 animate-spin" />
          Generate Non Fix
        </button>
        <button
          @click="handleGenerateShift('fixed')"
          :disabled="generatingFix"
          style="background-color: #64748b !important; color: #ffffff !important;"
          class="w-full h-10 font-bold rounded-lg text-sm shadow-sm transition-colors uppercase tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5"
        >
          <Loader2 v-if="generatingFix" class="w-4 h-4 animate-spin" />
          Generate Fix
        </button>
        <button
          @click="handleGenerateShift('new-fixed')"
          :disabled="generatingNewFix"
          style="background-color: #f59e0b !important; color: #ffffff !important;"
          class="w-full h-10 font-bold rounded-lg text-sm shadow-sm transition-colors uppercase tracking-wider hover:opacity-90 flex items-center justify-center gap-1.5"
        >
          <Loader2 v-if="generatingNewFix" class="w-4 h-4 animate-spin" />
          Generate New Fix Employee
        </button>
      </UiCard>
    </div>

    <!-- Table Grid display -->
    <UiCard class="overflow-hidden bg-white border border-slate-200 shadow-sm rounded-xl">
      <!-- Loading indicator -->
      <div v-if="loading" class="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 class="w-8 h-8 animate-spin text-primary" />
        <span class="text-sm font-medium text-slate-500">Memuat jadwal shift...</span>
      </div>

      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center p-12 text-slate-400">
        <Info class="w-12 h-12 mb-3 opacity-30" />
        <span class="text-sm font-medium">Tidak ada data jadwal shift untuk periode/filter ini.</span>
      </div>

      <div v-else class="relative overflow-x-auto border border-slate-200 rounded-lg max-h-[600px] overflow-y-auto">
        <table class="w-full border-collapse text-left text-xs text-slate-700">
          <thead class="sticky top-0 bg-slate-100 z-30 shadow-[0_2px_2px_rgba(0,0,0,0.05)] border-b border-slate-200">
            <tr class="bg-slate-50 text-[10px] uppercase font-bold text-slate-600">
              <th class="sticky left-0 bg-slate-50 z-20 px-3 py-3 border-r border-slate-200 min-w-[210px]">Employee</th>
              <th class="sticky left-[210px] bg-slate-50 z-20 px-3 py-3 border-r border-slate-200 min-w-[100px]">NIK</th>

              <template v-for="col in daysList" :key="col.day">
                <th class="px-2 py-3 border-r border-slate-200 text-center min-w-[80px] font-bold">{{ col.formatted }}</th>
                <th class="px-2 py-3 border-r border-slate-200 text-center min-w-[50px] font-bold">Ket</th>
              </template>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50/70 transition-colors">
              <!-- Employee (Avatar bulat + Kotak Merah link) -->
              <td class="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-3 py-2.5 border-r border-slate-200 font-medium">
                <div class="flex items-center gap-2">
                  <img
                    :src="row.photoPath ? (row.photoPath.startsWith('/') ? row.photoPath : '/' + row.photoPath) : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}&background=random`"
                    class="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover"
                    alt="avatar"
                  />
                  <div>
                    <NuxtLink
                      :to="`/master/employees/${row.id}`"
                      class="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      {{ row.fullName }}
                    </NuxtLink>
                    <div class="text-[10px] text-slate-500 font-normal">Team: <span class="font-bold text-slate-700">{{ row.teamName || '-' }}</span></div>
                  </div>
                </div>
              </td>

              <!-- NIK (Plain Text) -->
              <td class="sticky left-[210px] bg-white group-hover:bg-slate-50 z-10 px-3 py-2.5 border-r border-slate-200 font-mono text-slate-600 font-bold">
                {{ row.employeeCode }}
              </td>

              <!-- Daily columns loop -->
              <template v-for="col in daysList" :key="col.day">
                <!-- Date Shift hours (Top red / Bottom blue matching mockup) -->
                <td class="px-2 py-2 border-r border-slate-100 text-center font-mono">
                  <template v-if="getDayLog(row, col.day)">
                    <template v-if="getDayLog(row, col.day).display === 'OFF'">
                      <span class="text-slate-400 font-bold">OFF</span>
                    </template>
                    <template v-else-if="getDayLog(row, col.day).display.includes('\n')">
                      <div class="text-[10px] text-rose-500 font-bold">
                        {{ getDayLog(row, col.day).display.split('\n')[0] }}
                      </div>
                      <div class="text-[10px] text-blue-500 font-bold border-t border-slate-50 pt-0.5 mt-0.5">
                        {{ getDayLog(row, col.day).display.split('\n')[1] }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-slate-500 font-semibold">{{ getDayLog(row, col.day).display }}</span>
                    </template>
                  </template>
                  <template v-else>
                    <span class="text-slate-300">-</span>
                  </template>
                </td>

                <!-- Ket Column (red x or blank) -->
                <td class="px-2 py-2 border-r border-slate-200 text-center font-bold text-rose-600 text-sm">
                  <template v-if="getDayLog(row, col.day) && getDayLog(row, col.day).ket === 'x'">
                    <span>&times;</span>
                  </template>
                  <template v-else>
                    <span>&nbsp;</span>
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
        <button
          :disabled="page === 1"
          @click="page--; fetchData()"
          class="h-8 px-3 border border-slate-200 hover:bg-slate-100 rounded text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          Previous
        </button>
        <span class="px-3 text-xs font-semibold">Page {{ page }} of {{ totalPages }}</span>
        <button
          :disabled="page === totalPages"
          @click="page++; fetchData()"
          class="h-8 px-3 border border-slate-200 hover:bg-slate-100 rounded text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-slate-150 {
  background-color: #f1f5f9;
}

/* Scoped layouts to bypass Tailwind watcher issues for new directories */
.grid-container {
  display: grid !important;
  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
  gap: 24px !important;
  align-items: start !important;
  width: 100% !important;
}

.left-card {
  grid-column: span 9 / span 9 !important;
}

.right-card {
  grid-column: span 3 / span 3 !important;
}

.input-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 16px !important;
}

@media (max-width: 1023px) {
  .grid-container {
    grid-template-columns: 1fr !important;
  }
  .left-card, .right-card {
    grid-column: span 12 / span 12 !important;
  }
}

/* Ensure sticky columns remain stacked cleanly */
th.sticky {
  z-index: 22;
}

/* Keep sticky column items aligned */
td.sticky {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.02);
}
</style>
