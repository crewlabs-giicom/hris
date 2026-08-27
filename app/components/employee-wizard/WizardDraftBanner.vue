<script setup lang="ts">
defineProps<{ lastSavedAt: string | null }>()
const emit = defineEmits<{ resume: []; discard: [] }>()

const savedAtLabel = computed(() => {
  return (lastSavedAt: string | null) => (lastSavedAt ? new Date(lastSavedAt).toLocaleString('id-ID') : '')
})
</script>

<template>
  <div class="flex items-center justify-between gap-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-4 py-3 mb-4">
    <p class="text-[12px] text-ink">
      Ada draft belum selesai dari <strong>{{ lastSavedAt ? new Date(lastSavedAt).toLocaleString('id-ID') : '-' }}</strong>.
      Lanjutkan draft ini atau mulai dari data tersimpan di server?
    </p>
    <div class="flex items-center gap-2 shrink-0">
      <UiButton variant="secondary" @click="emit('discard')">Mulai dari server</UiButton>
      <UiButton variant="primary" @click="emit('resume')">Lanjutkan draft</UiButton>
    </div>
  </div>
</template>
