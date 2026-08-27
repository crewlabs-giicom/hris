<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { EmergencyContactItem } from '~/schemas/employee-wizard.schema'

interface EmergencyContactRow extends EmergencyContactItem {
  id: string
}

const props = defineProps<{ employeeId?: string | null }>()

const rows = ref<EmergencyContactRow[]>([])
const loading = ref(false)
const saving = ref<string | null>(null) // row id currently saving, or 'new'

const inputClass =
  'w-full text-[12.5px] px-2.5 py-1.5 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1'

async function load() {
  if (!props.employeeId) return
  loading.value = true
  try {
    const res = await useApi<{ data: EmergencyContactRow[] }>(`/api/v1/employees/${props.employeeId}/emergency-contacts`)
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

async function addRow() {
  if (!props.employeeId) return
  saving.value = 'new'
  try {
    const res = await useApi<{ data: EmergencyContactRow }>(`/api/v1/employees/${props.employeeId}/emergency-contacts`, {
      method: 'POST',
      body: {},
    })
    rows.value.push(res.data)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menambah kontak darurat')
  } finally {
    saving.value = null
  }
}

async function saveRow(row: EmergencyContactRow) {
  saving.value = row.id
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/emergency-contacts/${row.id}`, {
      method: 'PUT',
      body: {
        name: row.name || undefined,
        relation: row.relation || undefined,
        phone: row.phone || undefined,
        address: row.address || undefined,
      },
    })
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menyimpan kontak darurat')
  } finally {
    saving.value = null
  }
}

async function removeRow(row: EmergencyContactRow) {
  try {
    await useApi(`/api/v1/employees/${props.employeeId}/emergency-contacts/${row.id}`, { method: 'DELETE' })
    rows.value = rows.value.filter((r) => r.id !== row.id)
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || 'Gagal menghapus kontak darurat')
  }
}

watch(() => props.employeeId, load, { immediate: true })
</script>

<template>
  <UiCardForm>
    <p v-if="!employeeId" class="text-[11px] text-ink-soft mb-3">
      Isi step Identitas dan klik Lanjut dulu supaya Kontak Darurat bisa diisi.
    </p>

    <div v-for="row in rows" :key="row.id" class="relative border border-line rounded-lg p-3.5 mb-3 bg-[#FBFBFC]">
      <button type="button" class="absolute top-2.5 right-2.5 text-ink-soft hover:text-red-600 text-xs" @click="removeRow(row)">
        &#10005;
      </button>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <UiFormField label="Nama">
          <input v-model="row.name" placeholder="Nama" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Hubungan">
          <input v-model="row.relation" placeholder="Contoh: Orang Tua" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="No. Telepon">
          <input v-model="row.phone" placeholder="08xxxxxxxxxx" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
        <UiFormField label="Alamat">
          <input v-model="row.address" placeholder="Alamat lengkap" :class="inputClass" @blur="saveRow(row)" />
        </UiFormField>
      </div>
      <p v-if="saving === row.id" class="text-[10.5px] text-ink-soft mt-1">Menyimpan...</p>
    </div>

    <p v-if="!loading && !rows.length && employeeId" class="text-[11.5px] text-ink-soft mb-3">Belum ada kontak darurat.</p>

    <UiButton type="button" variant="secondary" :disabled="!employeeId" :loading="saving === 'new'" @click="addRow">
      + Tambah Kontak Darurat
    </UiButton>
  </UiCardForm>
</template>
