<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Position {
  id: string
  title: string
  code: string
  departmentId: string | null
  createdAt: string
}

interface Department {
  id: string
  name: string
}

const columns: DataTableColumn[] = [
  { key: 'title', label: 'Posisi', sortable: true },
  { key: 'code', label: 'Kode', sortable: true },
  { key: 'departmentId', label: 'Departemen' },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Position>(
  (params) => useApi('/api/v1/master-data/positions', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'title', desc: false }] }
)
const { confirm } = useConfirm()

const allDepartments = ref<Department[]>([])
const departmentName = (id: string | null) => allDepartments.value.find((d) => d.id === id)?.name || '-'

const showFormModal = ref(false)
const editing = ref<Position | null>(null)
const formTitle = ref('')
const formCode = ref('')
const formDepartmentId = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

async function fetchDepartments() {
  const res = await useApi<{ data: Department[] }>('/api/v1/master-data/departments', { query: { perPage: 100 } })
  allDepartments.value = res.data
}

function openCreate() {
  editing.value = null
  formTitle.value = ''
  formCode.value = ''
  formDepartmentId.value = ''
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Position) {
  editing.value = row
  formTitle.value = row.title
  formCode.value = row.code
  formDepartmentId.value = row.departmentId ?? ''
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body: Record<string, unknown> = { title: formTitle.value, code: formCode.value }
    if (formDepartmentId.value) body.departmentId = formDepartmentId.value
    if (editing.value) {
      await useApi(`/api/v1/master-data/positions/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Posisi berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/positions', { method: 'POST', body })
      toast.success('Posisi berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan posisi'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Position) {
  const ok = await confirm({
    title: 'Hapus posisi?',
    text: `"${row.title}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/positions/${row.id}`, { method: 'DELETE' })
    toast.success('Posisi berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus posisi')
  }
}

onMounted(async () => {
  await Promise.all([dataTable.fetch(), fetchDepartments()])
})
</script>

<template>
  <div>
    <UiPageHeader title="Position" breadcrumb="Master / HR Data / Position">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Posisi Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama posisi"
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
        <template #cell-departmentId="{ value }">{{ departmentName(value) }}</template>
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            @edit="openEdit(row as Position)"
            @delete="onDelete(row as Position)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Posisi' : 'Posisi Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Posisi">
            <input
              v-model="formTitle"
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

          <UiFormField label="Departemen">
            <UiSelectSearch
              v-model="formDepartmentId"
              endpoint="/api/v1/master-data/departments"
              label-key="name"
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
