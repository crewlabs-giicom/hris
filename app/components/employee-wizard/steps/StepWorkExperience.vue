<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { WorkExperienceItem } from '~/schemas/employee-wizard.schema'

interface WorkExperienceRow extends WorkExperienceItem {
  id: string
}

const props = defineProps<{ employeeId?: string | null }>()

const rows = ref<WorkExperienceRow[]>([])
const loading = ref(false)
const saving = ref<string | null>(null) // row id currently saving, or 'new'

const inputClass =
  'w-full text-[12.5px] px-2.5 py-1.5 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1'

async function load() {
  if (!props.employeeId) return
  loading.value = true
  try {
    const res = await useApi<{ data: WorkExperienceRow[] }>(`/api/v1/employees/${props.employeeId}/work-experiences`)
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

async function addRow() {
  if (!props.employeeId) return
  saving.value = 'new'
  try {
    const res = await useApi<{ data: WorkExperienceRow }>(`/api/v1/employees/${props.employeeId}/work-experiences`, {
      method: 'POST',
      body: {},
    })
    rows.value.push(res.data)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menambah pengalaman kerja')
  } finally {
    saving.value = null
  }
}

async function saveRow(row: WorkExperienceRow) {
  saving.value = row.id
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/work-experiences/${row.id}`, {
      method: 'PUT',
      body: {
        companyName: row.companyName || undefined,
        workPosition: row.workPosition || undefined,
        workLength: row.workLength || undefined,
        salaryPerMonth: row.salaryPerMonth || undefined,
        reasonForLeaving: row.reasonForLeaving || undefined,
      },
    })
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan pengalaman kerja')
  } finally {
    saving.value = null
  }
}

async function removeRow(row: WorkExperienceRow) {
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/work-experiences/${row.id}`, { method: 'DELETE' })
    rows.value = rows.value.filter((r) => r.id !== row.id)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus pengalaman kerja')
  }
}

watch(() => props.employeeId, load, { immediate: true })
</script>

<template>
  <UiCardForm>
    <p v-if="!employeeId" class="text-[11px] text-ink-soft mb-3">
      Isi step Identitas dan klik Lanjut dulu supaya Pengalaman Kerja bisa diisi.
    </p>

    <div v-for="row in rows" :key="row.id" class="relative border border-line rounded-lg p-3.5 mb-3 bg-[#FBFBFC]">
      <button type="button" class="absolute top-2.5 right-2.5 text-ink-soft hover:text-red-600 text-xs" @click="removeRow(row)">
        &#10005;
      </button>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <UiFormField label="Nama Perusahaan">
          <input v-model="row.companyName" placeholder="PT ..." :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Posisi">
          <input v-model="row.workPosition" placeholder="Jabatan" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Lama Bekerja">
          <input v-model="row.workLength" placeholder="Contoh: 2 tahun" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Gaji per Bulan">
          <input v-model="row.salaryPerMonth" placeholder="Contoh: 5.000.000" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Alasan Keluar" class="col-span-2">
          <input v-model="row.reasonForLeaving" placeholder="Alasan keluar" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
      </div>
      <p v-if="saving === row.id" class="text-[10.5px] text-ink-soft mt-1">Menyimpan...</p>
    </div>

    <p v-if="!loading && !rows.length && employeeId" class="text-[11.5px] text-ink-soft mb-3">Belum ada pengalaman kerja.</p>

    <UiButton type="button" variant="secondary" :disabled="!employeeId" :loading="saving === 'new'" @click="addRow">
      + Tambah Pengalaman Kerja
    </UiButton>
  </UiCardForm>
</template>
