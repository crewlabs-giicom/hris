<script setup lang="ts">
import type { DataPribadiForm } from '~/schemas/employee-wizard.schema'

const props = defineProps<{
  modelValue: Partial<DataPribadiForm>
  // `identity` is passed through just so this step can render the NIK field — it's still
  // part of identitySchema/employees.nik, only its position in the UI moved here.
  identity: Record<string, any>
  errors?: Record<string, string>
  employeeId?: string | null
  documents: Record<string, { id: string; fileName: string; mimeType: string } | null>
}>()
const emit = defineEmits<{ 'ocr-result': [Record<string, any>]; 'document-saved': [string, any] }>()

const inputClass =
  'w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1'

function docsBaseEndpoint() {
  return props.employeeId ? `/api/v1/employees/${props.employeeId}/documents` : ''
}
function previewEndpointFor(type: string) {
  const doc = props.documents[type]
  return doc ? `${docsBaseEndpoint()}/${doc.id}/download` : undefined
}
</script>

<template>
  <div class="space-y-3">
    <UiCardForm>
      <h4 class="text-[12.5px] font-bold text-ink mb-3">Data KTP</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-0 mb-3">
        <UiFileUploadSlot
          :model-value="documents.ktp"
          :endpoint="docsBaseEndpoint()"
          :preview-endpoint="previewEndpointFor('ktp')"
          :extra-fields="{ documentType: 'ktp' }"
          ocr
          label="Foto KTP"
          @update:model-value="(doc) => emit('document-saved', 'ktp', doc)"
          @ocr-result="(payload) => emit('ocr-result', payload)"
        />
        <UiFileUploadSlot
          :model-value="documents.npwp"
          :endpoint="docsBaseEndpoint()"
          :preview-endpoint="previewEndpointFor('npwp')"
          :extra-fields="{ documentType: 'npwp' }"
          label="Foto NPWP"
          @update:model-value="(doc) => emit('document-saved', 'npwp', doc)"
        />
      </div>
      <p v-if="!employeeId" class="text-[11px] text-ink-soft mb-3">
        File yang dipilih akan diunggah otomatis begitu data Identitas tersimpan.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-0">
        <UiFormField label="NIK" :error="errors?.nik">
          <input v-model="identity.nik" placeholder="16 digit sesuai KTP" :class="inputClass" />
        </UiFormField>
        <UiFormField label="Tgl Lahir" :error="errors?.birthDate">
          <UiDatePicker
            v-model="modelValue.birthDate"
            placeholder="Pilih Tanggal Lahir"
          />
        </UiFormField>
        <UiFormField label="Jenis Kelamin" :error="errors?.gender">
          <UiSelectSearch
            v-model="modelValue.gender"
            :options="[
              { id: 'male', label: 'Laki-laki' },
              { id: 'female', label: 'Perempuan' },
            ]"
          />
        </UiFormField>
        <UiFormField label="Agama" :error="errors?.religion">
          <UiSelectSearch v-model="modelValue.religion" :options="['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']" />
        </UiFormField>
        <UiFormField label="Golongan Darah" :error="errors?.bloodType">
          <UiSelectSearch v-model="modelValue.bloodType" :options="['A', 'B', 'AB', 'O']" />
        </UiFormField>
        <UiFormField label="Status Pernikahan" :error="errors?.maritalStatus">
          <UiSelectSearch v-model="modelValue.maritalStatus" :options="['Belum Menikah', 'Menikah', 'Cerai']" />
        </UiFormField>
        <UiFormField label="NPWP" :error="errors?.npwp">
          <input v-model="modelValue.npwp" :class="inputClass" />
        </UiFormField>
      </div>

      <UiFormField label="Alamat KTP" :error="errors?.ktpAddress">
        <textarea v-model="modelValue.ktpAddress" rows="2" :class="inputClass" />
      </UiFormField>
    </UiCardForm>

    <UiCardForm>
      <h4 class="text-[12.5px] font-bold text-ink mb-3">Alamat Domisili</h4>
      <UiFormField label="Alamat Domisili" :error="errors?.domicileAddress">
        <textarea v-model="modelValue.domicileAddress" rows="2" :class="inputClass" />
      </UiFormField>
      <UiFormField label="Kepemilikan" :error="errors?.domicileOwnership">
        <UiSelectSearch v-model="modelValue.domicileOwnership" :options="['Milik Sendiri', 'Sewa/Kontrak', 'Orang Tua', 'Dinas']" />
      </UiFormField>

      <UiFileUploadSlot
        :model-value="documents.bpjs"
        :endpoint="docsBaseEndpoint()"
        :preview-endpoint="previewEndpointFor('bpjs')"
        :extra-fields="{ documentType: 'bpjs' }"
        label="Foto BPJS"
        @update:model-value="(doc) => emit('document-saved', 'bpjs', doc)"
      />
    </UiCardForm>
  </div>
</template>
