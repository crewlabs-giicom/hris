<script setup lang="ts">
import type { BankingForm } from '~/schemas/employee-wizard.schema'

const props = defineProps<{
  modelValue: Partial<BankingForm>
  errors?: Record<string, string>
  employeeId?: string | null
  documents: Record<string, { id: string; fileName: string; mimeType: string } | null>
}>()
const emit = defineEmits<{ 'document-saved': [string, any] }>()

function docsBaseEndpoint() {
  return props.employeeId ? `/api/v1/employees/${props.employeeId}/documents` : ''
}
const previewEndpoint = computed(() => {
  const doc = props.documents.bank_account
  return doc ? `${docsBaseEndpoint()}/${doc.id}/download` : undefined
})
</script>

<template>
  <UiCardForm class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-0">
    <UiFormField label="Bank" :error="errors?.bankId">
      <UiSelectSearch v-model="modelValue.bankId" endpoint="/api/v1/master-data/banks" label-key="name" />
    </UiFormField>

    <UiFormField label="No. Rekening" :error="errors?.accountNumber">
      <input
        v-model="modelValue.accountNumber"
        class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
      />
    </UiFormField>

    <UiFileUploadSlot
      class="col-span-2"
      :model-value="documents.bank_account"
      :endpoint="docsBaseEndpoint()"
      :preview-endpoint="previewEndpoint"
      :extra-fields="{ documentType: 'bank_account' }"
      label="Foto Rekening"
      @update:model-value="(doc) => emit('document-saved', 'bank_account', doc)"
    />
  </UiCardForm>
</template>
