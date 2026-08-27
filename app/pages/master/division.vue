<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Division {
  id: string
  name: string
  code: string
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Nama Divisi', sortable: true },
  { key: 'code', label: 'Kode', sortable: true },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Division>(
  (params) => useApi('/api/v1/master-data/divisions', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Division | null>(null)
const formName = ref('')
const formCode = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formName.value = ''
  formCode.value = ''
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Division) {
  editing.value = row
  formName.value = row.name
  formCode.value = row.code
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body = { name: formName.value, code: formCode.value }
    if (editing.value) {
      await useApi(`/api/v1/master-data/divisions/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Divisi berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/divisions', { method: 'POST', body })
      toast.success('Divisi berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan divisi'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Division) {
  const ok = await confirm({
    title: 'Hapus divisi?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/divisions/${row.id}`, { method: 'DELETE' })
    toast.success('Divisi berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus divisi')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Division" breadcrumb="Master / HR Data / Division">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Divisi Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama divisi"
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
            @edit="openEdit(row as Division)"
            @delete="onDelete(row as Division)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Divisi' : 'Divisi Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Divisi">
            <input
              v-model="formName"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Kode">
            <input
              v-model="formCode"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
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
