<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Holiday {
  id: number
  name: string
  date: string
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Nama Hari Libur', sortable: true },
  { key: 'date', label: 'Tanggal', sortable: true },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Holiday>(
  (params) => useApi('/api/v1/master-data/holidays', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'date', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Holiday | null>(null)
const formName = ref('')
const formDate = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function formatDateString(dateStr: string) {
  // Check if dateStr contains timezone info/time, and format as YYYY-MM-DD
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr
}

function openCreate() {
  editing.value = null
  formName.value = ''
  formDate.value = new Date().toISOString().split('T')[0]
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Holiday) {
  editing.value = row
  formName.value = row.name
  formDate.value = formatDateString(row.date)
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body = {
      name: formName.value,
      date: formDate.value,
    }

    if (editing.value) {
      await useApi(`/api/v1/master-data/holidays/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Hari libur berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/holidays', { method: 'POST', body })
      toast.success('Hari libur berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan hari libur'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Holiday) {
  const ok = await confirm({
    title: 'Hapus hari libur?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/holidays/${row.id}`, { method: 'DELETE' })
    toast.success('Hari libur berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus hari libur')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Holidays" breadcrumb="Master / HR Data / Holidays">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Hari Libur Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama hari libur"
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
        <template #row-date="{ row }">
          <span>{{ formatDateString(row.date) }}</span>
        </template>
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            @edit="openEdit(row as Holiday)"
            @delete="onDelete(row as Holiday)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Hari Libur' : 'Hari Libur Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Hari Libur">
            <input
              v-model="formName"
              required
              placeholder="e.g. New Year's Day"
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Tanggal">
            <UiDatePicker
              v-model="formDate"
              placeholder="Pilih Tanggal..."
            />
          </UiFormField>

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
