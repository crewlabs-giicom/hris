<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { DataTableColumn } from '~/components/ui/DataTable.vue'

definePageMeta({ middleware: ['auth'] })

useHead({
  title: 'Room Master',
})

interface Room {
  id: string
  name: string
  ruko: string
  floor: number
  createdAt: string
}

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Nama Ruangan', sortable: true },
  { key: 'ruko', label: 'Ruko', sortable: true },
  { key: 'floor', label: 'Lantai', sortable: true, align: 'right' },
  { key: 'createdAt', label: 'Dibuat', sortable: true },
]

const filter = useTableFilter()
const dataTable = useDataTable<Room>(
  (params) => useApi('/api/v1/master-data/rooms', { query: params }),
  { search: filter.debouncedSearch, defaultSort: [{ id: 'name', desc: false }] }
)
const { confirm } = useConfirm()

const showFormModal = ref(false)
const editing = ref<Room | null>(null)
const formName = ref('')
const formRuko = ref('')
const formFloor = ref<number | null>(null)
const formError = ref('')
const saving = ref(false)

watch(filter.debouncedSearch, () => {
  dataTable.page.value = 1
  dataTable.fetch()
})

function openCreate() {
  editing.value = null
  formName.value = ''
  formRuko.value = ''
  formFloor.value = null
  formError.value = ''
  showFormModal.value = true
}

function openEdit(row: Room) {
  editing.value = row
  formName.value = row.name
  formRuko.value = row.ruko
  formFloor.value = row.floor
  formError.value = ''
  showFormModal.value = true
}

async function onSubmit() {
  if (!formName.value.trim()) {
    toast.error('Nama Ruangan wajib diisi')
    return
  }
  if (!formRuko.value.trim()) {
    toast.error('Ruko wajib diisi')
    return
  }
  if (formFloor.value === null || isNaN(formFloor.value)) {
    toast.error('Lantai wajib diisi')
    return
  }

  formError.value = ''
  saving.value = true
  try {
    const body = {
      name: formName.value.trim(),
      ruko: formRuko.value.trim(),
      floor: Number(formFloor.value),
    }

    if (editing.value) {
      await useApi(`/api/v1/master-data/rooms/${editing.value.id}`, { method: 'PUT', body })
      toast.success('Ruangan berhasil diperbarui')
    } else {
      await useApi('/api/v1/master-data/rooms', { method: 'POST', body })
      toast.success('Ruangan berhasil dibuat')
    }
    showFormModal.value = false
    await dataTable.fetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Gagal menyimpan ruangan'
  } finally {
    saving.value = false
  }
}

async function onDelete(row: Room) {
  const ok = await confirm({
    title: 'Hapus ruangan?',
    text: `"${row.name}" akan dihapus permanen.`,
    confirmText: 'Hapus',
    danger: true,
  })

  if (!ok) return
  try {
    await useApi(`/api/v1/master-data/rooms/${row.id}`, { method: 'DELETE' })
    toast.success('Ruangan berhasil dihapus')
    await dataTable.fetch()
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus ruangan')
  }
}

onMounted(() => dataTable.fetch())
</script>

<template>
  <div>
    <UiPageHeader title="Room" breadcrumb="HR / Room">
      <template #actions>
        <UiButton variant="primary" @click="openCreate">+ Ruangan Baru</UiButton>
      </template>
    </UiPageHeader>

    <UiFilterBar>
      <input
        v-model="filter.search.value"
        placeholder="Cari nama ruangan..."
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
            @edit="openEdit(row as Room)"
            @delete="onDelete(row as Room)"
          />
        </template>

        <template #cell-floor="{ row }">
          {{ row.floor }}
        </template>

        <template #cell-createdAt="{ row }">
          {{ new Date(row.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
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

    <UiModal v-model="showFormModal" :title="editing ? 'Edit Ruangan' : 'Ruangan Baru'">
      <UiCardForm>
        <form @submit.prevent="onSubmit">
          <UiFormField label="Nama Ruangan">
            <input
              v-model="formName"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Ruko">
            <input
              v-model="formRuko"
              required
              class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
            />
          </UiFormField>

          <UiFormField label="Lantai">
            <input
              v-model.number="formFloor"
              type="number"
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
