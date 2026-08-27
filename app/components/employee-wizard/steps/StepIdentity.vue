<script setup lang="ts">
import type { IdentityForm } from '~/schemas/employee-wizard.schema'

// `modelValue` is the same Pinia-reactive object the whole time (WizardLayout never
// reassigns it) — fields mutate it in place via v-model instead of emitting a replacement
// object per keystroke, which avoids stale-prop races when typing across fields quickly.
const props = defineProps<{
  modelValue: Partial<IdentityForm>
  errors?: Record<string, string>
  employeeId?: string | null
  hasPhoto?: boolean
}>()
const emit = defineEmits<{ 'photo-uploaded': [] }>()

// The photo endpoint only stores a disk path, not {id,fileName,mimeType} like documents — this
// synthesizes the shape FileUploadSlot expects so it can render "already uploaded" after a
// reload instead of always showing the empty picker (it has no other way to know a photo exists).
const photoModelValue = computed(() =>
  props.hasPhoto ? { fileName: 'Foto Profil', mimeType: 'image/jpeg' } : null
)

// Called by WizardLayout right after auto-create, before it navigates away from this step —
// see FileUploadSlot's `uploadPendingTo` for why the normal endpoint-watch can't do this itself.
const photoSlotRef = ref<{ uploadPendingTo: (endpoint: string) => Promise<boolean> } | null>(null)
async function flushPendingPhoto(endpoint: string) {
  return (await photoSlotRef.value?.uploadPendingTo(endpoint)) ?? false
}
defineExpose({ flushPendingPhoto })
</script>

<template>
  <UiCardForm>
    <UiFormField label="Foto Profil">
      <UiFileUploadSlot
        ref="photoSlotRef"
        :model-value="photoModelValue"
        :endpoint="employeeId ? `/api/v1/employees/${employeeId}/photo` : ''"
        :preview-endpoint="employeeId ? `/api/v1/employees/${employeeId}/photo` : undefined"
        disabled-hint="Tersimpan — akan diunggah otomatis setelah klik Lanjut"
        accept="image/jpeg,image/png"
        label=""
        @update:model-value="emit('photo-uploaded')"
      />
    </UiFormField>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 sm:gap-y-0">
      <UiFormField label="Kode Karyawan" :error="errors?.employeeCode">
        <input
          v-model="modelValue.employeeCode"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>

      <UiFormField label="Nama Lengkap" :error="errors?.fullName">
        <input
          v-model="modelValue.fullName"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>

      <UiFormField label="Email" :error="errors?.email">
        <input
          v-model="modelValue.email"
          type="email"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>

      <UiFormField label="No. Telepon" :error="errors?.phone">
        <input
          v-model="modelValue.phone"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>

      <UiFormField label="Instagram" :error="errors?.instagram">
        <input
          v-model="modelValue.instagram"
          placeholder="@username"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>

      <UiFormField label="Tiktok" :error="errors?.tiktok">
        <input
          v-model="modelValue.tiktok"
          placeholder="@username"
          class="w-full text-[13px] px-3 py-2 border border-line rounded-lg bg-white outline-none text-ink focus:border-topbar-1"
        />
      </UiFormField>
    </div>
  </UiCardForm>
</template>
