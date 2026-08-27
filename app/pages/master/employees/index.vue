<script setup lang="ts">
import { toast } from 'vue-sonner'
import { LayoutGrid, List, UserX, Printer } from 'lucide-vue-next'
import { useGlobalFilterStore } from '~/stores/globalFilter'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  status: number
  photoPath: string | null
  joinDate: string | null
  department?: { name: string } | null
  position?: { title: string } | null
  team?: { name: string } | null
  company?: { name: string; code: string } | null
  division?: { name: string } | null
}

const columns: DataTableColumn[] = [
  { key: 'employeeCode', label: 'Kode/NIK', sortable: true },
  { key: 'fullName', label: 'Nama Lengkap', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'company', label: 'PT' },
  { key: 'department', label: 'Departemen' },
  { key: 'division', label: 'Divisi' },
  { key: 'team', label: 'Team' },
  { key: 'position', label: 'Posisi' },
  { key: 'status', label: 'Status' },
]

const rows = ref<Employee[]>([])
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const { confirm } = useConfirm()

// Global Filter Store
const globalFilter = useGlobalFilterStore()

// Custom Filters (Local to this page)
const filterName = ref('')
const filterNik = ref('')

// Open Dropdown ID for Card Menu
const openMenuId = ref<string | null>(null)

// Custom Status Filter for Employee Database
const employeeStatusOptions = [
  { id: '0', label: 'Inactive' },
  { id: '1', label: 'Active' },
  { id: '2', label: 'Unclear' },
  { id: '3', label: 'Freelance' },
  { id: '4', label: 'Internship' },
]

// Status label and colors mapping (0-4)
const statusMap: Record<number, { label: string; colorClass: string }> = {
  0: { label: 'INACTIVE', colorClass: 'text-red-600' },
  1: { label: 'ACTIVE', colorClass: 'text-green-600' },
  2: { label: 'UNCLEAR', colorClass: 'text-orange-600' },
  3: { label: 'FREELANCE', colorClass: 'text-purple-600' },
  4: { label: 'INTERNSHIP', colorClass: 'text-blue-600' },
}

const getCompanyColor = (code?: string) => {
  if (!code) return 'bg-gray-200 text-gray-700'
  const upper = code.toUpperCase()
  if (upper === 'GIM') return 'bg-[#C084FC] text-white' // Ungu
  if (upper === 'BII') return 'bg-[#FEF08A] text-yellow-800' // Kuning
  if (upper === 'SUM') return 'bg-[#D1D5DB] text-gray-800' // Abu-abu
  if (upper === 'IAM') return 'bg-[#78350F] text-white' // Coklat
  return 'bg-[#FFF3EE] text-topbar-1 font-bold'
}

function formatJoinDate(dateStr: string | null) {
  if (!dateStr) return 'Join -'
  const date = new Date(dateStr)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `Join ${day} ${month} ${year}`
}

async function fetchEmployees() {
  loading.value = true
  openMenuId.value = null
  try {
    const params: Record<string, any> = {
      status: globalFilter.status,
      companyId: globalFilter.companyId,
      teamId: globalFilter.teamId,
      positionId: globalFilter.positionId,
      fullName: filterName.value,
      employeeCode: filterNik.value,
    }
    const res = await useApi<{ data: Employee[] }>('/api/v1/employees', { query: params })
    rows.value = res.data
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal memuat data karyawan')
  } finally {
    loading.value = false
  }
}

async function onDelete(row: Employee) {
  openMenuId.value = null
  const ok = await confirm({
    title: 'Hapus karyawan?',
    text: `"${row.fullName}" akan di-nonaktifkan (soft delete).`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/employees/${row.id}`, { method: 'DELETE' })
    toast.success('Karyawan berhasil dihapus')
    await fetchEmployees()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus karyawan')
  }
}

async function onInactive(row: Employee) {
  openMenuId.value = null
  const ok = await confirm({
    title: 'Nonaktifkan karyawan?',
    text: `Status "${row.fullName}" akan diubah menjadi Inactive.`,
    confirmText: 'Nonaktifkan',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/employees/${row.id}`, {
      method: 'PUT',
      body: { status: 0 }
    })
    toast.success('Karyawan berhasil dinonaktifkan')
    await fetchEmployees()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal mengubah status karyawan')
  }
}

function onPrint(row: Employee) {
  openMenuId.value = null
  window.open(`/master/employees/${row.id}?print=true`, '_blank')
}

const showAddDropdown = ref(false)

