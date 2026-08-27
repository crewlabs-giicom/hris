<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Permission {
  id: string
  name: string
  guardName: string
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'guardName', label: 'Guard Name', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Permission>(
  (params) => useApi('/api/v1/admin/permissions', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Permission | null>(null)
const formName = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formName.value = ''
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Permission) {
  editing.value = row
  formName.value = row.name
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await useApi(`/api/v1/admin/permissions/${editing.value.id}`, {
        method: 'PUT',
        body: { name: formName.value },
      })
      toast.success('Permission updated')
    } else {
      await useApi('/api/v1/admin/permissions', {
        method: 'POST',
        body: { name: formName.value },
      })
      toast.success('Permission created')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save permission'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Permission) {
  const ok = await confirm({
    title: 'Delete permission?',
    text: `"${row.name}" will be permanently removed.`,
    confirmText: 'Delete',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/admin/permissions/${row.id}`, { method: 'DELETE' })
    toast.success('Permission deleted')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Failed to delete permission')
  }
}

onMounted(dataTable.fetch)
</script>

<template>
  <div>
    <UiPageHeader title="Permission" breadcrumb="Auth / Permission">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ New Permission</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Search by name"
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
            @edit="openEdit(row)"
            @delete="onDelete(row)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Permission' : 'New Permission'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Name">
            <input
              v-model="formName"
              type="text"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>
          <p v-if="formError" class="text-red-600 text-xs mb-3">{{ formError }}</p>
        </form>
      </UiCardForm>
      <template #footer>
        <UiButton variant="secondary" @click="showFormModal = false">Cancel</UiButton>
        <UiButton variant="primary" :loading="saving" @click="onSubmit">Save</UiButton>
      </template>
    </UiModal>
  </div>
</template>
