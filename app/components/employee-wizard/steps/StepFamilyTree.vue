<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { FamilyTreeItem } from '~/schemas/employee-wizard.schema'

interface FamilyTreeRow extends FamilyTreeItem {
  id: string
}

const props = defineProps<{ employeeId?: string | null }>()

const rows = ref<FamilyTreeRow[]>([])
const loading = ref(false)
const saving = ref<string | null>(null) // row id currently saving, or 'new'

const inputClass =
  'w-full text-[12.5px] px-2.5 py-1.5 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1'

async function load() {
  if (!props.employeeId) return
  loading.value = true
  try {
    const res = await useApi<{ data: FamilyTreeRow[] }>(`/api/v1/employees/${props.employeeId}/family-tree`)
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

async function addRow() {
  if (!props.employeeId) return
  saving.value = 'new'
  try {
    const res = await useApi<{ data: FamilyTreeRow }>(`/api/v1/employees/${props.employeeId}/family-tree`, {
      method: 'POST',
      body: {},
    })
    rows.value.push(res.data)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menambah data keluarga')
  } finally {
    saving.value = null
  }
}

async function saveRow(row: FamilyTreeRow) {
  saving.value = row.id
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/family-tree/${row.id}`, {
      method: 'PUT',
      body: {
        name: row.name,
        relation: row.relation,
        gender: row.gender || undefined,
        birthDate: row.birthDate || undefined,
        lastEducation: row.lastEducation || undefined,
        lastWork: row.lastWork || undefined,
        lastInstitute: row.lastInstitute || undefined,
      },
    })
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan data keluarga')
  } finally {
    saving.value = null
  }
}

async function removeRow(row: FamilyTreeRow) {
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/family-tree/${row.id}`, { method: 'DELETE' })
    rows.value = rows.value.filter((r) => r.id !== row.id)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus data keluarga')
  }
}

watch(() => props.employeeId, load, { immediate: true })
</script>

<template>
  <UiCardForm>
    <p v-if="!employeeId" class="text-[11px] text-ink-soft mb-3">
      Isi step Identitas dan klik Lanjut dulu supaya Susunan Keluarga bisa diisi.
    </p>

    <div v-for="row in rows" :key="row.id" class="relative border border-line rounded-lg p-3.5 mb-3 bg-[#FBFBFC]">
      <button type="button" class="absolute top-2.5 right-2.5 text-ink-soft hover:text-red-600 text-xs" @click="removeRow(row)">
        &#10005;
      </button>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
        <UiFormField label="Hubungan">
          <UiSelectSearch
            v-model="row.relation"
            :options="['Ayah', 'Ibu', 'Kakek', 'Nenek', 'Anak', 'Cucu']"
            @update:model-value="saveRow(row)"
          />
        </UiFormField>
        <UiFormField label="Nama">
          <input v-model="row.name" placeholder="Nama" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Jenis Kelamin">
          <UiSelectSearch
            v-model="row.gender"
            :options="[
              { id: 'L', label: 'Laki-laki' },
              { id: 'P', label: 'Perempuan' },
            ]"
            @update:model-value="saveRow(row)"
          />
        </UiFormField>
        <UiFormField label="Tanggal Lahir">
          <UiDatePicker v-model="row.birthDate" placeholder="Pilih Tanggal..." @update:model-value="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Pendidikan Terakhir">
          <input v-model="row.lastEducation" placeholder="Contoh: SMA / S1" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Pekerjaan Terakhir">
          <input v-model="row.lastWork" placeholder="Contoh: Wiraswasta" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Instansi Terakhir">
          <input v-model="row.lastInstitute" placeholder="Nama perusahaan/instansi" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
      </div>
      <p v-if="saving === row.id" class="text-[10.5px] text-ink-soft mt-1">Menyimpan...</p>
    </div>

    <p v-if="!loading && !rows.length && employeeId" class="text-[11.5px] text-ink-soft mb-3">Belum ada data keluarga.</p>

    <UiButton type="button" variant="secondary" :disabled="!employeeId" :loading="saving === 'new'" @click="addRow">
      + Tambah Anggota
    </UiButton>
  </UiCardForm>
</template>