function navigateAdd(type: string) {
  showAddDropdown.value = false
  navigateTo(`/master/employees/new?type=${type}`)
}

function closeDropdown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (openMenuId.value && !target.closest('.card-menu-container')) {
    openMenuId.value = null
  }
  if (showAddDropdown.value && !target.closest('.add-employee-dropdown-container')) {
    showAddDropdown.value = false
  }
}

onMounted(() => {
  fetchEmployees()
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div>
    <!-- Page Header & Action Buttons -->
    <UiPageHeader title="Employee Database" breadcrumb="Dashboard / HR Data / Employee Database">
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- View Switcher -->
          <div class="flex bg-white border border-line rounded-lg overflow-hidden mr-3">
            <button
              type="button"
              class="p-2 hover:bg-[#FAFAFA]"
              :class="viewMode === 'grid' ? 'bg-orange-50 text-topbar-1 font-semibold' : 'text-ink-soft'"
              title="Grid View"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 hover:bg-[#FAFAFA] border-l border-line"
              :class="viewMode === 'list' ? 'bg-orange-50 text-topbar-1 font-semibold' : 'text-ink-soft'"
              title="List/Table View"
              @click="viewMode = 'list'"
            >
              <List class="w-4 h-4" />
            </button>
          </div>

          <!-- Single Orange Dropdown Button -->
          <div class="relative add-employee-dropdown-container">
            <button
              type="button"
              class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              @click="showAddDropdown = !showAddDropdown"
            >
              <span>+ Add Employee</span>
              <span class="text-[9px] transition-transform duration-200" :class="{ 'rotate-180': showAddDropdown }">▼</span>
            </button>

            <!-- Dropdown Options -->
            <div
              v-if="showAddDropdown"
              class="absolute right-0 mt-1 bg-white border border-line rounded-lg shadow-lg z-20 w-44 overflow-hidden"
            >
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-[11px] text-ink hover:bg-[#FAFAFA] font-medium transition-colors"
                @click="navigateAdd('normal')"
              >
                Normal Employee
              </button>
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-[11px] text-ink hover:bg-[#FAFAFA] font-medium transition-colors border-t border-line"
                @click="navigateAdd('freelance')"
              >
                Freelance Employee
              </button>
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-[11px] text-ink hover:bg-[#FAFAFA] font-medium transition-colors border-t border-line"
                @click="navigateAdd('internship')"
              >
                Internship Employee
              </button>
            </div>
          </div>
        </div>
      </template>
    </UiPageHeader>

    <!-- Filters Section (Global & Custom) -->
    <div class="flex flex-wrap items-center gap-3 my-4 p-4 bg-white border border-line rounded-xl shadow-sm">
      <!-- Status Filter (Custom for Employee Database) -->
      <div class="flex-1 min-w-[150px]">
        <UiSelectSearch
          v-model="globalFilter.status"
          :options="employeeStatusOptions"
          placeholder="All Status"
        />
      </div>

      <!-- PT, Team, Position Filters (Global) -->
      <UiGlobalFilterBar :show-status="false" />

      <!-- Custom Filters (Local) -->
      <div class="flex-1 min-w-[150px]">
        <input
          v-model="filterName"
          placeholder="Input Name"
          class="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
        />
      </div>
      <div class="flex-1 min-w-[150px]">
        <input
          v-model="filterNik"
          placeholder="Input NIK"
          class="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
        />
      </div>

      <!-- Action Button -->
      <button
        type="button"
        class="text-xs px-5 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg transition-all shadow-sm"
        @click="fetchEmployees"
      >
        APPLY FILTERS
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <span class="text-sm text-ink-soft animate-pulse">Memuat data karyawan...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white border border-line rounded-xl">
      <p class="text-ink-soft text-sm">Tidak ada karyawan yang ditemukan.</p>
    </div>

    <!-- Content Views -->
    <template v-else>
      <!-- Grid View (Card layout matching mockup) -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
        <div
          v-for="row in rows"
          :key="row.id"
          class="bg-white rounded-xl shadow-sm border border-line overflow-hidden relative flex flex-col hover:shadow-md transition-all"
        >
          <!-- PT Header Band (Centered Text) -->
          <div :class="[getCompanyColor(row.company?.code), 'px-3 py-2 flex items-center justify-center relative text-xs tracking-wider font-semibold']">
            <span>{{ row.company?.code || '-' }}</span>

            <!-- Actions Dropdown ⋮ absolute right-3 -->
            <div class="absolute right-3 card-menu-container">
              <button
                type="button"
                class="p-0.5 rounded hover:bg-black/10 transition-colors leading-none"
                @click.stop="openMenuId = openMenuId === row.id ? null : row.id"
              >
                <span class="text-sm font-bold">⋮</span>
              </button>

              <div
                v-if="openMenuId === row.id"
                class="absolute right-0 mt-1 bg-white border border-line rounded-lg shadow-lg z-20 w-40 overflow-hidden"
              >
                <UiTableActions
                  :show-to="`/master/employees/${row.id}`"
                  :edit-to="`/master/employees/${row.id}/edit`"
                  @delete="onDelete(row)"
                >
                  <button
                    v-if="row.status !== 0"
                    type="button"
                    class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
                    @click="onInactive(row)"
                  >
                    <UserX class="w-3.5 h-3.5 text-amber-500" />
                    <span>Nonaktifkan</span>
                  </button>
                  <button
                    type="button"
                    class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
                    @click="onPrint(row)"
                  >
                    <Printer class="w-3.5 h-3.5 text-purple-500" />
                    <span>Cetak Profile</span>
                  </button>
                </UiTableActions>
              </div>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="p-5 flex-1 flex flex-col items-center text-center">
            <!-- Profile Photo -->
            <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-line bg-gray-50 flex items-center justify-center shrink-0 mb-3 shadow-inner">
              <img
                :src="row.photoPath || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}&background=random`"
                alt="Avatar"
                class="w-full h-full object-cover"
                style="image-rendering: -webkit-optimize-contrast;"
                @error="($event.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}&background=random`"
              />
            </div>

            <!-- Full Name -->
            <h3 class="font-bold text-[14px] text-ink line-clamp-1 mb-1">{{ row.fullName }}</h3>

            <!-- Dept - Div - Position (Uppercase) -->
            <p class="text-[10px] text-ink-soft uppercase leading-tight line-clamp-2 min-h-[30px]">
              {{ row.department?.name || '-' }} · {{ row.division?.name || '-' }} · {{ row.position?.title || '-' }}
            </p>

            <!-- Employee NIK/Code -->
            <p class="text-[11px] font-semibold text-ink-soft mt-3 mb-1">
              {{ row.employeeCode }}
            </p>

            <!-- Status Label -->
            <p :class="[statusMap[row.status]?.colorClass || 'text-ink-soft', 'text-[11px] font-bold tracking-wider']">
              {{ statusMap[row.status]?.label || 'ACTIVE' }}
            </p>

            <!-- Join Date -->
            <p class="text-[11px] text-ink-soft mt-2.5">
              {{ formatJoinDate(row.joinDate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- List View (Standard Drizzle Table) -->
      <div v-else class="mt-4">
        <UiCardTable>
          <UiDataTable :columns="columns" :rows="rows">
            <template #cell-company="{ row }">{{ (row as Employee).company?.code || '-' }}</template>
            <template #cell-department="{ row }">{{ (row as Employee).department?.name || '-' }}</template>
            <template #cell-division="{ row }">{{ (row as Employee).division?.name || '-' }}</template>
            <template #cell-team="{ row }">{{ (row as Employee).team?.name || '-' }}</template>
            <template #cell-position="{ row }">{{ (row as Employee).position?.title || '-' }}</template>
            <template #cell-status="{ row }">
              <span :class="[statusMap[(row as Employee).status]?.colorClass || 'text-ink-soft', 'text-xs font-semibold']">
                {{ statusMap[(row as Employee).status]?.label || 'ACTIVE' }}
              </span>
            </template>
            <template #row-actions="{ row }">
              <UiTableActions
                :show-to="`/master/employees/${(row as Employee).id}`"
                :edit-to="`/master/employees/${(row as Employee).id}/edit`"
                @delete="onDelete(row as Employee)"
              >
                <button
                  v-if="(row as Employee).status !== 0"
                  type="button"
                  class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
                  @click="onInactive(row as Employee)"
                >
                  <UserX class="w-3.5 h-3.5 text-amber-500" />
                  <span>Nonaktifkan</span>
                </button>
                <button
                  type="button"
                  class="w-full text-left px-3 py-1.5 text-[11px] text-ink hover:bg-[#FAFAFA] flex items-center gap-2 font-medium transition-colors"
                  @click="onPrint(row as Employee)"
                >
                  <Printer class="w-3.5 h-3.5 text-purple-500" />
                  <span>Cetak Profile</span>
                </button>
              </UiTableActions>
            </template>
          </UiDataTable>
        </UiCardTable>
      </div>
    </template>
  </div>
</template>
