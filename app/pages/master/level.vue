<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

interface Level {
  id: string
  name: string
  baseSalary: string
  mealAllowance: string
  otherAllowance: string
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Level', sortable: true },
  { key: 'baseSalary', label: 'Gaji Pokok', sortable: true, align: 'right' },
  { key: 'mealAllowance', label: 'Uang Makan', align: 'right' },
  { key: 'otherAllowance', label: 'Tunjangan Lain', align: 'right' },
]

const filter = useTableFilter()
const dataTable = useDataTable<Level>(
  (params) => useApi('/api/v1/master-data/levels', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Level | null>(null)
const formName = ref('')
const formBaseSalary = ref('')
const formMealAllowance = ref('')
const formOtherAllowance = ref('')
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formName.value = ''
  formBaseSalary.value = ''
  formMealAllowance.value = ''
  formOtherAllowance.value = ''
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Level) {
  editing.value = row
  formName.value = row.name
  formBaseSalary.value = row.baseSalary
  formMealAllowance.value = row.mealAllowance
  formOtherAllowance.value = row.otherAllowance
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const body = {
      name: formName.value,
      baseSalary: formBaseSalary.value,
      mealAllowance: formMealAllowance.value,
      otherAllowance: formOtherAllowance.value,
    }
    if (editing.value) {
      await useApi(`/api/v1/master-data/levels/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Level berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/levels', { method: 'POST', body })
      toast.success('Level berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan level'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Level) {
  const ok = await confirm({
    title: 'Hapus level?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })
  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/levels/${row.id}`, { method: 'DELETE' })
    toast.success('Level berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus level')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Level" breadcrumb="Master / HR Data / Level">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Level Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama level"
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
            @edit="openEdit(row as Level)"
            @delete="onDelete(row as Level)"
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Level' : 'Level Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Level">
            <input
              v-model="formName"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Gaji Pokok">
            <input
              v-model="formBaseSalary"
              inputmode="decimal"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Uang Makan">
            <input
              v-model="formMealAllowance"
              inputmode="decimal"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Tunjangan Lain">
            <input
              v-model="formOtherAllowance"
              inputmode="decimal"
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
