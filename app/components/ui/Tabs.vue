<script setup lang="ts">
defineProps<{ tabs: string[]; modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex items-center gap-4 px-4 pt-2.5 border-b border-line text-[12.5px] font-semibold">
    <div
      v-for="tab in tabs"
      :key="tab"
      class="pb-2 border-b-2 cursor-pointer"
      :class="tab === modelValue ? 'text-topbar-1 border-topbar-1' : 'text-ink-soft border-transparent'"
      @click="$emit('update:modelValue', tab)"
    >
      {{ tab }}
    </div>
  </div>
</template>
