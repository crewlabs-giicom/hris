<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Team {
  id: string
  name: string
  leaderId: string | null
  leaderName: string | null
  picId: string | null
  picName: string | null
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Nama Tim', sortable: true },
  { key: 'leaderName', label: 'Leader' },
  { key: 'picName', label: 'PIC' },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Team>(
  (params) => useApi('/api/v1/master-data/teams', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Team | null>(null)
const formName = ref('')
const formLeaderId = ref('')
const formPicId = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formName.value = ''
  formLeaderId.value = ''
  formPicId.value = ''
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Team) {
  editing.value = row
  formName.value = row.name
  formLeaderId.value = row.leaderId ?? ''
  formPicId.value = row.picId ?? ''
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body: Record<string, unknown> = { name: formName.value }
    if (formLeaderId.value) body.leaderId = formLeaderId.value
    if (formPicId.value) body.picId = formPicId.value
    if (editing.value) {
      await useApi(`/api/v1/master-data/teams/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Tim berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/teams', { method: 'POST', body })
      toast.success('Tim berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan tim'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Team) {
  const ok = await confirm({
    title: 'Hapus tim?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/teams/${row.id}`, { method: 'DELETE' })
    toast.success('Tim berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus tim')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Team" breadcrumb="Master / HR Data / Team">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Tim Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama tim"
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
        <template #cell-leaderName="{ value }">{{ value || '-' }}</template>
        <template #cell-picName="{ value }">{{ value || '-' }}</template>
        <template #row-actions="{ row }">
          <UiTableActions
            :show-action="false"
            @edit="openEdit(row as Team)"
            @delete="onDelete(row as Team)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Tim' : 'Tim Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Tim">
            <input
              v-model="formName"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Leader">
            <UiSelectSearch v-model="formLeaderId" endpoint="/api/v1/employees" label-key="fullName" />
          </UiFormField>

          <UiFormField label="PIC">
            <UiSelectSearch v-model="formPicId" endpoint="/api/v1/employees" label-key="fullName" />
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
