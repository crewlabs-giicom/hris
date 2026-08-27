<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Shift {
  id: number
  code: string
  name: string
  shiftIn: string
  shiftOut: string
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'code', label: 'Kode Shift', sortable: true },
  { key: 'name', label: 'Nama Shift', sortable: true },
  { key: 'shiftIn', label: 'Jam Masuk', sortable: true },
  { key: 'shiftOut', label: 'Jam Pulang', sortable: true },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Shift>(
  (params) => useApi('/api/v1/master-data/shifts', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Shift | null>(null)
const formCode = ref('')
const formName = ref('')
const formShiftIn = ref('08:00')
const formShiftOut = ref('17:00')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formCode.value = ''
  formName.value = ''
  formShiftIn.value = '08:00'
  formShiftOut.value = '17:00'
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Shift) {
  editing.value = row
  formCode.value = row.code
  formName.value = row.name
  // Strip seconds if present for time inputs (HH:MM)
  formShiftIn.value = row.shiftIn.substring(0, 5)
  formShiftOut.value = row.shiftOut.substring(0, 5)
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    // Append seconds if not already present
    const shiftInFormatted = formShiftIn.value.length === 5 ? `${formShiftIn.value}:00` : formShiftIn.value
    const shiftOutFormatted = formShiftOut.value.length === 5 ? `${formShiftOut.value}:00` : formShiftOut.value

    const body = {
      code: formCode.value,
      name: formName.value,
      shiftIn: shiftInFormatted,
      shiftOut: shiftOutFormatted,
    }

    if (editing.value) {
      await useApi(`/api/v1/master-data/shifts/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Shift berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/shifts', { method: 'POST', body })
      toast.success('Shift berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan shift'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Shift) {
  const ok = await confirm({
    title: 'Hapus shift?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/shifts/${row.id}`, { method: 'DELETE' })
    toast.success('Shift berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus shift')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Shift Schedule" breadcrumb="Master / HR Data / Shift Schedule">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Shift Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama shift"
        class="text-xs px-2.5 py-1.5 rounded-lg border border-line bg-white text-ink flex-1 max-w-[280px]"
      />
    </UiFilterBar>

    <UiCardTable>
      <UiDataTable
        :columns="columns"
        :rows="dataTable.rows.value"
        :sorting="dataTable.sorting.value"
        @update:sorting="dataTable.setSorting"
      >
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            @edit="openEdit(row as Shift)"
            @delete="onDelete(row as Shift)"
          />
        </template>
      </UiDataTable>

      <UiPagination
        :from="dataTable.total.value === 0 ? 0 : (dataTable.page.value - 1) * dataTable.perPage.value + 1"
        :to="Math.min(dataTable.page.value * dataTable.perPage.value, dataTable.total.value)"
        :total="dataTable.total.value"
        :per-page="dataTable.perPage.value"
        @prev="dataTable.prev"
        @next="dataTable.next"
        @update:per-page="dataTable.setPerPage"
      />
    </UiCardTable>

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Shift' : 'Shift Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Kode Shift">
            <input
              v-model="formCode"
              required
              placeholder="e.g. SH-MORNING"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Nama Shift">
            <input
              v-model="formName"
              required
              placeholder="e.g. Morning Shift"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <div class="grid grid-cols-2 gap-4">
            <UiFormField label="Jam Masuk">
              <input
                v-model="formShiftIn"
                type="time"
                required
                class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              />
            </UiFormField>

            <UiFormField label="Jam Pulang">
              <input
                v-model="formShiftOut"
                type="time"
                required
                class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
              />
            </UiFormField>
          </div>

          <p v-if="formError" class="text-red-600 text-xs mb-3">{{ formError }}</p>
        </form>
      </UiCardForm>
      <template #footer>
        <UiButton variant="secondary" @click="showFormModal = false">Batal</UiButton>
        <UiButton variant="primary" :loading="saving" @click="onSubmit">Simpan</UiButton>
      </template>
    </UiModal>
  </div>
</template>
