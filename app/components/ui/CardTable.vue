<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="bg-white border border-line border-t-2 border-t-topbar-1 rounded-card overflow-hidden">
    <div v-if="title || $slots.header" class="flex items-center justify-between px-4 py-2.5 border-b border-line">
      <div v-if="title" class="text-[12.5px] font-bold text-ink">{{ title }}</div>
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>
