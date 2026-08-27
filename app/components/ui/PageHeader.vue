<script setup lang="ts">
defineProps<{ title: string; breadcrumb?: string }>()
</script>

<template>
  <div class="flex items-start justify-between">
    <div>
      <div class="text-[17px] font-bold text-ink">{{ title }}</div>
      <div v-if="breadcrumb" class="text-[11.5px] text-ink-soft mt-0.5">{{ breadcrumb }}</div>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
