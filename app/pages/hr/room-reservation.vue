<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search, RefreshCw, Edit2, Trash2 } from 'lucide-vue-next'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Room Reservation',
})

const { confirm } = useConfirm()

// Columns declaration matching specifications
const columns: DataTableColumn[] = [
  { key: 'team', label: 'Team' },
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'date', label: 'Date' },
  { key: 'room', label: 'Room Name' },
  { key: 'type', label: 'Type' },
  { key: 'clockStart', label: 'Clock Start' },
  { key: 'clockEnd', label: 'Clock End' },
  { key: 'description', label: 'Description' },
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

const typeOptions = [
  { id: 'false', label: 'Standard' },
  { id: 'true', label: 'Event' },
]

// Local Filter States
const filterSearch = ref('')
const filterTeam = ref<string[]>([])
const filterRoom = ref<string[]>([])
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
    const res = await useApi<any>('/api/v1/room-reservations', {
      query: {
        ...params,
        search: filterSearch.value,
        teamId: filterTeam.value.join(','),
        roomId: filterRoom.value.join(','),
        month: filterMonth.value,
        year: filterYear.value,
      },
    })
    return res
  },
  { defaultPerPage: 10 }
)

// Modal States & Form Data
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)

const form = ref({
  roomId: '',
  type: 'false', // stored as string in dropdown, resolved to boolean on save
  date: '',
  clockStart: '',
  clockEnd: '',
  description: '',
})

// Time validation helpers
function getMinutesDiff(start: string, end: string): number {
  if (!start || !end) return 0
  const [sH, sM] = start.split(':').map(Number)
  const [eH, eM] = end.split(':').map(Number)
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0
  return (eH * 60 + eM) - (sH * 60 + sM)
}

const isDurationInvalid = computed(() => {
  if (form.value.type === 'false' && form.value.clockStart && form.value.clockEnd) {
    const duration = getMinutesDiff(form.value.clockStart, form.value.clockEnd)
    return duration > 180
  }
  return false
})

function openCreateModal() {
  isEdit.value = false
  editingId.value = null
  form.value = {
    roomId: '',
    type: 'false',
    date: new Date().toISOString().slice(0, 10),
    clockStart: '',
    clockEnd: '',
    description: '',
  }
  showFormModal.value = true
}

async function openEditModal(row: any) {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    roomId: String(row.roomId),
    type: String(row.type),
    date: row.date,
    clockStart: row.clockStart.slice(0, 5), // hh:mm
    clockEnd: row.clockEnd.slice(0, 5),
    description: row.description || '',
  }
  showFormModal.value = true
}

