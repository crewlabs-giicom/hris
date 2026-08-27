<script setup lang="ts">
defineProps<{ label: string; error?: string }>()
</script>

<template>
  <div class="mb-3.5">
    <label class="block text-[11.5px] font-semibold text-ink mb-1.5">{{ label }}</label>
    <slot />
    <p v-if="error" class="text-red-600 text-[11px] mt-1">{{ error }}</p>
  </div>
</template>