async function onDelete(row: any) {
  const ok = await confirm({
    title: 'Hapus Reservasi Ruangan?',
    text: `Pemesanan ruangan "${row.room?.name}" oleh "${row.employee?.fullName}" akan dihapus.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return

  try {
    await useApi(`/api/v1/room-reservations/${row.id}`, { method: 'DELETE' })
    toast.success('Reservasi berhasil dihapus')
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus reservasi')
  }
}

async function onSubmit() {
  if (!form.value.roomId) {
    toast.error('Pilih ruangan terlebih dahulu')
    return
  }
  if (!form.value.date) {
    toast.error('Pilih tanggal pemesanan')
    return
  }
  if (!form.value.clockStart || !form.value.clockEnd) {
    toast.error('Lengkapi jam mulai dan selesai')
    return
  }

  const duration = getMinutesDiff(form.value.clockStart, form.value.clockEnd)
  if (duration <= 0) {
    toast.error('Jam selesai harus setelah jam mulai')
    return
  }

  const isTypeEvent = form.value.type === 'true'
  if (!isTypeEvent && duration > 180) {
    toast.error('Durasi tipe Standard maksimal 3 jam')
    return
  }

  submitting.value = true
  try {
    const payload = {
      roomId: Number(form.value.roomId),
      type: isTypeEvent,
      date: form.value.date,
      clockStart: form.value.clockStart + ':00',
      clockEnd: form.value.clockEnd + ':00',
      description: form.value.description.trim(),
    }

    if (isEdit.value && editingId.value) {
      await useApi(`/api/v1/room-reservations/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      })
      toast.success('Reservasi berhasil diperbarui!')
    } else {
      await useApi('/api/v1/room-reservations', {
        method: 'POST',
        body: payload,
      })
      toast.success('Reservasi berhasil disimpan!')
    }
    showFormModal.value = false
    fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan reservasi')
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
  filterTeam.value = []
  filterRoom.value = []
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
    <UiPageHeader title="Room Reservation" breadcrumb="HR / Room Reservation">
      <template #actions>
        <button
          type="button"
          class="text-xs px-4 py-2 font-semibold text-white bg-[#F08050] hover:bg-[#E07040] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4" />
          <span>Add Room Reservation</span>
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
              placeholder="Employee name, Room, or Desc..."
              class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-line bg-white text-ink outline-none focus:border-topbar-1"
              @keyup.enter="applyFilters"
            />
            <Search class="w-3.5 h-3.5 text-ink-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
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

        <!-- Room Filter (Multiple Select) -->
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Room</label>
          <UiSelectSearch
            v-model="filterRoom"
            endpoint="/api/v1/master-data/rooms"
            placeholder="All Room"
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
        <span class="text-xs text-ink-soft animate-pulse">Memuat data reservasi ruangan...</span>
      </div>

      <div v-else-if="!rows.length" class="flex flex-col items-center py-16 bg-white rounded-xl">
        <p class="text-ink-soft text-xs">Tidak ada reservasi ruangan yang ditemukan.</p>
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
              @click="openEditModal(row)"
            >
              <Edit2 class="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-[#FAFAFA] border-t border-line"
              @click="onDelete(row)"
            >
              <Trash2 class="w-3 h-3" />
              <span>Delete</span>
            </button>
          </template>

          <!-- Cell formatting slots -->
          <template #cell-team="{ row }">
            <span class="text-ink">{{ row.employee?.team?.name || '-' }}</span>
          </template>

          <template #cell-employeeName="{ row }">
            <span class="font-medium text-ink">{{ row.employee?.fullName || '-' }}</span>
          </template>

          <template #cell-date="{ row }">
            <span class="text-ink font-semibold">{{ row.date }}</span>
          </template>

          <template #cell-room="{ row }">
            <span class="text-ink font-medium">{{ row.room?.name || '-' }}</span>
          </template>

          <template #cell-type="{ row }">
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
              :class="row.type ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'"
            >
              {{ row.type ? 'Event' : 'Standard' }}
            </span>
          </template>

          <template #cell-clockStart="{ row }">
            <span class="text-ink font-mono">{{ row.clockStart.slice(0, 5) }}</span>
          </template>

          <template #cell-clockEnd="{ row }">
            <span class="text-ink font-mono">{{ row.clockEnd.slice(0, 5) }}</span>
          </template>

          <template #cell-description="{ row }">
            <span class="truncate max-w-[180px] block" :title="row.description">{{ row.description || '-' }}</span>
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

    <!-- Form Add/Edit Modal -->
    <UiModal v-model="showFormModal" :title="isEdit ? 'Edit Reservasi Ruangan' : 'Pemesanan Ruangan Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <!-- Room Picker -->
          <UiFormField label="Room (Ruangan)">
            <UiSelectSearch
              v-model="form.roomId"
              endpoint="/api/v1/master-data/rooms"
              placeholder="Pilih Ruangan"
              :multiple="false"
            />
          </UiFormField>

          <!-- Date Picker -->
          <UiFormField label="Date (Tanggal)">
            <UiDatePicker
              v-model="form.date"
            />
          </UiFormField>

          <!-- Type Picker -->
          <UiFormField label="Type (Tipe)">
            <UiSelectSearch
              v-model="form.type"
              :options="typeOptions"
              placeholder="Pilih Tipe"
              :multiple="false"
            />
            <p class="text-[11px] text-ink-soft mt-1">
              * Jika Standard, durasi pemesanan maksimal 3 jam.
            </p>
          </UiFormField>

          <!-- Clock Start -->
          <UiFormField label="Clock Start (Jam Mulai)">
            <UiTimePicker
              v-model="form.clockStart"
            />
          </UiFormField>

          <!-- Clock End -->
          <UiFormField label="Clock End (Jam Selesai)">
            <UiTimePicker
              v-model="form.clockEnd"
            />
          </UiFormField>

          <!-- Validation Warning -->
          <div v-if="isDurationInvalid" class="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200 mb-3">
            Durasi pemesanan Standard tidak boleh melebihi 3 jam. Harap sesuaikan jam mulai dan selesai.
          </div>

          <!-- Description -->
          <UiFormField label="Description (Deskripsi)">
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              placeholder="Tuliskan tujuan reservasi ruangan..."
            ></textarea>
          </UiFormField>
        </form>
      </UiCardForm>
      <template #footer>
        <UiButton variant="secondary" @click="showFormModal = false">Batal</UiButton>
        <UiButton
          variant="primary"
          :loading="submitting"
          :disabled="isDurationInvalid"
          @click="onSubmit"
        >
          Simpan
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
